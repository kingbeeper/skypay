"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getCurrentUser } from "@/lib/auth";
import { fetchPrices } from "@/lib/prices";
import { ASSETS, type AssetSymbol } from "@/lib/assets";
import {
  getOrCreateCurrentRound,
  nextDrawDate,
  pickWinner,
} from "@/lib/raffle";
import { MIN_USD_FOR_CARD } from "@/lib/cards";
import {
  generateTxHash,
  isCryptoAsset,
  isValidAddress,
  shortenAddress,
} from "@/lib/addresses";
import { setThemeCookie, type Theme } from "@/lib/theme";
import { notify } from "@/lib/notifications";
import { generateTotpSecret, totpUri, verifyTotp } from "@/lib/totp";
import { logAudit } from "@/lib/audit";
import { grantAchievement } from "@/lib/achievements";
import { ensureReferralCode } from "@/lib/referral";

export type AuthResult = { error: string } | undefined;
export type SwapResult =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | undefined;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signupAction(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;

  if (!isValidEmail(email)) return { error: "Correo no válido" };
  if (password.length < 8)
    return { error: "La contraseña debe tener al menos 8 caracteres" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Ya existe una cuenta con ese correo" };

  const ref = String(formData.get("ref") ?? "").trim().toUpperCase();

  let referredById: string | null = null;
  let initialUsd = 0;
  if (ref) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: ref },
      select: { id: true },
    });
    if (referrer) {
      referredById = referrer.id;
      initialUsd = 10; // welcome bonus for using a referral code
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      // kycStatus defaults to "pending" — user verifies from /dashboard/settings
      referredById,
      balances: {
        create: [{ asset: "USDC", amount: initialUsd }],
      },
    },
  });

  // Reward the referrer too
  if (referredById) {
    await prisma.balance.upsert({
      where: { userId_asset: { userId: referredById, asset: "USDC" } },
      update: { amount: { increment: 10 } },
      create: { userId: referredById, asset: "USDC", amount: 10 },
    });
    await notify({
      userId: referredById,
      type: "referral",
      title: `Bonus de referido · +$10`,
      body: `${email} se registró con tu código.`,
      link: "/dashboard/refer",
    });
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.isDemo = false;
  await session.save();

  redirect("/dashboard");
}

export type LoginActionResult =
  | { error: string }
  | { totpRequired: true; email: string }
  | { locked: true; until: string }
  | undefined;

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

function computeStreak(prevLogin: Date | null): number {
  if (!prevLogin) return 1;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const prevDay = new Date(prevLogin.getFullYear(), prevLogin.getMonth(), prevLogin.getDate());
  const diffDays = Math.round((startOfToday.getTime() - prevDay.getTime()) / 86_400_000);
  if (diffDays === 0) return 0; // same day → no streak change (caller keeps current)
  if (diffDays === 1) return 1; // consecutive day → +1
  return -1; // streak broken → reset to 1
}

export async function loginAction(
  _prev: LoginActionResult,
  formData: FormData
): Promise<LoginActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const totpToken = String(formData.get("totpToken") ?? "").replace(/\s/g, "");
  const recoveryCode = String(formData.get("recoveryCode") ?? "").trim().toLowerCase();

  if (!email || !password) return { error: "Faltan campos" };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Credenciales inválidas" };

  // Account lockout check
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { locked: true, until: user.lockedUntil.toISOString() };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const failed = user.failedLogins + 1;
    const shouldLock = failed >= MAX_FAILED_LOGINS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: shouldLock ? 0 : failed,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
          : null,
      },
    });
    if (shouldLock) {
      await notify({
        userId: user.id,
        type: "security",
        title: "Cuenta bloqueada temporalmente",
        body: `Demasiados intentos fallidos. Bloqueada ${LOCKOUT_MINUTES} min.`,
        link: "/dashboard/settings",
      });
      return {
        locked: true,
        until: new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString(),
      };
    }
    const remaining = MAX_FAILED_LOGINS - failed;
    return {
      error: `Credenciales inválidas (${remaining} ${remaining === 1 ? "intento restante" : "intentos restantes"})`,
    };
  }

  if (user.totpEnabled && user.totpSecret) {
    // Allow either TOTP token OR a recovery code
    if (!totpToken && !recoveryCode) {
      return { totpRequired: true, email: user.email };
    }
    let verified = false;
    let consumedRecovery: string | null = null;
    if (totpToken) {
      if (/^\d{6}$/.test(totpToken) && verifyTotp(user.totpSecret, totpToken)) {
        verified = true;
      }
    } else if (recoveryCode) {
      const codes: string[] = user.recoveryCodes ? JSON.parse(user.recoveryCodes) : [];
      const normalized = recoveryCode.replace(/[^a-z0-9]/g, "");
      const matchIdx = codes.findIndex((c) => c === normalized);
      if (matchIdx >= 0) {
        verified = true;
        consumedRecovery = normalized;
        codes.splice(matchIdx, 1);
        await prisma.user.update({
          where: { id: user.id },
          data: { recoveryCodes: JSON.stringify(codes) },
        });
      }
    }
    if (!verified) {
      return { error: "Código 2FA o recovery code incorrecto" };
    }
    if (consumedRecovery) {
      await notify({
        userId: user.id,
        type: "security",
        title: "Recovery code usado",
        body: "Se usó uno de tus códigos de recuperación. Genera nuevos si te quedan pocos.",
        link: "/dashboard/settings",
      });
    }
  }

  // Successful login: reset failed counter, update streak/lastLogin, notify
  const streakDelta = computeStreak(user.lastLoginAt);
  const newStreak =
    streakDelta === 0
      ? user.streakDays
      : streakDelta === 1
        ? user.streakDays + 1
        : 1;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLogins: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      streakDays: newStreak,
    },
  });

  if (newStreak >= 7) {
    grantAchievement(user.id, "streak_7").catch(() => {});
  }

  // Fire-and-forget login alert (don't block login if notify fails)
  notify({
    userId: user.id,
    type: "login",
    title: "Nuevo inicio de sesión",
    body: `Sesión iniciada · ${new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}`,
    link: "/dashboard/settings",
  }).catch(() => {
    // ignore
  });

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.isDemo = user.isDemo;
  await session.save();

  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}

const ASSET_KEYS = Object.keys(ASSETS) as AssetSymbol[];

function isAssetSymbol(v: string): v is AssetSymbol {
  return (ASSET_KEYS as string[]).includes(v);
}

