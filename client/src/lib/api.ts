import { supabase } from "./supabase";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Session token unavailable
  }
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = baseUrl ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint;

  const authHeader = await getAuthHeader();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeader,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    let errorCode: string | undefined;

    try {
      const errorJson = await response.json();
      if (errorJson.error) {
        if (typeof errorJson.error === "string") {
          errorMsg = errorJson.error;
        } else if (errorJson.error.message) {
          errorMsg = errorJson.error.message;
          errorCode = errorJson.error.code;
        }
      } else if (errorJson.message) {
        errorMsg = errorJson.message;
      }
    } catch {
      // Body not JSON
    }

    throw new ApiError(errorMsg, response.status, errorCode);
  }

  return response.json();
}
