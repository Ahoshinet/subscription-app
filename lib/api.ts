import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

const PRODUCTION_URL = 'https://subscription-manager.daruks.com';
const DEV_PORT = 8084;
const DEV_API_PREF_KEY = '__dev_use_official_api';

const getDevBaseUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const host = hostUri.split(':')[0];
        return `http://${host}:${DEV_PORT}/api`;
    }
    if (Platform.OS === 'android') {
        return `http://10.0.2.2:${DEV_PORT}/api`;
    }
    return `http://localhost:${DEV_PORT}/api`;
};

let API_BASE_URL = __DEV__ ? getDevBaseUrl() : `${PRODUCTION_URL}/api`;
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
            API_BASE_URL = `${PRODUCTION_URL}/api`;
            console.log(`[api] Restored preference: official API (${API_BASE_URL})`);
            return;
        }
    } catch { /* SecureStore unavailable, continue */ }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const healthUrl = API_BASE_URL.replace(/\/api$/, '/health');
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
                        API_BASE_URL = `${PRODUCTION_URL}/api`;
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

// Auth Types
export interface AuthPayload {
    username: string;
    password?: string; // used for requests
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
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('SecureStore.get failed:', error);
        return null;
    }
};

export const setToken = async (token: string) => {
    try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
        console.error('SecureStore.set failed:', error);
    }
};

export const clearToken = async () => {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('SecureStore.delete failed:', error);
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

// Token refresh logic
let isRefreshing = false;

async function tryRefreshToken(): Promise<boolean> {
    if (isRefreshing) return false;
    isRefreshing = true;
    try {
        const token = await getToken();
        if (!token) return false;
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) return false;
        const data = await response.json();
        if (data.token) {
            await setToken(data.token);
            return true;
        }
        return false;
    } catch {
        return false;
    } finally {
        isRefreshing = false;
    }
}

// Custom Fetch Wrapper
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    checkRateLimit(endpoint);
    console.log(`[fetchAPI] START ${options.method || 'GET'} ${endpoint}`);
    console.log(`[fetchAPI] BASE_URL: ${API_BASE_URL}`);
    if (__DEV__ && options.body && endpoint.includes('/auth/')) {
        try {
            const body = JSON.parse(options.body as string);
            console.log(`[fetchAPI] auth payload: username="${body.username}" (len=${body.username?.length}), password len=${body.password?.length ?? 'UNDEFINED'}`);
        } catch {}
    }

    let token: string | null = null;
    try {
        token = await getToken();
        console.log(`[fetchAPI] getToken: ${token ? 'exists' : 'null'}`);
    } catch (e) {
        console.error(`[fetchAPI] getToken FAILED:`, e);
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[fetchAPI] fetching: ${url}`);
    let response: Response;
    try {
        response = await fetch(url, {
            ...options,
            headers,
        });
        console.log(`[fetchAPI] response status: ${response.status}`);
    } catch (fetchError: any) {
        console.error(`[fetchAPI] fetch THREW:`, fetchError?.message, fetchError);
        throw fetchError;
    }

    // Auto-refresh token on 401
    if (response.status === 401 && token && !endpoint.includes('/auth/refresh')) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
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
                const errorData = await retryResponse.json().catch(() => ({}));
                throw new Error(errorData.error || `Request failed with status ${retryResponse.status}`);
            }
            const text = await retryResponse.text();
            return text ? JSON.parse(text) : {} as unknown as T;
        }
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log(`[fetchAPI] error response: ${JSON.stringify(errorData)}`);
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
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
    update: (id: number, data: Partial<Subscription>) => fetchAPI<Subscription>(`/subscriptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    updateStatus: (id: number, status: string) => fetchAPI<Subscription>(`/subscriptions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }),
    delete: (id: number) => fetchAPI<{ message: string }>(`/subscriptions/${id}`, {
        method: 'DELETE',
    }),
};

// Helper to get the current API base URL (runtime value, reflects fallback)
export const getApiBaseUrl = () => API_BASE_URL;

// Helper to check if currently using public (production) API
export const isUsingPublicApi = () => API_BASE_URL.includes(PRODUCTION_URL);

// Helper to get the server base URL (without /api)
export const getServerBaseUrl = () => {
    if (__DEV__) {
        const hostUri = Constants.expoConfig?.hostUri;
        if (hostUri) {
            const host = hostUri.split(':')[0];
            return `http://${host}:${DEV_PORT}`;
        }
        if (Platform.OS === 'android') return `http://10.0.2.2:${DEV_PORT}`;
        return `http://localhost:${DEV_PORT}`;
    }
    return PRODUCTION_URL;
};

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

// Payment Method Endpoints
export const paymentMethodApi = {
    getAll: () => fetchAPI<PaymentMethod[]>('/payment-methods'),
    create: (data: CreatePaymentMethodPayload) => fetchAPI<PaymentMethod>('/payment-methods', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<CreatePaymentMethodPayload>) => fetchAPI<void>(`/payment-methods/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchAPI<void>(`/payment-methods/${id}`, {
        method: 'DELETE',
    }),
};

// Upload Endpoints
export const uploadApi = {
    uploadIcon: async (uri: string): Promise<{ url: string }> => {
        const token = await getToken();
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'icon.png';
        const ext = filename.split('.').pop() || 'png';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        formData.append('file', {
            uri,
            name: filename,
            type: mimeType,
        } as any);

        const response = await fetch(`${API_BASE_URL}/upload/icon`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
        }

        return response.json();
    },
};