export async function swapAction(
  _prev: SwapResult,
  formData: FormData
): Promise<SwapResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.kycStatus !== "approved") {
    return { ok: false, error: "Verifica tu identidad primero (Ajustes → KYC)" };
  }

  const fromAsset = String(formData.get("fromAsset") ?? "");
  const toAsset = String(formData.get("toAsset") ?? "");
  const fromAmountRaw = String(formData.get("fromAmount") ?? "");
  const fromAmount = Number(fromAmountRaw);

  if (!isAssetSymbol(fromAsset) || !isAssetSymbol(toAsset)) {
    return { ok: false, error: "Activos inválidos" };
  }
  if (fromAsset === toAsset) {
    return { ok: false, error: "Elige dos activos distintos" };
  }
  if (!Number.isFinite(fromAmount) || fromAmount <= 0) {
    return { ok: false, error: "Monto inválido" };
  }

  const fromBalance = user.balances.find((b) => b.asset === fromAsset);
  if (!fromBalance || fromBalance.amount < fromAmount) {
    return { ok: false, error: "Saldo insuficiente" };
  }

  const prices = await fetchPrices();
  const fromPrice = prices[fromAsset]?.usd ?? 0;
  const toPrice = prices[toAsset]?.usd ?? 0;
  if (fromPrice <= 0 || toPrice <= 0) {
    return { ok: false, error: "Precio no disponible" };
  }

  const usdValue = fromAmount * fromPrice;
  const toAmount = usdValue / toPrice;
  const rate = fromPrice / toPrice;

  await prisma.$transaction([
    prisma.balance.update({
      where: { userId_asset: { userId: user.id, asset: fromAsset } },
      data: { amount: { decrement: fromAmount } },
    }),
    prisma.balance.upsert({
      where: { userId_asset: { userId: user.id, asset: toAsset } },
      update: { amount: { increment: toAmount } },
      create: { userId: user.id, asset: toAsset, amount: toAmount },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "swap",
        fromAsset,
        toAsset,
        fromAmount,
        toAmount,
        rate,
        status: "completed",
        description: `Swap ${fromAsset} → ${toAsset}`,
      },
    }),
  ]);

  grantAchievement(user.id, "first_swap").catch(() => {});

  await notify({
    userId: user.id,
    type: "swap",
    title: `Swap completado · ${fromAsset} → ${toAsset}`,
    body: `Convertiste ${fromAmount.toLocaleString("en-US", { maximumFractionDigits: ASSETS[fromAsset].precision })} ${fromAsset} a ${toAmount.toLocaleString("en-US", { maximumFractionDigits: ASSETS[toAsset].precision })} ${toAsset}`,
    link: "/dashboard/history?tipo=swap",
  });

  revalidatePath("/dashboard/swap");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");

  const fmtFrom = fromAmount.toLocaleString("en-US", {
    maximumFractionDigits: ASSETS[fromAsset].precision,
  });
  const fmtTo = toAmount.toLocaleString("en-US", {
    maximumFractionDigits: ASSETS[toAsset].precision,
  });

  return {
    ok: true,
    message: `Cambiaste ${fmtFrom} ${fromAsset} por ${fmtTo} ${toAsset}`,
  };
}

export type P2PSendResult =
  | { ok: true; message: string; recipientLabel: string; asset: string; amount: number }
  | { ok: false; error: string }
  | undefined;

