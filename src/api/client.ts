import type { Api } from './types';
import { mockApi } from './mock';
import { httpApi } from './http';

/**
 * The single API boundary. Screens import `api` and never a mock or fetch.
 * VITE_API_MODE=mock (default) or http.
 */
const mode = (import.meta.env.VITE_API_MODE as string | undefined) ?? 'mock';

export const api: Api = mode === 'http' ? httpApi : mockApi;

export const apiMode = mode === 'http' ? 'http' : 'mock';
