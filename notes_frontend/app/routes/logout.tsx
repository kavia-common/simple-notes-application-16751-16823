/**
 * Minimal endpoint for logout POST; clears cookie and redirects to login.
 */
import { redirect } from "@remix-run/node";
import { authCookie } from "~/utils/auth.server";

export async function action() {
  return redirect("/login", {
    headers: {
      "Set-Cookie": await authCookie.serialize("", {
        maxAge: 0,
        expires: new Date(0),
        path: "/",
      }),
    },
  });
}

export default function Logout() {
  return null;
}