export async function sendP2PAction(
  _prev: P2PSendResult,
  formData: FormData
): Promise<P2PSendResult> {
  const sender = await getCurrentUser();
  if (!sender) return { ok: false, error: "No autenticado" };
  if (sender.kycStatus !== "approved") {
    return { ok: false, error: "Verifica tu identidad primero (Ajustes → KYC)" };
  }

  const recipientEmail = String(formData.get("recipientEmail") ?? "")
    .trim()
    .toLowerCase();
  const asset = String(formData.get("asset") ?? "");
  const amountRaw = String(formData.get("amount") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const amount = Number(amountRaw);

  if (!isAssetSymbol(asset)) return { ok: false, error: "Activo inválido" };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Monto inválido" };
  }
  if (recipientEmail === sender.email) {
    return { ok: false, error: "No puedes enviarte a ti mismo" };
  }

  const recipient = await prisma.user.findUnique({
    where: { email: recipientEmail },
  });
  if (!recipient) {
    return { ok: false, error: "No encontramos a ningún usuario con ese email" };
  }

  const senderBalance = sender.balances.find((b) => b.asset === asset);
  if (!senderBalance || senderBalance.amount < amount) {
    return { ok: false, error: `Saldo ${asset} insuficiente` };
  }

  const recipientLabel = recipient.name ?? recipient.email.split("@")[0];

  await prisma.$transaction([
    prisma.balance.update({
      where: { userId_asset: { userId: sender.id, asset } },
      data: { amount: { decrement: amount } },
    }),
    prisma.balance.upsert({
      where: { userId_asset: { userId: recipient.id, asset } },
      update: { amount: { increment: amount } },
      create: { userId: recipient.id, asset, amount },
    }),
    prisma.transaction.create({
      data: {
        userId: sender.id,
        type: "p2p_send",
        fromAsset: asset,
        fromAmount: amount,
        status: "completed",
        description: `P2P a ${recipientLabel}${note ? ` · ${note}` : ""}`,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: recipient.id,
        type: "p2p_receive",
        toAsset: asset,
        toAmount: amount,
        status: "completed",
        description: `P2P de ${sender.name ?? sender.email.split("@")[0]}${note ? ` · ${note}` : ""}`,
      },
    }),
  ]);

  grantAchievement(sender.id, "first_p2p").catch(() => {});

  await notify({
    userId: recipient.id,
    type: "p2p_receive",
    title: `Recibiste ${amount} ${asset}`,
    body: `De ${sender.name ?? sender.email}${note ? ` · ${note}` : ""}`,
    link: "/dashboard/history",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");

  return {
    ok: true,
    message: `Enviado ${amount} ${asset} a ${recipientLabel}`,
    recipientLabel,
    asset,
    amount,
  };
}

export type SendResult =
  | { ok: true; message: string; txHash: string; asset: string; amount: number; address: string }
  | { ok: false; error: string }
  | undefined;

export async function sendCryptoAction(
  _prev: SendResult,
  formData: FormData
): Promise<SendResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.kycStatus !== "approved") {
    return { ok: false, error: "Verifica tu identidad primero (Ajustes → KYC)" };
  }

  const asset = String(formData.get("asset") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "");
  const amount = Number(amountRaw);

  if (!isCryptoAsset(asset)) {
    return { ok: false, error: "Activo no enviable. Elige una criptomoneda." };
  }
  if (!isValidAddress(asset, address)) {
    return {
      ok: false,
      error: `Dirección ${asset} no válida. Revisa el formato.`,
    };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Monto inválido" };
  }

  const balance = user.balances.find((b) => b.asset === asset);
  if (!balance || balance.amount < amount) {
    return {
      ok: false,
      error: `Saldo ${asset} insuficiente`,
    };
  }

  const txHash = generateTxHash(asset);
  const shortAddr = shortenAddress(address);

  await prisma.$transaction([
    prisma.balance.update({
      where: { userId_asset: { userId: user.id, asset } },
      data: { amount: { decrement: amount } },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "send",
        fromAsset: asset,
        fromAmount: amount,
        status: "completed",
        description: `Envío a ${shortAddr} · ${txHash.slice(0, 10)}…`,
      },
    }),
  ]);

  grantAchievement(user.id, "first_send").catch(() => {});

  await notify({
    userId: user.id,
    type: "send",
    title: `Envío ${asset} confirmado`,
    body: `Enviaste ${amount.toLocaleString("en-US", { maximumFractionDigits: ASSETS[asset].precision })} ${asset} a ${shortAddr}`,
    link: "/dashboard/history?tipo=envio",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/send");
  revalidatePath("/dashboard/history");

  const fmt = amount.toLocaleString("en-US", {
    maximumFractionDigits: ASSETS[asset].precision,
  });

  return {
    ok: true,
    message: `Enviado ${fmt} ${asset} a ${shortAddr}`,
    txHash,
    asset,
    amount,
    address,
  };
}

export type DepositResult =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | undefined;

const DEPOSIT_METHODS = new Set(["bank", "card", "crypto"]);

export async function depositAction(
  _prev: DepositResult,
  formData: FormData
): Promise<DepositResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.kycStatus !== "approved") {
    return { ok: false, error: "Verifica tu identidad primero (Ajustes → KYC)" };
  }

  const asset = String(formData.get("asset") ?? "");
  const amountRaw = String(formData.get("amount") ?? "");
  const method = String(formData.get("method") ?? "bank");
  const amount = Number(amountRaw);

  if (!isAssetSymbol(asset)) return { ok: false, error: "Activo inválido" };
  if (!DEPOSIT_METHODS.has(method))
    return { ok: false, error: "Método inválido" };
  if (!Number.isFinite(amount) || amount <= 0)
    return { ok: false, error: "Monto inválido" };
  if (amount > 1_000_000)
    return { ok: false, error: "Monto excede el límite de la demo" };

  await prisma.$transaction([
    prisma.balance.upsert({
      where: { userId_asset: { userId: user.id, asset } },
      update: { amount: { increment: amount } },
      create: { userId: user.id, asset, amount },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "deposit",
        toAsset: asset,
        toAmount: amount,
        status: "completed",
        description: `Depósito demo · ${method}`,
      },
    }),
  ]);

  grantAchievement(user.id, "first_deposit").catch(() => {});

  await notify({
    userId: user.id,
    type: "deposit",
    title: `Depósito recibido · ${asset}`,
    body: `${amount.toLocaleString("en-US", { maximumFractionDigits: ASSETS[asset].precision })} ${asset} acreditados (${method})`,
    link: "/dashboard/history?tipo=deposito",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/deposit");
  revalidatePath("/dashboard/history");

  const fmt = amount.toLocaleString("en-US", {
    maximumFractionDigits: ASSETS[asset].precision,
  });

  return {
    ok: true,
    message: `Acreditado ${fmt} ${asset} a tu cuenta`,
  };
}

export type CardActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | undefined;

export type CardRequestResult =
  | { ok: true; message: string; last4: string }
  | { ok: false; error: string }
  | undefined;

function generateDemoPan(): { pan: string; last4: string; cvv: string } {
  const middle = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  const last4 = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  const cvv = String(Math.floor(100 + Math.random() * 900));
  return { pan: `4242${middle}${last4}`, last4, cvv };
}

export async function requestCardAction(
  _prev: CardRequestResult,
  _formData: FormData
): Promise<CardRequestResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const existing = await prisma.card.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "Ya tienes una tarjeta emitida" };
  }

  const usdcBalance =
    user.balances.find((b) => b.asset === "USDC")?.amount ?? 0;
  if (usdcBalance < MIN_USD_FOR_CARD) {
    return {
      ok: false,
      error: `Saldo USDC insuficiente · necesitas al menos ${MIN_USD_FOR_CARD} USDC`,
    };
  }

  const { pan, last4, cvv } = generateDemoPan();
  const holderName = (user.name ?? user.email.split("@")[0])
    .toUpperCase()
    .slice(0, 26);

  await prisma.card.create({
    data: {
      userId: user.id,
      type: "virtual",
      status: "active",
      pan,
      last4,
      expMonth: 12,
      expYear: new Date().getFullYear() + 4,
      cvv,
      holderName,
      spendingSource: "USDC",
      monthlyLimit: 2000,
    },
  });

  grantAchievement(user.id, "first_card").catch(() => {});

  revalidatePath("/dashboard/card");
  revalidatePath("/dashboard");

  return { ok: true, message: "Tarjeta emitida", last4 };
}

async function getOwnedCard(cardId: string) {
  const session = await getSession();
  if (!session.userId) return null;
  const card = await prisma.card.findFirst({
    where: { id: cardId, userId: session.userId },
  });
  return card;
}

export async function toggleFreezeAction(cardId: string) {
  const card = await getOwnedCard(cardId);
  if (!card) return;
  await prisma.card.update({
    where: { id: card.id },
    data: { status: card.status === "frozen" ? "active" : "frozen" },
  });
  revalidatePath("/dashboard/card");
}

export async function setSpendingSourceAction(cardId: string, asset: string) {
  const card = await getOwnedCard(cardId);
  if (!card) return;
  if (!isAssetSymbol(asset)) return;
  await prisma.card.update({
    where: { id: card.id },
    data: { spendingSource: asset },
  });
  revalidatePath("/dashboard/card");
}

