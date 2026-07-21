import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { File as FileSystemFile } from 'expo-file-system';
import { captureAuthSession, isAuthSessionCurrent } from './authSession';

const PRODUCTION_URL = 'https://subscription-manager.daruks.com';
const DEV_PORT = 8084;
const DEV_API_PREF_KEY = '__dev_use_official_api';

const getDevBaseUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const host = hostUri.split(':')[0];
        return `http://${host}:${DEV_PORT}/api/v1`;
    }
    if (Platform.OS === 'android') {
        return `http://10.0.2.2:${DEV_PORT}/api/v1`;
    }
    return `http://localhost:${DEV_PORT}/api/v1`;
};

let API_BASE_URL = __DEV__ ? getDevBaseUrl() : `${PRODUCTION_URL}/api/v1`;
let _devFallbackResolved = false;

/**
 * Dev only: ローカルAPIサーバーの到達性を確認し、
 * 失敗時にproduction URLへのフォールバックを提案する。
 * 選択結果はAsyncStorageに保存し、次回起動時は自動適用する。
 */
export async function ensureApiReachable(): Promise<void> {
    if (!__DEV__ || _devFallbackResolved) return;
    _devFallbackResolved = true;

    // 前回「公式APIを使う」を選択していた場合、自動適用
    try {
        const saved = await SecureStore.getItemAsync(DEV_API_PREF_KEY);
        if (saved === 'official') {
            API_BASE_URL = `${PRODUCTION_URL}/api/v1`;
            console.log(`[api] Restored preference: official API (${API_BASE_URL})`);
            return;
        }
    } catch { /* SecureStore unavailable, continue */ }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const healthUrl = API_BASE_URL.replace(/\/api\/v1$/, '/health');
        const res = await fetch(healthUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) return;
    } catch { /* local server unreachable */ }

    // ローカルに繋がらなかった → ユーザーに聞く
    return new Promise((resolve) => {
        Alert.alert(
            'ローカルサーバーに接続できません',
            `${API_BASE_URL} に到達できませんでした。\n公式APIサーバーを使用しますか？`,
            [
                { text: 'ローカルのまま', style: 'cancel', onPress: () => resolve() },
                {
                    text: '公式APIを使う（今後も）',
                    onPress: async () => {
                        API_BASE_URL = `${PRODUCTION_URL}/api/v1`;
                        try { await SecureStore.setItemAsync(DEV_API_PREF_KEY, 'official'); } catch {}
                        console.log(`[api] Switched to official API: ${API_BASE_URL}`);
                        resolve();
                    },
                },
            ],
        );
    });
}

/**
 * Dev only: 公式APIの選択をリセットし、次回起動時にローカルを再試行する
 */
export async function resetApiPreference(): Promise<void> {
    if (!__DEV__) return;
    try { await SecureStore.deleteItemAsync(DEV_API_PREF_KEY); } catch {}
    API_BASE_URL = getDevBaseUrl();
    _devFallbackResolved = false;
    console.log(`[api] Reset to local: ${API_BASE_URL}`);
}

const TOKEN_KEY = 'auth_token';

// Error thrown for non-2xx API responses; carries the HTTP status so callers
// can distinguish auth failures (401) from network/server errors.
export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// Global handler invoked when a 401 cannot be recovered by token refresh.
// Registered by useAuthStore to force logout (clear token/stores → login screen).
let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (handler: (() => void) | null) => {
    onUnauthorized = handler;
};

