/**
 * Create a new note.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { getUserFromRequest } from "~/utils/auth.server";
import { createNoteRequest } from "~/utils/api";

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getUserFromRequest(request);
  if (!auth) return redirect("/login");
  return json({ ok: true });
}

// PUBLIC_INTERFACE
export async function action({ request }: ActionFunctionArgs) {
  /** Create a note from form data. */
  const auth = await getUserFromRequest(request);
  if (!auth) return redirect("/login");

  const form = await request.formData();
  const title = String(form.get("title") || "").trim() || "Untitled";
  const content = String(form.get("content") || "");
  const tagsRaw = String(form.get("tags") || "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    const note = await createNoteRequest(auth.token, { title, content, tags });
    return redirect(`/notes/${encodeURIComponent(note.id)}`);
  } catch (e) {
    const message =
      typeof e === "object" && e && "message" in e && typeof (e as { message?: unknown }).message === "string"
        ? String((e as { message?: unknown }).message)
        : "Failed to create note.";
    return json({ error: message }, { status: 400 });
  }
}

export default function NewNote() {
  const actionData = useActionData<typeof action>();
  const errorMsg =
    actionData && typeof actionData === "object" && actionData && "error" in actionData
      ? (actionData as { error?: string }).error
      : undefined;

  const nav = useNavigation();
  const submitting = nav.state === "submitting";
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
      <aside className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm md:h-[calc(100vh-140px)] md:overflow-y-auto">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Create Note</h2>
          <Link
            to="/notes"
            className="text-sm font-medium text-[#2d7ff9] hover:underline"
          >
            Back
          </Link>
        </div>
        <p className="text-sm text-gray-600">
          Fill in the form on the right to create a new note.
        </p>
      </aside>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {errorMsg ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}
        <Form method="post" className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-700" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-[#ffcb05]/40 focus:ring-4"
              placeholder="New note title"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700" htmlFor="tags">
              Tags (comma separated)
            </label>
            <input
              id="tags"
              name="tags"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-[#ffcb05]/40 focus:ring-4"
              placeholder="work, personal"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm text-gray-700"
              htmlFor="content"
            >
              Content
            </label>
            <textarea
              id="content"
              name="content"
              rows={12}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-[#ffcb05]/40 focus:ring-4"
              placeholder="Write your note here..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-[#2d7ff9] px-4 py-2 font-medium text-white hover:bg-[#236be0] disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create note"}
            </button>
            <Link
              to="/notes"
              className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-800 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </Form>
      </section>
    </div>
  );
}