export async function updateCardLimitsAction(formData: FormData) {
  const cardId = String(formData.get("cardId") ?? "");
  const card = await getOwnedCard(cardId);
  if (!card) return;

  const monthly = Number(formData.get("monthlyLimit") ?? card.monthlyLimit);
  const dailyPurchase = Number(
    formData.get("dailyPurchaseLimit") ?? card.dailyPurchaseLimit
  );
  const dailyWithdrawal = Number(
    formData.get("dailyWithdrawalLimit") ?? card.dailyWithdrawalLimit
  );

  await prisma.card.update({
    where: { id: card.id },
    data: {
      monthlyLimit: Number.isFinite(monthly) && monthly > 0 ? monthly : card.monthlyLimit,
      dailyPurchaseLimit:
        Number.isFinite(dailyPurchase) && dailyPurchase > 0
          ? dailyPurchase
          : card.dailyPurchaseLimit,
      dailyWithdrawalLimit:
        Number.isFinite(dailyWithdrawal) && dailyWithdrawal >= 0
          ? dailyWithdrawal
          : card.dailyWithdrawalLimit,
    },
  });
  revalidatePath("/dashboard/card");
}

export async function updateCardColorAction(formData: FormData) {
  const cardId = String(formData.get("cardId") ?? "");
  const color = String(formData.get("color") ?? "");
  const card = await getOwnedCard(cardId);
  if (!card) return;
  const valid = ["indigo", "midnight", "rose", "emerald", "amber", "graphite"];
  if (!valid.includes(color)) return;
  await prisma.card.update({
    where: { id: card.id },
    data: { colorTheme: color },
  });
  revalidatePath("/dashboard/card");
}

export async function requestPhysicalAction(cardId: string) {
  const card = await getOwnedCard(cardId);
  if (!card) return;
  await prisma.card.update({
    where: { id: card.id },
    data: { physicalRequested: !card.physicalRequested },
  });
  revalidatePath("/dashboard/card");
}

export async function simulatePurchaseAction(
  _prev: CardActionResult,
  formData: FormData
): Promise<CardActionResult> {
  const cardId = String(formData.get("cardId") ?? "");
  const merchant = String(formData.get("merchant") ?? "").trim();
  const category = String(formData.get("category") ?? "other");
  const amountRaw = String(formData.get("amount") ?? "");
  const amountUsd = Number(amountRaw);

  const card = await getOwnedCard(cardId);
  if (!card) return { ok: false, error: "Tarjeta no encontrada" };
  if (card.status === "frozen")
    return { ok: false, error: "Tarjeta congelada" };
  if (!merchant) return { ok: false, error: "Falta el comercio" };
  if (!Number.isFinite(amountUsd) || amountUsd <= 0)
    return { ok: false, error: "Monto inválido" };

  const source = card.spendingSource as AssetSymbol;
  if (!isAssetSymbol(source))
    return { ok: false, error: "Fuente de gasto inválida" };

  // Daily purchase limit check
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dailySoFar = await prisma.cardTransaction.aggregate({
    where: {
      cardId: card.id,
      status: "approved",
      createdAt: { gte: dayStart },
    },
    _sum: { amountUsd: true },
  });
  const spentToday = dailySoFar._sum.amountUsd ?? 0;
  if (spentToday + amountUsd > card.dailyPurchaseLimit) {
    return {
      ok: false,
      error: `Excede el límite diario de compra ($${card.dailyPurchaseLimit.toFixed(0)})`,
    };
  }

  const prices = await fetchPrices();
  const sourcePrice = prices[source]?.usd ?? 0;
  if (sourcePrice <= 0) return { ok: false, error: "Precio no disponible" };

  const sourceAmount = amountUsd / sourcePrice;
  const cashbackUsd = (amountUsd * card.cashbackPercent) / 100;
  const balance = await prisma.balance.findUnique({
    where: { userId_asset: { userId: card.userId, asset: source } },
  });

  if (!balance || balance.amount < sourceAmount) {
    await prisma.cardTransaction.create({
      data: {
        cardId: card.id,
        merchant,
        category,
        amountUsd,
        sourceAsset: source,
        sourceAmount,
        rate: 1 / sourcePrice,
        status: "declined",
      },
    });
    revalidatePath("/dashboard/card");
    revalidatePath("/dashboard/history");
    return { ok: false, error: "Pago declinado — saldo insuficiente" };
  }

  await prisma.$transaction([
    prisma.balance.update({
      where: { userId_asset: { userId: card.userId, asset: source } },
      data: { amount: { decrement: sourceAmount } },
    }),
    // Cashback credited in USD
    prisma.balance.upsert({
      where: { userId_asset: { userId: card.userId, asset: "USDC" } },
      update: { amount: { increment: cashbackUsd } },
      create: { userId: card.userId, asset: "USDC", amount: cashbackUsd },
    }),
    prisma.cardTransaction.create({
      data: {
        cardId: card.id,
        merchant,
        category,
        amountUsd,
        sourceAsset: source,
        sourceAmount,
        rate: 1 / sourcePrice,
        cashbackUsd,
        status: "approved",
      },
    }),
  ]);

  await notify({
    userId: card.userId,
    type: "card_purchase",
    title: `Pago con tarjeta · ${merchant}`,
    body: `$${amountUsd.toFixed(2)} cobrados de tu saldo ${source}`,
    link: "/dashboard/card",
  });

  revalidatePath("/dashboard/card");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");

  return {
    ok: true,
    message: `${merchant} cargó $${amountUsd.toFixed(2)}`,
  };
}

export type BuyTicketsResult =
  | { ok: true; message: string; tickets: number }
  | { ok: false; error: string }
  | undefined;

const MAX_TICKETS_PER_PURCHASE = 500;