// Types
export interface Subscription {
    id: number;
    user_id: string;
    service_name: string;
    plan_name?: string;
    amount: number;
    currency: string;
    billing_cycle: string;
    payment_method: string;
    payment_details?: string;
    icon_url?: string;
    memo?: string;
    next_payment_date: string;
    billing_anchor_day?: number;
    status: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateSubscriptionPayload {
    service_name: string;
    plan_name?: string;
    amount: number;
    currency?: string;
    billing_cycle?: string;
    payment_method?: string;
    payment_details?: string;
    icon_url?: string;
    memo?: string;
    next_payment_date: string;
    status?: string;
}

// PUT /subscriptions/{id}: omitted fields keep their value; sending an
// explicit null clears the nullable columns (plan_name, payment_details,
// icon_url, memo).
export interface UpdateSubscriptionPayload {
    service_name?: string;
    plan_name?: string | null;
    amount?: number;
    currency?: string;
    billing_cycle?: string;
    payment_method?: string;
    payment_details?: string | null;
    icon_url?: string | null;
    memo?: string | null;
    next_payment_date?: string;
}

// Auth Types
export interface AuthPayload {
    username: string;
    password?: string; // used for requests
    time_zone?: string; // required by registration, omitted by login
}

export interface User {
    id: string;
    username: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface UserSettings {
    user_id: string;
    language: string;
    currency: string;
    push_notifications: boolean;
    theme: string;
    time_zone: string;
}

export interface ChangePasswordPayload {
    current_password: string;
    new_password: string;
}

export interface UpdateProfilePayload {
    username: string;
}


export const getToken = async () => {
    try {
        if (Platform.OS === 'web') {
            return globalThis.sessionStorage?.getItem(TOKEN_KEY) ?? null;
        }
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('SecureStore.get failed:', error);
        return null;
    }
};

export const setToken = async (token: string) => {
    if (Platform.OS === 'web') {
        if (!globalThis.sessionStorage) {
            throw new Error('Web session storage is unavailable');
        }
        globalThis.sessionStorage.setItem(TOKEN_KEY, token);
        if (globalThis.sessionStorage.getItem(TOKEN_KEY) !== token) {
            throw new Error('Failed to persist the authentication token');
        }
        return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (await SecureStore.getItemAsync(TOKEN_KEY) !== token) {
        throw new Error('Failed to persist the authentication token');
    }
};

export const clearToken = async () => {
    if (Platform.OS === 'web') {
        if (!globalThis.sessionStorage) {
            throw new Error('Web session storage is unavailable');
        }
        globalThis.sessionStorage.removeItem(TOKEN_KEY);
        if (globalThis.sessionStorage.getItem(TOKEN_KEY) !== null) {
            throw new Error('Failed to remove the authentication token');
        }
        return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    if (await SecureStore.getItemAsync(TOKEN_KEY) !== null) {
        throw new Error('Failed to remove the authentication token');
    }
};

// Rate limiter (sliding window)
const RATE_LIMITS: { pattern: RegExp; max: number; windowMs: number }[] = [
    { pattern: /\/auth\/(login|register)/, max: 5,  windowMs: 60_000 }, // 認証: 60秒に5回まで
    { pattern: /.*/,                        max: 30, windowMs: 30_000 }, // 全体: 30秒に30回まで
];
const requestTimestamps: Map<string, number[]> = new Map();

function checkRateLimit(endpoint: string): void {
    const now = Date.now();
    for (const { pattern, max, windowMs } of RATE_LIMITS) {
        if (!pattern.test(endpoint)) continue;
        const key = pattern.source;
        const timestamps = (requestTimestamps.get(key) ?? []).filter(t => now - t < windowMs);
        if (timestamps.length >= max) {
            const retryAfterSec = Math.ceil((timestamps[0] + windowMs - now) / 1000);
            throw new Error(`リクエストが多すぎます。${retryAfterSec}秒後に再試行してください。`);
        }
        timestamps.push(now);
        requestTimestamps.set(key, timestamps);
        break; // 最初にマッチしたルールのみ適用
    }
}

// Token refresh logic — single in-flight promise so concurrent 401s all wait
// for the same refresh. 'unauthorized' means the session is definitively dead
// (force logout); 'transient' means network/server trouble where the token
// may still be valid, so the session must be kept.
type RefreshResult = 'refreshed' | 'unauthorized' | 'transient';
let refreshPromise: Promise<RefreshResult> | null = null;

async function tryRefreshToken(): Promise<RefreshResult> {
    if (refreshPromise) return refreshPromise;
    const refreshSession = captureAuthSession();
    refreshPromise = (async (): Promise<RefreshResult> => {
        try {
            const token = await getToken();
            if (refreshSession && !isAuthSessionCurrent(refreshSession)) return 'transient';
            if (!token) return 'unauthorized';
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (refreshSession && !isAuthSessionCurrent(refreshSession)) return 'transient';
            if (response.status === 401 || response.status === 403) return 'unauthorized';
            if (!response.ok) return 'transient';
            const data = await response.json();
            if (data.token) {
                if (refreshSession && !isAuthSessionCurrent(refreshSession)) return 'transient';
                await setToken(data.token);
                return 'refreshed';
            }
            return 'transient';
        } catch {
            // Network failure — the token itself may still be fine
            return 'transient';
        }
    })().finally(() => {
        refreshPromise = null;
    });
    return refreshPromise;
}

// Custom Fetch Wrapper
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const requestSession = captureAuthSession();
    checkRateLimit(endpoint);
    // Diagnostics are dev-only: URLs and token presence must not be logged
    // in production builds.
    if (__DEV__) {
        console.log(`[fetchAPI] START ${options.method || 'GET'} ${endpoint}`);
        console.log(`[fetchAPI] BASE_URL: ${API_BASE_URL}`);
    }
    if (__DEV__ && options.body && endpoint.includes('/auth/')) {
        try {
            const body = JSON.parse(options.body as string);
            console.log(`[fetchAPI] auth payload: username="${body.username}" (len=${body.username?.length}), password len=${body.password?.length ?? 'UNDEFINED'}`);
        } catch {}
    }

    let token: string | null = null;
    try {
        token = await getToken();
        if (__DEV__) console.log(`[fetchAPI] getToken: ${token ? 'exists' : 'null'}`);
    } catch (e) {
        if (__DEV__) console.error(`[fetchAPI] getToken FAILED:`, e);
    }
    if (requestSession && !isAuthSessionCurrent(requestSession)) {
        throw new Error('Authentication session changed');
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const url = `${API_BASE_URL}${endpoint}`;
    if (__DEV__) console.log(`[fetchAPI] fetching: ${url}`);
    let response: Response;
    try {
        response = await fetch(url, {
            ...options,
            headers,
        });
        if (requestSession && !isAuthSessionCurrent(requestSession)) {
            throw new Error('Authentication session changed');
        }
        if (__DEV__) console.log(`[fetchAPI] response status: ${response.status}`);
    } catch (fetchError: any) {
        if (__DEV__) console.error(`[fetchAPI] fetch THREW:`, fetchError?.message, fetchError);
        throw fetchError;
    }

    // Auto-refresh token on 401
    if (response.status === 401 && token && !endpoint.includes('/auth/refresh')) {
        const refreshResult = await tryRefreshToken();
        if (refreshResult === 'refreshed') {
            const newToken = await getToken();
            const retryHeaders = {
                ...headers,
                Authorization: `Bearer ${newToken}`,
            };
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: retryHeaders,
            });
            if (!retryResponse.ok) {
                if (retryResponse.status === 401) onUnauthorized?.();
                const errorData = await retryResponse.json().catch(() => ({}));
                throw new ApiError(errorData.error || `Request failed with status ${retryResponse.status}`, retryResponse.status);
            }
            const text = await retryResponse.text();
            return text ? JSON.parse(text) : {} as unknown as T;
        }
        // Force logout only when the server definitively rejected the token
        // (expired beyond the grace window). Transient network/5xx failures
        // keep the session — the next request will retry the refresh.
        if (refreshResult === 'unauthorized') onUnauthorized?.();
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (__DEV__) console.log(`[fetchAPI] error response: ${JSON.stringify(errorData)}`);
        throw new ApiError(errorData.error || `Request failed with status ${response.status}`, response.status);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : {} as unknown as T;
}

// Auth Endpoints
export const authApi = {
    register: (data: AuthPayload) => fetchAPI<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    login: (data: AuthPayload) => fetchAPI<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    me: () => fetchAPI<User>('/auth/me', {
        method: 'GET',
    }),
    changePassword: (data: ChangePasswordPayload) => fetchAPI<void>('/auth/password', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    updateProfile: (data: UpdateProfilePayload) => fetchAPI<User>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
};

// Settings Endpoints
export const settingsApi = {
    get: () => fetchAPI<UserSettings>('/settings'),
    update: (data: Partial<Omit<UserSettings, 'user_id' | 'updated_at'>>) =>
        fetchAPI<UserSettings>('/settings', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};

// Subscription Endpoints
export const subscriptionApi = {
    getAll: () => fetchAPI<Subscription[]>('/subscriptions/list'),
    getUpcoming: () => fetchAPI<Subscription[]>('/subscriptions/upcoming'),
    create: (data: CreateSubscriptionPayload) => fetchAPI<Subscription>('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: number, data: UpdateSubscriptionPayload) => fetchAPI<Subscription>(`/subscriptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    // Server returns an empty 200 — there is no body to consume
    updateStatus: (id: number, status: string) => fetchAPI<void>(`/subscriptions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }),
    delete: (id: number) => fetchAPI<{ message: string }>(`/subscriptions/${id}`, {
        method: 'DELETE',
    }),
    // Server-side rollover of overdue next_payment_date values; returns the
    // refreshed list so callers can skip a separate getAll.
    renew: () => fetchAPI<{ updated: number; subscriptions: Subscription[] }>('/subscriptions/renew', {
        method: 'POST',
    }),
};

// Helper to get the current API base URL (runtime value, reflects fallback)
export const getApiBaseUrl = () => API_BASE_URL;

// Helper to check if currently using public (production) API
export const isUsingPublicApi = () => API_BASE_URL.includes(PRODUCTION_URL);

// Helper to get the server base URL (without /api/v1). Derived from the
// runtime API_BASE_URL so it follows the dev → production fallback chosen
// in ensureApiReachable instead of recomputing the dev default.
export const getServerBaseUrl = () => API_BASE_URL.replace(/\/api\/v1\/?$/, '');

// Payment Method Types
export interface PaymentMethod {
    id: string;
    user_id: string;
    type: string;
    label: string;
    icon_name?: string;
    icon_uri?: string;
    color: string;
    last4?: string;
    card_brand?: string;
    memo?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreatePaymentMethodPayload {
    type?: string;
    label: string;
    icon_name?: string;
    icon_uri?: string;
    color?: string;
    last4?: string;
    card_brand?: string;
    memo?: string;
}

// PUT /payment-methods/{id}: omitted fields keep their value; sending an
// explicit null clears the nullable columns.
export interface UpdatePaymentMethodPayload {
    label?: string;
    icon_name?: string | null;
    icon_uri?: string | null;
    color?: string;
    last4?: string | null;
    card_brand?: string | null;
    memo?: string | null;
}

// Payment Method Endpoints
export const paymentMethodApi = {
    getAll: () => fetchAPI<PaymentMethod[]>('/payment-methods'),
    create: (data: CreatePaymentMethodPayload) => fetchAPI<PaymentMethod>('/payment-methods', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: UpdatePaymentMethodPayload) => fetchAPI<void>(`/payment-methods/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchAPI<void>(`/payment-methods/${id}`, {
        method: 'DELETE',
    }),
};

// Gmail Integration Types
export interface GmailIntegration {
    gmail_email: string;
    paidy_amount: number | null;
    paidy_month: string | null;
    paidy_next_payment_date: string | null;
    paidy_transactions: { date: string; amount: number; merchant: string }[] | null;
    last_synced_at: string;
    updated_at: string;
}

export interface UpsertGmailIntegrationPayload {
    gmail_email: string;
    paidy_amount: number | null;
    paidy_month: string | null;
    paidy_next_payment_date: string | null;
    paidy_transactions: { date: string; amount: number; merchant: string }[] | null;
    last_synced_at: string;
}

// Gmail Integration Endpoints
export const gmailApi = {
    getIntegration: () => fetchAPI<GmailIntegration>('/gmail/integration'),
    upsertIntegration: (data: UpsertGmailIntegrationPayload) =>
        fetchAPI<GmailIntegration>('/gmail/integration', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    deleteIntegration: () =>
        fetchAPI<void>('/gmail/integration', { method: 'DELETE' }),
};

// Version Endpoint
export const versionApi = {
    getServerVersion: () => fetchAPI<{ version: string }>('/version'),
};

// Resolve a potentially relative icon URL to an absolute URL
export const resolveIconUrl = (iconUrl: string): string => {
    if (!iconUrl || iconUrl.startsWith('http')) return iconUrl;
    // Route uploaded files through /api/v1/uploads/ so reverse proxies
    // that only forward /api/v1/* can serve them correctly.
    if (iconUrl.startsWith('/uploads/')) return `${API_BASE_URL}${iconUrl}`;
    if (iconUrl.startsWith('/')) return `${API_BASE_URL.replace('/api/v1', '')}${iconUrl}`;
    return iconUrl;
};

// Upload Endpoints
export const uploadApi = {
    deletePending: (url: string) => fetchAPI<void>('/upload/icon', {
        method: 'DELETE',
        body: JSON.stringify({ url }),
    }),
    uploadIcon: async (uri: string): Promise<{ url: string }> => {
        const uploadSession = captureAuthSession();
        const token = await getToken();
        if (uploadSession && !isAuthSessionCurrent(uploadSession)) {
            throw new Error('Authentication session changed');
        }
        let uploadUri = uri;
        let filename = uri.split('/').pop()?.split('?')[0] || 'icon.jpg';
        const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
        // The server only accepts png/jpg/jpeg/gif/webp. iOS photos are often
        // HEIC/HEIF, so convert those to JPEG before uploading instead of
        // letting the server reject them with 415.
        if (ext === 'heic' || ext === 'heif') {
            const converted = await manipulateAsync(uri, [], {
                compress: 0.9,
                format: SaveFormat.JPEG,
            });
            uploadUri = converted.uri;
            filename = filename.replace(/\.[^.]+$/, '.jpg');
        }
        const formData = new FormData();
        if (Platform.OS === 'web') {
            // No file:// paths on web — the picker hands out blob:/data:
            // URIs that fetch can read back into a Blob.
            const blob = await (await fetch(uploadUri)).blob();
            formData.append('file', blob, filename);
        } else {
            // Expo's WinterCG fetch rejects React Native's legacy
            // { uri, name, type } parts with "Unsupported FormDataPart
            // implementation" — it only accepts strings, Blobs, or objects
            // exposing bytes(), like expo-file-system's File.
            formData.append('file', new FileSystemFile(uploadUri) as unknown as Blob);
        }

        const response = await fetch(`${API_BASE_URL}/upload/icon`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        if (uploadSession && !isAuthSessionCurrent(uploadSession)) {
            throw new Error('Authentication session changed');
        }

        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
        }

        return response.json();
    },
};
