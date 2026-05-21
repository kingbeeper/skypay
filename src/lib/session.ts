import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  userId?: string;
  email?: string;
  isDemo?: boolean;
};

const sessionPassword = process.env.SESSION_SECRET;

if (!sessionPassword || sessionPassword.length < 32) {
  throw new Error(
    "SESSION_SECRET must be set in environment (min 32 characters)"
  );
}

const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: "skypay-session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