export async function buyTicketsAction(
  _prev: BuyTicketsResult,
  formData: FormData
): Promise<BuyTicketsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const ticketsRaw = String(formData.get("tickets") ?? "");
  const tickets = Math.floor(Number(ticketsRaw));
  if (!Number.isFinite(tickets) || tickets <= 0) {
    return { ok: false, error: "Cantidad de tickets inválida" };
  }
  if (tickets > MAX_TICKETS_PER_PURCHASE) {
    return {
      ok: false,
      error: `Máximo ${MAX_TICKETS_PER_PURCHASE} tickets por compra`,
    };
  }

  const round = await getOrCreateCurrentRound();
  if (round.status !== "open") {
    return { ok: false, error: "La ronda actual ya está cerrada" };
  }
  if (round.drawsAt.getTime() <= Date.now()) {
    return { ok: false, error: "Esta ronda ya venció — realiza el sorteo" };
  }

  const costUsd = tickets * round.ticketPriceUsd;
  const usdcBalance = user.balances.find((b) => b.asset === "USDC");
  if (!usdcBalance || usdcBalance.amount < costUsd) {
    return {
      ok: false,
      error: `Saldo USDC insuficiente · necesitas ${costUsd.toFixed(2)} USDC`,
    };
  }

  await prisma.$transaction([
    prisma.balance.update({
      where: { userId_asset: { userId: user.id, asset: "USDC" } },
      data: { amount: { decrement: costUsd } },
    }),
    prisma.raffleEntry.upsert({
      where: { roundId_userId: { roundId: round.id, userId: user.id } },
      update: {
        tickets: { increment: tickets },
        spentUsd: { increment: costUsd },
      },
      create: {
        roundId: round.id,
        userId: user.id,
        tickets,
        spentUsd: costUsd,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "raffle_buy",
        fromAsset: "USDC",
        fromAmount: costUsd,
        status: "completed",
        description: `${tickets} ticket${tickets === 1 ? "" : "s"} de rifa`,
      },
    }),
  ]);

  grantAchievement(user.id, "first_ticket").catch(() => {});

  revalidatePath("/dashboard/raffle");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");

  return {
    ok: true,
    message: `Compraste ${tickets} ticket${tickets === 1 ? "" : "s"}`,
    tickets,
  };
}

export type DrawRaffleResult =
  | {
      ok: true;
      won: boolean;
      winnerLabel: string;
      winningIndex: number;
      totalTickets: number;
      prizeBtc: number;
    }
  | { ok: false; error: string }
  | undefined;

export async function drawRaffleAction(
  _prev: DrawRaffleResult,
  formData: FormData
): Promise<DrawRaffleResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const roundId = String(formData.get("roundId") ?? "");
  if (!roundId) return { ok: false, error: "Ronda no especificada" };

  const round = await prisma.raffleRound.findUnique({
    where: { id: roundId },
    include: { entries: true },
  });
  if (!round) return { ok: false, error: "Ronda no encontrada" };
  if (round.status !== "open") {
    return { ok: false, error: "Esta ronda ya fue sorteada" };
  }
  if (round.drawsAt.getTime() > Date.now()) {
    return { ok: false, error: "Aún no ha llegado la fecha del sorteo" };
  }

  const result = pickWinner(
    round.entries.map((e) => ({ userId: e.userId, tickets: e.tickets })),
    round.syntheticTickets
  );

  const writes: Prisma.PrismaPromise<unknown>[] = [];

  if (result.kind === "user") {
    writes.push(
      prisma.balance.upsert({
        where: {
          userId_asset: { userId: result.userId, asset: "BTC" },
        },
        update: { amount: { increment: round.prizeBtc } },
        create: {
          userId: result.userId,
          asset: "BTC",
          amount: round.prizeBtc,
        },
      }),
      prisma.transaction.create({
        data: {
          userId: result.userId,
          type: "raffle_win",
          toAsset: "BTC",
          toAmount: round.prizeBtc,
          status: "completed",
          description: `Premio rifa · ${round.prizeBtc} BTC`,
        },
      })
    );
  }

  writes.push(
    prisma.raffleRound.update({
      where: { id: round.id },
      data: {
        status: "drawn",
        drawnAt: new Date(),
        winnerUserId: result.kind === "user" ? result.userId : null,
        winnerHandle: result.kind === "synthetic" ? result.handle : null,
        winnerTickets:
          result.kind === "user" ? result.userTickets : round.syntheticTickets,
        totalTicketsAtDraw: result.totalTickets,
      },
    }),
    prisma.raffleRound.create({
      data: {
        drawsAt: nextDrawDate(new Date()),
        prizeBtc: round.prizeBtc,
        ticketPriceUsd: round.ticketPriceUsd,
        syntheticTickets:
          Math.floor(2000 + Math.random() * 6000),
        status: "open",
      },
    })
  );

  await prisma.$transaction(writes);

  if (result.kind === "user") {
    grantAchievement(result.userId, "raffle_winner").catch(() => {});
    await notify({
      userId: result.userId,
      type: "raffle_win",
      title: `¡Ganaste la rifa! · ${round.prizeBtc} BTC`,
      body: `Acabas de ganar ${round.prizeBtc} BTC. El premio ya está en tu balance.`,
      link: "/dashboard/raffle",
    });
  }

  let winnerLabel: string;
  if (result.kind === "user") {
    const winner = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { name: true, email: true },
    });
    winnerLabel = winner?.name ?? winner?.email ?? "Usuario";
  } else {
    winnerLabel = result.handle;
  }

  revalidatePath("/dashboard/raffle");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");

  return {
    ok: true,
    won: result.kind === "user" && result.userId === user.id,
    winnerLabel,
    winningIndex: result.winningIndex,
    totalTickets: result.totalTickets,
    prizeBtc: round.prizeBtc,
  };
}

export async function fastForwardRaffleAction() {
  const user = await getCurrentUser();
  if (!user) return;

  const open = await prisma.raffleRound.findFirst({
    where: { status: "open" },
    orderBy: { drawsAt: "asc" },
  });
  if (!open) return;

  await prisma.raffleRound.update({
    where: { id: open.id },
    data: { drawsAt: new Date(Date.now() - 1000) },
  });

  revalidatePath("/dashboard/raffle");
  revalidatePath("/");
}

export type CreateUserResult =
  | { ok: true; userId: string; email: string; generatedPassword?: string }
  | { ok: false; error: string }
  | undefined;

