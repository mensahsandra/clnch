/**
 * API utilities for communicating with the Cloudflare Worker
 */

export interface ApiConfig {
  workerUrl: string;
  timeout?: number;
}

let config: ApiConfig | null = null;

export function initializeApi(cfg: ApiConfig): void {
  config = cfg;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function callWorker(
  endpoint: string,
  body: unknown,
  method = 'POST'
): Promise<Response> {
  if (!config) {
    throw new Error('API not initialized. Call initializeApi first.');
  }

  const url = `${config.workerUrl}${endpoint}`;

  return fetchWithTimeout(
    url,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method === 'GET' ? undefined : JSON.stringify(body),
    },
    config.timeout
  );
}

export async function getTranscriptionToken(expiresInSeconds = 60): Promise<string> {
  const response = await callWorker(
    `/transcribe-token?expires_in_seconds=${expiresInSeconds}`,
    {},
    'GET'
  );

  if (!response.ok) {
    throw new Error(`Failed to get transcription token: ${response.status}`);
  }

  const data = await response.json() as { token: string };
  return data.token;
}
