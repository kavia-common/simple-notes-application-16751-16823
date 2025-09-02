/**
 * API utilities for interacting with the backend REST API.
 * Uses fetch and attaches Authorization header when a token is present.
 */

export type Note = {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
};

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

const API_BASE =
  (typeof window === "undefined"
    ? process.env.VITE_API_BASE_URL
    : import.meta.env.VITE_API_BASE_URL) || "";

/**
 * Get the stored auth token from cookie header string.
 */
export function getTokenFromCookie(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const tokenCookie = cookies.find((c) => c.startsWith("auth_token="));
  if (!tokenCookie) return null;
  const [, value] = tokenCookie.split("=");
  return decodeURIComponent(value);
}

/**
 * Build headers with JSON and optional authorization.
 */
export function buildHeaders(token?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Wrapper around fetch pointing to API_BASE and handling errors.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...buildHeaders(token),
    },
  });

  // No content
  if (res.status === 204) return undefined as unknown as T;

  let data: unknown = undefined;
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    data = await res.json().catch(() => undefined);
  } else {
    data = await res.text().catch(() => undefined);
  }

  if (!res.ok) {
    const message =
      (typeof data === "object" && data && "message" in data
        ? String((data as Record<string, unknown>)["message"])
        : undefined) ||
      (typeof data === "string" ? data : undefined) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

/**
 * PUBLIC_INTERFACE
 * Log in with email/password.
 */
export async function loginRequest(email: string, password: string) {
  /** Log in and receive token and user. */
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * PUBLIC_INTERFACE
 * Register with email/password.
 */
export async function registerRequest(email: string, password: string) {
  /** Register and receive token and user. */
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * PUBLIC_INTERFACE
 * Fetch current user profile using token.
 */
export async function meRequest(token: string) {
  /** Get current authenticated user. */
  return apiFetch<AuthUser>("/auth/me", { method: "GET" }, token);
}

/**
 * PUBLIC_INTERFACE
 * Notes endpoints
 */
export async function listNotesRequest(
  token: string,
  query?: { q?: string; tag?: string }
) {
  /** List notes, with optional q/tag filters. */
  const params = new URLSearchParams();
  if (query?.q) params.set("q", query.q);
  if (query?.tag) params.set("tag", query.tag);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<Note[]>(`/notes${suffix}`, { method: "GET" }, token);
}

export async function getNoteRequest(token: string, id: string) {
  /** Retrieve a single note by id. */
  return apiFetch<Note>(`/notes/${encodeURIComponent(id)}`, { method: "GET" }, token);
}

export async function createNoteRequest(
  token: string,
  payload: Pick<Note, "title" | "content" | "tags">
) {
  /** Create a new note. */
  return apiFetch<Note>(
    "/notes",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function updateNoteRequest(
  token: string,
  id: string,
  payload: Partial<Pick<Note, "title" | "content" | "tags">>
) {
  /** Update an existing note. */
  return apiFetch<Note>(
    `/notes/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(payload) },
    token
  );
}

export async function deleteNoteRequest(token: string, id: string) {
  /** Delete a note by id. */
  return apiFetch<void>(`/notes/${encodeURIComponent(id)}`, { method: "DELETE" }, token);
}
