import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
  useRouteLoaderData,
  Link,
} from "@remix-run/react";
import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import "./tailwind.css";
import { getUserFromRequest, authCookie } from "./utils/auth.server";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const meta: MetaFunction = () => {
  return [
    { title: "Simple Notes" },
    {
      name: "description",
      content:
        "A simple notes app to create, edit, delete, and search notes. Built with Remix.",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getUserFromRequest(request);
  return json({ auth });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#f5f6fa" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-[#f5f6fa] text-gray-900">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

type RootLoaderData = {
  auth: { token: string; user: { id: string; email: string } } | null;
};

function NavBar() {
  const data = useRouteLoaderData("root") as RootLoaderData | undefined;
  const user = data?.auth?.user;
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-[#2d7ff9] text-white grid place-items-center font-bold">
            N
          </div>
          <span className="font-semibold text-gray-900">Simple Notes</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:inline">
                {user.email}
              </span>
              <form method="post" action="/logout">
                <button
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-[#2d7ff9] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#236be0]"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isNotesRoute = location.pathname.startsWith("/notes");

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4">
        <Outlet />
      </main>

      {isNotesRoute && (
        <button
          aria-label="Create Note"
          title="Create Note"
          onClick={() => navigate("/notes/new")}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#2d7ff9] text-white shadow-lg transition hover:bg-[#236be0] focus:outline-none focus:ring-4 focus:ring-[#ffcb05]/40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Handle logout at root action for simplicity
export async function action({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  if (url.pathname === "/logout" && request.method === "POST") {
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
  return null;
}
