import { cookies } from "next/headers";

export type Theme = "dark" | "light";

const COOKIE_NAME = "skypay-theme";

export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return value === "light" ? "light" : "dark";
}

export async function setThemeCookie(theme: Theme): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, theme, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
