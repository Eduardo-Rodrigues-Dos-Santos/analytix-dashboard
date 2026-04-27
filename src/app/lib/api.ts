export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://10.1.0.25:8080";

export async function apiRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `API ${response.status} ${response.statusText}${text ? `: ${text}` : ""}`,
    );
  }
  return response;
}

export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await apiRequest(path, init);
  return response.json() as Promise<T>;
}

export function buildPageParams(
  page: number,
  size: number,
  sort: string[] = [],
) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  for (const s of sort) params.append("sort", s);
  return params;
}
