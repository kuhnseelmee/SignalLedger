const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return (await response.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ ok: boolean; tenantId: string; role: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<any>("/auth/me"),
  signals: () => request<any[]>("/signals"),
  signal: (id: string) => request<any>(`/signals/${id}`),
  tasks: () => request<any[]>("/tasks"),
  evidencePack: (payload: unknown) =>
    request<any>("/evidence-packs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  incidents: () => request<any[]>("/incidents"),
};
