/**
 * Login/Register page. Handles authentication via REST APIs and sets cookie.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { getUserFromRequest, authCookie } from "~/utils/auth.server";
import { loginRequest, registerRequest } from "~/utils/api";

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getUserFromRequest(request);
  if (auth) return redirect("/notes");
  return json({ ok: true });
}

// PUBLIC_INTERFACE
export async function action({ request }: ActionFunctionArgs) {
  /** Handle login or register based on _intent value. */
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const intent = String(formData.get("_intent") || "login");

  if (!email || !password) {
    return json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const resp =
      intent === "register"
        ? await registerRequest(email, password)
        : await loginRequest(email, password);

    return redirect("/notes", {
      headers: {
        "Set-Cookie": await authCookie.serialize(resp.token, {
          path: "/",
          // In real deployment set secure true and bigger maxAge
          maxAge: 60 * 60 * 24 * 7,
        }),
      },
    });
  } catch (e) {
    const message =
      typeof e === "object" && e && "message" in e && typeof (e as { message?: unknown }).message === "string"
        ? String((e as { message?: unknown }).message)
        : "Authentication failed.";
    return json({ error: message }, { status: 400 });
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const submitting = nav.state === "submitting";
  return (
    <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">Welcome back</h1>
      <p className="mb-6 text-sm text-gray-600">
        Sign in or create an account to start taking notes.
      </p>
      {actionData?.error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionData.error}
        </div>
      ) : null}
      <Form method="post" className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-[#ffcb05]/40 focus:ring-4"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-[#ffcb05]/40 focus:ring-4"
            placeholder="••••••••"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            name="_intent"
            value="login"
            disabled={submitting}
            className="rounded-md bg-[#2d7ff9] px-4 py-2 font-medium text-white hover:bg-[#236be0] disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
          <button
            name="_intent"
            value="register"
            disabled={submitting}
            className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create account"}
          </button>
        </div>
      </Form>
      <p className="mt-4 text-xs text-gray-500">
        By continuing, you agree to our terms.{" "}
        <Link to="/" className="text-[#2d7ff9] hover:underline">
          Learn more
        </Link>
      </p>
    </div>
  );
}
