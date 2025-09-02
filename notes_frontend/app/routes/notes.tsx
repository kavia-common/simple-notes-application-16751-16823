/**
 * Top-level notes route. Ensures auth and renders nested content.
 */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { getUserFromRequest } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getUserFromRequest(request);
  if (!auth) return redirect("/login");
  return json({ ok: true });
}

export default function NotesLayout() {
  return <Outlet />;
}
