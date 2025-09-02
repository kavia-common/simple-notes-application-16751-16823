/**
 * Note detail/editor route. Allows editing title, tags, and content; supports deletion.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { getUserFromRequest } from "~/utils/auth.server";
import {
  deleteNoteRequest,
  getNoteRequest,
  updateNoteRequest,
  type Note,
} from "~/utils/api";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const auth = await getUserFromRequest(request);
  if (!auth) return redirect("/login");

  const id = params.id!;
  const note = await getNoteRequest(auth.token, id);
  return json({ note });
}

// PUBLIC_INTERFACE
export async function action({ request, params }: ActionFunctionArgs) {
  /** Handle save or delete note based on _intent. */
  const auth = await getUserFromRequest(request);
  if (!auth) return redirect("/login");

  const id = params.id!;
  const form = await request.formData();
  const intent = String(form.get("_intent") || "save");

  if (intent === "delete") {
    await deleteNoteRequest(auth.token, id);
    return redirect("/notes");
  }

  const title = String(form.get("title") || "").trim() || "Untitled";
  const content = String(form.get("content") || "");
  const tagsRaw = String(form.get("tags") || "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const note = await updateNoteRequest(auth.token, id, {
    title,
    content,
    tags,
  });
  return json({ note, ok: true });
}

export default function NoteDetail() {
  const { note } = useLoaderData<typeof loader>() as { note: Note };
  const [searchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const submitting = nav.state === "submitting";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
      <aside className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm md:h-[calc(100vh-140px)] md:overflow-y-auto">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Notes</h2>
          <Link
            to={`/notes?${searchParams.toString()}`}
            className="text-sm font-medium text-[#2d7ff9] hover:underline"
          >
            Back to list
          </Link>
        </div>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
          Editing: <span className="font-medium text-gray-800">{note.title || "Untitled"}</span>
        </div>
      </aside>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {actionData && (actionData as { error?: string }).error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {(actionData as { error?: string }).error}
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
              defaultValue={note.title}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-[#ffcb05]/40 focus:ring-4"
              placeholder="Note title"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700" htmlFor="tags">
              Tags (comma separated)
            </label>
            <input
              id="tags"
              name="tags"
              defaultValue={(note.tags || []).join(", ")}
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
              rows={14}
              defaultValue={note.content}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-[#ffcb05]/40 focus:ring-4"
              placeholder="Write your note here..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              name="_intent"
              value="save"
              disabled={submitting}
              className="rounded-md bg-[#2d7ff9] px-4 py-2 font-medium text-white hover:bg-[#236be0] disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save changes"}
            </button>
            <button
              type="submit"
              name="_intent"
              value="delete"
              disabled={submitting}
              className="rounded-md border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {submitting ? "Deleting..." : "Delete"}
            </button>
            <Link
              to={`/notes?${searchParams.toString()}`}
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
