import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUserFromRequest } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getUserFromRequest(request);
  if (auth) {
    return redirect("/notes");
  }
  return { ok: true };
}

export default function Index() {
  useLoaderData<typeof loader>();
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">
        Simple Notes
      </h1>
      <p className="mb-6 text-gray-600">
        Capture your thoughts quickly. Sign in to get started.
      </p>
      <a
        href="/login"
        className="inline-block rounded-md bg-[#2d7ff9] px-4 py-2 font-medium text-white hover:bg-[#236be0]"
      >
        Sign in
      </a>
    </div>
  );
}
