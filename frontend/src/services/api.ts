const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Common REST API client handler with error validation
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(errorText || 'API execution failed', response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, headers?: Record<string, string>) => 
    request<T>(path, { method: 'GET', headers }),
  
  post: <T>(path: string, body: unknown, headers?: Record<string, string>) => 
    request<T>(path, { method: 'POST', body: JSON.stringify(body), headers }),
  
  put: <T>(path: string, body: unknown, headers?: Record<string, string>) => 
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), headers }),
  
  delete: <T>(path: string, headers?: Record<string, string>) => 
    request<T>(path, { method: 'DELETE', headers }),
};
export default api;