export async function createUserAction(
  _prev: CreateUserResult,
  formData: FormData
): Promise<CreateUserResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "No autenticado" };
  if (!me.isAdmin) return { ok: false, error: "Sin permisos" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const isDemo = String(formData.get("isDemo") ?? "") === "on";
  const isAdmin = String(formData.get("isAdmin") ?? "") === "on";
  const initialUsdRaw = String(formData.get("initialUsd") ?? "0");
  const initialUsd = Number(initialUsdRaw) || 0;

  if (!isValidEmail(email)) return { ok: false, error: "Correo no válido" };
  if (password && password.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres" };
  }
  if (initialUsd < 0) {
    return { ok: false, error: "El balance inicial no puede ser negativo" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "Ya existe una cuenta con ese correo" };

  // Generate a readable password if admin didn't supply one
  let actualPassword = password;
  let generatedPassword: string | undefined;
  if (!actualPassword) {
    const alphabet =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    actualPassword = Array.from(
      { length: 12 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join("");
    generatedPassword = actualPassword;
  }

  const passwordHash = await bcrypt.hash(actualPassword, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      isDemo,
      isAdmin,
      kycStatus: "approved",
      balances: {
        create: [{ asset: "USDC", amount: initialUsd }],
      },
    },
  });

  await logAudit({
    actorId: me.id,
    actorEmail: me.email,
    action: "user.create",
    targetId: user.id,
    targetLabel: user.email,
    metadata: { isDemo, isAdmin, initialUsd },
  });

  revalidatePath("/dashboard/admin");

  return {
    ok: true,
    userId: user.id,
    email: user.email,
    generatedPassword,
  };
}

export type AdjustBalanceResult =
  | { ok: true; message: string; asset: string; newAmount: number }
  | { ok: false; error: string }
  | undefined;

export async function adjustBalanceAction(
  _prev: AdjustBalanceResult,
  formData: FormData
): Promise<AdjustBalanceResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "No autenticado" };
  if (!me.isAdmin) return { ok: false, error: "Sin permisos" };

  const userId = String(formData.get("userId") ?? "");
  const asset = String(formData.get("asset") ?? "");
  const deltaRaw = String(formData.get("delta") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const delta = Number(deltaRaw);

  if (!userId) return { ok: false, error: "userId requerido" };
  if (!isAssetSymbol(asset)) return { ok: false, error: "Activo inválido" };
  if (!Number.isFinite(delta) || delta === 0) {
    return { ok: false, error: "Cantidad inválida (use signo + o -)" };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { balances: { where: { asset } } },
  });
  if (!target) return { ok: false, error: "Usuario no encontrado" };

  const current = target.balances[0]?.amount ?? 0;
  const next = current + delta;
  if (next < 0) {
    return {
      ok: false,
      error: `El balance quedaría negativo (actual ${current.toFixed(4)} ${asset})`,
    };
  }

  await prisma.$transaction([
    prisma.balance.upsert({
      where: { userId_asset: { userId, asset } },
      update: { amount: next },
      create: { userId, asset, amount: next },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "admin_adjust",
        ...(delta >= 0
          ? { toAsset: asset, toAmount: delta }
          : { fromAsset: asset, fromAmount: Math.abs(delta) }),
        status: "completed",
        description: `Admin ajuste · ${me.email}${reason ? ` · ${reason}` : ""}`,
      },
    }),
  ]);

  await notify({
    userId,
    type: "admin_adjust",
    title: `Tu balance fue ajustado por admin`,
    body: `${delta >= 0 ? "+" : "−"}${Math.abs(delta)} ${asset}${reason ? ` · ${reason}` : ""}`,
  });
  await logAudit({
    actorId: me.id,
    actorEmail: me.email,
    action: "balance.adjust",
    targetId: userId,
    targetLabel: target.email,
    metadata: { asset, delta, reason: reason || null, newAmount: next },
  });

  revalidatePath(`/dashboard/admin/users/${userId}`);
  revalidatePath("/dashboard/admin");

  return {
    ok: true,
    message: `${delta >= 0 ? "Acreditado" : "Debitado"} ${Math.abs(delta)} ${asset}`,
    asset,
    newAmount: next,
  };
}

export type DeleteUserResult =
  | { ok: true; email: string }
  | { ok: false; error: string }
  | undefined;

export async function deleteUserAction(
  _prev: DeleteUserResult,
  formData: FormData
): Promise<DeleteUserResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "No autenticado" };
  if (!me.isAdmin) return { ok: false, error: "Sin permisos" };

  const userId = String(formData.get("userId") ?? "");
  const confirmEmail = String(formData.get("confirmEmail") ?? "").trim().toLowerCase();

  if (!userId) return { ok: false, error: "userId requerido" };
  if (userId === me.id) {
    return { ok: false, error: "No puedes eliminar tu propia cuenta" };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!target) return { ok: false, error: "Usuario no encontrado" };
  if (confirmEmail !== target.email) {
    return {
      ok: false,
      error: "El correo de confirmación no coincide",
    };
  }

  // Past raffle rounds reference winner via Restrict (default). Null out
  // the FK before deleting the user so the rounds survive.
  await prisma.$transaction([
    prisma.raffleRound.updateMany({
      where: { winnerUserId: userId },
      data: { winnerUserId: null },
    }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  await logAudit({
    actorId: me.id,
    actorEmail: me.email,
    action: "user.delete",
    targetId: target.id,
    targetLabel: target.email,
  });

  revalidatePath("/dashboard/admin");

  return { ok: true, email: target.email };
}

export type TotpStartResult =
  | { ok: true; secret: string; otpauth: string }
  | { ok: false; error: string };

export async function startTotpSetupAction(): Promise<TotpStartResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.totpEnabled) return { ok: false, error: "2FA ya está activado" };

  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: secret, totpEnabled: false },
  });

  return {
    ok: true,
    secret,
    otpauth: totpUri(secret, user.email),
  };
}

export type TotpVerifyResult =
  | { ok: true }
  | { ok: false; error: string }
  | undefined;

export async function verifyTotpSetupAction(
  _prev: TotpVerifyResult,
  formData: FormData
): Promise<TotpVerifyResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };
  if (!user.totpSecret) {
    return { ok: false, error: "Inicia primero la configuración de 2FA" };
  }
  if (user.totpEnabled) return { ok: false, error: "2FA ya está activado" };

  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) {
    return { ok: false, error: "Código inválido (deben ser 6 dígitos)" };
  }
  if (!verifyTotp(user.totpSecret, token)) {
    return { ok: false, error: "Código incorrecto. Verifica el reloj del autenticador" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: true },
  });

  await notify({
    userId: user.id,
    type: "security",
    title: "2FA activado",
    body: "A partir de ahora se te pedirá un código al iniciar sesión.",
    link: "/dashboard/settings",
  });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export type TotpDisableResult =
  | { ok: true }
  | { ok: false; error: string }
  | undefined;

export async function disableTotpAction(
  _prev: TotpDisableResult,
  formData: FormData
): Promise<TotpDisableResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };
  if (!user.totpEnabled || !user.totpSecret) {
    return { ok: false, error: "2FA no está activado" };
  }

  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) {
    return { ok: false, error: "Introduce un código 2FA válido para confirmar" };
  }
  if (!verifyTotp(user.totpSecret, token)) {
    return { ok: false, error: "Código incorrecto" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: false, totpSecret: null },
  });

  await notify({
    userId: user.id,
    type: "security",
    title: "2FA desactivado",
    body: "Tu cuenta ya no requiere código 2FA al iniciar sesión.",
    link: "/dashboard/settings",
  });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

