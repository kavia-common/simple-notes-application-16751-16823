/**
 * Notes list route. Displays search, tags input (simple), and list of notes.
 * On mobile, list is full width; on desktop, list at left and detail pane is handled by nested routes.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { getUserFromRequest } from "~/utils/auth.server";
import { createNoteRequest, listNotesRequest, type Note } from "~/utils/api";

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getUserFromRequest(request);
  if (!auth) {
    return json({ notes: [], q: "", tag: "" }, { status: 401, headers: { Location: "/login" } });
  }
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const tag = url.searchParams.get("tag") || "";
  const notes = await listNotesRequest(auth.token, { q, tag });
  return json({ notes, q, tag });
}

// PUBLIC_INTERFACE
export async function action({ request }: ActionFunctionArgs) {
  /** Create a quick note with title only. */
  const auth = await getUserFromRequest(request);
  if (!auth) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim() || "Untitled";
  const content = "";
  const tags = [] as string[];
  const note = await createNoteRequest(auth.token, { title, content, tags });
  return json({ note });
}

export default function NotesIndex() {
  const { notes, q, tag } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const nav = useNavigation();
  const loading = nav.state === "loading" || nav.state === "submitting";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
      <aside className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm md:h-[calc(100vh-140px)] md:overflow-y-auto">
        <Form method="get" className="mb-3 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q || ""}
            placeholder="Search notes..."
            className="w-full flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-[#ffcb05]/40 focus:ring-4"
          />
          <input
            type="text"
            name="tag"
            defaultValue={tag || ""}
            placeholder="Tag"
            className="w-28 rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-[#ffcb05]/40 focus:ring-4"
          />
          <button
            type="submit"
            className="rounded-md bg-[#2d7ff9] px-3 py-2 text-white hover:bg-[#236be0]"
          >
            Search
          </button>
        </Form>

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            {loading ? "Loading..." : "Notes"}
          </h2>
          <Link
            to="/notes/new"
            className="text-sm font-medium text-[#2d7ff9] hover:underline"
          >
            New
          </Link>
        </div>

        <ul className="space-y-2">
          {notes.length === 0 ? (
            <li className="rounded-md border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
              No notes found.
            </li>
          ) : (
            notes.map((n: Note) => (
              <li key={n.id}>
                <Link
                  to={`/notes/${encodeURIComponent(n.id)}?${searchParams.toString()}`}
                  className="block rounded-md border border-gray-200 bg-white p-3 hover:border-[#2d7ff9]"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="truncate pr-2 font-medium text-gray-900">
                      {n.title || "Untitled"}
                    </h3>
                    <span className="ml-2 shrink-0 rounded bg-[#ffcb05]/20 px-2 py-0.5 text-[10px] font-semibold text-[#7a5b00]">
                      {new Date(n.updated_at || n.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  {n.content ? (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {n.content}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))
          )}
        </ul>
      </aside>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-center text-gray-500">
          <p className="mb-2 text-lg font-medium">Select a note to view or edit</p>
          <p className="text-sm">Or click the + button to create a new one.</p>
        </div>
      </section>
    </div>
  );
}
