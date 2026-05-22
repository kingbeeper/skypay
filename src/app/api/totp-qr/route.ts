import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });

  const data = req.nextUrl.searchParams.get("data");
  if (!data || !data.startsWith("otpauth://")) {
    return new NextResponse("bad request", { status: 400 });
  }

  const png = await QRCode.toBuffer(data, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
    color: { dark: "#000000", light: "#FFFFFF" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