// ----- Watchlist -----

export async function toggleWatchlistAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const asset = String(formData.get("asset") ?? "");
  if (!isAssetSymbol(asset)) return;

  const existing = await prisma.watchlist.findUnique({
    where: { userId_asset: { userId: user.id, asset } },
  });
  if (existing) {
    await prisma.watchlist.delete({ where: { id: existing.id } });
  } else {
    await prisma.watchlist.create({
      data: { userId: user.id, asset },
    });
  }
  revalidatePath("/dashboard/markets", "layout");
  revalidatePath(`/dashboard/markets/${asset}`);
}

// ----- Price alerts -----

export type PriceAlertCreateResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | undefined;

export async function createPriceAlertAction(
  _prev: PriceAlertCreateResult,
  formData: FormData
): Promise<PriceAlertCreateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const asset = String(formData.get("asset") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const targetUsd = Number(formData.get("targetUsd") ?? "0");

  if (!isAssetSymbol(asset)) {
    return { ok: false, error: "Activo no válido" };
  }
  if (direction !== "above" && direction !== "below") {
    return { ok: false, error: "Dirección inválida" };
  }
  if (!Number.isFinite(targetUsd) || targetUsd <= 0) {
    return { ok: false, error: "Precio objetivo inválido" };
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId: user.id,
      asset,
      direction,
      targetUsd,
    },
  });

  revalidatePath(`/dashboard/markets/${asset}`);
  revalidatePath("/dashboard/settings");
  return { ok: true, id: alert.id };
}

export async function deletePriceAlertAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  await prisma.priceAlert.deleteMany({
    where: { id, userId: user.id },
  });
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/markets", "layout");
}

/**
 * Evaluates all pending alerts against current prices. Should be called
 * periodically (e.g. from a client polling endpoint or background job).
 * Marks triggered alerts and creates notifications.
 */
export async function checkPriceAlertsAction() {
  const pending = await prisma.priceAlert.findMany({
    where: { triggered: false },
  });
  if (pending.length === 0) return;

  const { fetchPrices } = await import("@/lib/prices");
  const prices = await fetchPrices({ ttlSeconds: 30 });

  const triggered: { id: string; userId: string; asset: string; direction: string; targetUsd: number; currentUsd: number }[] = [];
  for (const a of pending) {
    const currentUsd = prices[a.asset as AssetSymbol]?.usd ?? 0;
    if (currentUsd <= 0) continue;
    const hit =
      (a.direction === "above" && currentUsd >= a.targetUsd) ||
      (a.direction === "below" && currentUsd <= a.targetUsd);
    if (hit) {
      triggered.push({
        id: a.id,
        userId: a.userId,
        asset: a.asset,
        direction: a.direction,
        targetUsd: a.targetUsd,
        currentUsd,
      });
    }
  }

  for (const t of triggered) {
    await prisma.priceAlert.update({
      where: { id: t.id },
      data: { triggered: true, triggeredAt: new Date() },
    });
    await notify({
      userId: t.userId,
      type: "price_alert",
      title: `🔔 ${t.asset} ${t.direction === "above" ? "subió a" : "bajó a"} ${t.currentUsd.toFixed(2)}`,
      body: `Alerta: ${t.asset} ${t.direction === "above" ? "≥" : "≤"} $${t.targetUsd.toLocaleString()}`,
      link: `/dashboard/markets/${t.asset}`,
    });
  }
}

// ----- KYC verification -----

export async function submitKycAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.kycStatus === "approved") {
    return { ok: false, error: "Ya estás verificado" };
  }

  // Demo: aprobamos automáticamente. En producción esto pasaría por un
  // proveedor de verificación (Onfido, Sumsub, Persona, etc.) y un revisor.
  await prisma.user.update({
    where: { id: user.id },
    data: { kycStatus: "approved" },
  });

  await notify({
    userId: user.id,
    type: "kyc",
    title: "Verificación de identidad aprobada",
    body: "Ya puedes operar con todos los límites desbloqueados.",
    link: "/dashboard/settings",
  });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export type RecoveryCodesResult =
  | { ok: true; codes: string[] }
  | { ok: false; error: string }
  | undefined;

function generateRecoveryCode(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function regenerateRecoveryCodesAction(): Promise<RecoveryCodesResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };
  if (!user.totpEnabled) {
    return { ok: false, error: "Activa primero 2FA para generar códigos de recuperación" };
  }

  const codes = Array.from({ length: 10 }, generateRecoveryCode);
  await prisma.user.update({
    where: { id: user.id },
    data: { recoveryCodes: JSON.stringify(codes) },
  });
  await notify({
    userId: user.id,
    type: "security",
    title: "Códigos de recuperación generados",
    body: "Se han regenerado tus 10 códigos. Los anteriores ya no funcionan.",
    link: "/dashboard/settings",
  });
  revalidatePath("/dashboard/settings");
  return { ok: true, codes };
}

export async function markNotificationReadAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });
  revalidatePath("/dashboard", "layout");
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/dashboard", "layout");
}

export async function setThemeAction(theme: Theme) {
  await setThemeCookie(theme);
  revalidatePath("/", "layout");
}

export type ProfileUpdateResult =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | undefined;

export async function updateNameAction(
  _prev: ProfileUpdateResult,
  formData: FormData
): Promise<ProfileUpdateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length > 60) {
    return { ok: false, error: "Máximo 60 caracteres" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: name || null },
  });

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: name ? "Nombre actualizado" : "Nombre eliminado" };
}

export async function changePasswordAction(
  _prev: ProfileUpdateResult,
  formData: FormData
): Promise<ProfileUpdateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 8) {
    return { ok: false, error: "La nueva contraseña debe tener al menos 8 caracteres" };
  }
  if (next !== confirm) {
    return { ok: false, error: "Las contraseñas no coinciden" };
  }

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) return { ok: false, error: "Contraseña actual incorrecta" };

  const passwordHash = await bcrypt.hash(next, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { ok: true, message: "Contraseña actualizada" };
}

export type DeleteSelfResult =
  | { ok: true }
  | { ok: false; error: string }
  | undefined;

