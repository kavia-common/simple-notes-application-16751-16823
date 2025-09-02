/**
 * Server-side auth utilities using Remix cookies.
 */
import { createCookie } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getTokenFromCookie, meRequest } from "./api";

export const authCookie = createCookie("auth_token", {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secrets: ["replace-with-env-secret-in-deploy"], // not sensitive in this template context
  // Note: In real deployment set secure: true
});

/**
 * PUBLIC_INTERFACE
 * Extract token from request cookies.
 */
export async function getAuthToken(request: Request): Promise<string | null> {
  /** Returns the JWT token string or null. */
  const cookieHeader = request.headers.get("Cookie");
  const parsed = await authCookie.parse(cookieHeader);
  if (typeof parsed === "string") return parsed;
  return getTokenFromCookie(cookieHeader);
}

/**
 * PUBLIC_INTERFACE
 * Ensure user is authenticated or redirect to /login.
 */
export async function requireUserToken(args: LoaderFunctionArgs) {
  /** Get token or redirect to login. */
  const token = await getAuthToken(args.request);
  if (!token) {
    throw args.context?.redirect
      ? args.context.redirect("/login")
      : new Response(null, { status: 302, headers: { Location: "/login" } });
  }
  return token;
}

/**
 * PUBLIC_INTERFACE
 * Try retrieving user; returns null if invalid token.
 */
export async function getUserFromRequest(request: Request) {
  /** Validate token by calling /auth/me. */
  const token = await getAuthToken(request);
  if (!token) return null;
  try {
    const user = await meRequest(token);
    return { token, user };
  } catch {
    return null;
  }
}
