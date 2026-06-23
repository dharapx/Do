function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  return "http://localhost:8000/api/v1";
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (value: boolean) => void; reject: (err: Error) => void }> = [];

function getStore() {
  if (typeof window !== "undefined") {
    return (window as any).__ZUSTAND_STORE__;
  }
  return null;
}

async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise<boolean>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const BASE_URL = getBaseUrl();
    const store = getStore();
    const rt = store ? store.getState().refreshToken : null;
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: rt ? { "Authorization": `Bearer ${rt}` } : { "Content-Type": "application/json" },
    });
    if (!res.ok) {
    refreshQueue.forEach((q) => q.reject(new Error("Refresh failed")));
    refreshQueue = [];
    return false;
  }
    refreshQueue.forEach((q) => q.resolve(true));
    refreshQueue = [];
    return true;
  } catch {
    refreshQueue.forEach((q) => q.reject(new Error("Refresh failed")));
    refreshQueue = [];
    return false;
  } finally {
    isRefreshing = false;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const BASE_URL = getBaseUrl();
  const url = `${BASE_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const store = getStore();
  const token = store ? store.getState().accessToken : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
    credentials: "include",
    ...options,
  };

  let response = await fetch(url, config);

  if (response.status === 401) {
    if (endpoint === "/auth/refresh") {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError(401, "Unauthorized");
    }

    const refreshed = await attemptRefresh();
    if (refreshed) {
      response = await fetch(url, config);
    } else {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError(401, "Unauthorized");
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.detail || errorBody?.message || response.statusText;
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get<T>(endpoint: string, params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          searchParams.set(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request<T>(url, { method: "GET" });
  },

  post<T>(endpoint: string, data?: unknown) {
    const isFormData = data instanceof FormData;
    return request<T>(endpoint, {
      method: "POST",
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  },

  put<T>(endpoint: string, data: unknown) {
    return request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  patch<T>(endpoint: string, data: unknown) {
    return request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete<T>(endpoint: string) {
    return request<T>(endpoint, { method: "DELETE" });
  },
};