export async function deleteOwnAccountAction(
  _prev: DeleteSelfResult,
  formData: FormData
): Promise<DeleteSelfResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const confirmEmail = String(formData.get("confirmEmail") ?? "")
    .trim()
    .toLowerCase();
  if (confirmEmail !== user.email) {
    return { ok: false, error: "El correo de confirmación no coincide" };
  }

  await prisma.$transaction([
    prisma.raffleRound.updateMany({
      where: { winnerUserId: user.id },
      data: { winnerUserId: null },
    }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  const session = await getSession();
  session.destroy();
  redirect("/");
}

// ----- Admin webhooks -----

export type WebhookCreateResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | undefined;

export async function createWebhookAction(
  _prev: WebhookCreateResult,
  formData: FormData
): Promise<WebhookCreateResult> {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) return { ok: false, error: "Sin permisos" };

  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const secret = String(formData.get("secret") ?? "").trim() || null;

  if (!name) return { ok: false, error: "Nombre requerido" };
  if (!/^https?:\/\/.+/.test(url)) {
    return { ok: false, error: "URL inválida (debe empezar con http:// o https://)" };
  }

  const webhook = await prisma.webhook.create({
    data: { name, url, secret },
  });

  revalidatePath("/dashboard/admin/webhooks");
  return { ok: true, id: webhook.id };
}

export async function toggleWebhookAction(formData: FormData) {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) return;
  const id = String(formData.get("id") ?? "");
  const enabled = String(formData.get("enabled") ?? "") === "true";
  await prisma.webhook.update({
    where: { id },
    data: { enabled },
  });
  revalidatePath("/dashboard/admin/webhooks");
}

export async function deleteWebhookAction(formData: FormData) {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) return;
  const id = String(formData.get("id") ?? "");
  await prisma.webhook.delete({ where: { id } });
  revalidatePath("/dashboard/admin/webhooks");
}

export type FireWebhookResult =
  | { ok: true; status: string }
  | { ok: false; error: string }
  | undefined;

export async function fireTestWebhookAction(
  _prev: FireWebhookResult,
  formData: FormData
): Promise<FireWebhookResult> {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) return { ok: false, error: "Sin permisos" };

  const id = String(formData.get("id") ?? "");
  const eventType = String(formData.get("eventType") ?? "test.ping");

  const webhook = await prisma.webhook.findUnique({ where: { id } });
  if (!webhook) return { ok: false, error: "Webhook no encontrado" };
  if (!webhook.enabled) return { ok: false, error: "Webhook deshabilitado" };

  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: { triggeredBy: me.email, demo: true },
  };
  const payloadStr = JSON.stringify(payload);

  let status: string = "delivered";
  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Skypay-Event": eventType,
        ...(webhook.secret ? { "X-Skypay-Signature": webhook.secret } : {}),
      },
      body: payloadStr,
      signal: AbortSignal.timeout(5000),
    });
    status = res.ok ? "delivered" : `failed:${res.status}`;
  } catch (err) {
    status = `error:${err instanceof Error ? err.name : "unknown"}`;
  }

  await prisma.$transaction([
    prisma.webhook.update({
      where: { id },
      data: { lastFiredAt: new Date() },
    }),
    prisma.webhookEvent.create({
      data: {
        webhookId: id,
        eventType,
        status,
        payload: payloadStr,
      },
    }),
  ]);

  revalidatePath("/dashboard/admin/webhooks");
  return { ok: true, status };
}

// ----- Admin impersonation -----

export async function impersonateUserAction(formData: FormData) {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) return;

  const userId = String(formData.get("userId") ?? "");
  if (!userId || userId === me.id) return;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isDemo: true },
  });
  if (!target) return;

  const session = await getSession();
  session.userId = target.id;
  session.email = target.email;
  session.isDemo = target.isDemo;
  session.impersonatedBy = me.id;
  session.impersonatedByEmail = me.email;
  await session.save();

  await logAudit({
    actorId: me.id,
    actorEmail: me.email,
    action: "impersonate.start",
    targetId: target.id,
    targetLabel: target.email,
  });

  redirect("/dashboard");
}

export async function stopImpersonatingAction() {
  const session = await getSession();
  const originalAdminId = session.impersonatedBy;
  const originalAdminEmail = session.impersonatedByEmail;
  if (!originalAdminId) {
    redirect("/dashboard");
  }

  const admin = await prisma.user.findUnique({
    where: { id: originalAdminId },
  });
  if (!admin) {
    session.destroy();
    redirect("/login");
  }

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "impersonate.stop",
    targetId: session.userId ?? null,
    targetLabel: session.email ?? null,
  });

  session.userId = admin.id;
  session.email = admin.email;
  session.isDemo = admin.isDemo;
  session.impersonatedBy = undefined;
  session.impersonatedByEmail = undefined;
  await session.save();

  // Suppress unused warning — could be exposed in UI later
  void originalAdminEmail;

  redirect("/dashboard/admin");
}

export async function adminForceDrawAction() {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) return;

  const open = await prisma.raffleRound.findFirst({
    where: { status: "open" },
    orderBy: { drawsAt: "asc" },
  });
  if (!open) return;

  // Force deadline to past so the draw can run
  if (open.drawsAt.getTime() > Date.now()) {
    await prisma.raffleRound.update({
      where: { id: open.id },
      data: { drawsAt: new Date(Date.now() - 1000) },
    });
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/raffle");
}

export type AdminToggleResult =
  | { ok: true; userId: string; isAdmin: boolean }
  | { ok: false; error: string }
  | undefined;

export async function setUserAdminAction(
  _prev: AdminToggleResult,
  formData: FormData
): Promise<AdminToggleResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "No autenticado" };
  if (!me.isAdmin) return { ok: false, error: "Sin permisos" };

  const userId = String(formData.get("userId") ?? "");
  const makeAdmin = String(formData.get("makeAdmin") ?? "") === "true";

  if (!userId) return { ok: false, error: "userId requerido" };
  if (userId === me.id) {
    return { ok: false, error: "No puedes cambiar tu propio rol admin" };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) return { ok: false, error: "Usuario no encontrado" };

  await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: makeAdmin },
  });
  await logAudit({
    actorId: me.id,
    actorEmail: me.email,
    action: makeAdmin ? "user.promote_admin" : "user.demote_admin",
    targetId: userId,
  });

  revalidatePath("/dashboard/admin");

  return { ok: true, userId, isAdmin: makeAdmin };
}
