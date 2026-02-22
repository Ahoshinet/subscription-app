import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
    const SERVER_PORT = 3000;

    if (__DEV__) {
        const hostUri = Constants.expoConfig?.hostUri;
        if (hostUri) {
            const host = hostUri.split(':')[0];
            return `http://${host}:${SERVER_PORT}/api`;
        }
        if (Platform.OS === 'android') {
            return `http://10.0.2.2:${SERVER_PORT}/api`;
        }
        return `http://localhost:${SERVER_PORT}/api`;
    }

    return `https://your-production-api.com/api`;
};

const API_BASE_URL = getApiBaseUrl();

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

// Token Management
export const getToken = async () => {
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Failed to get token:', error);
        return null;
    }
};

export const setToken = async (token: string) => {
    try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
        console.error('Failed to save token:', error);
    }
};

export const clearToken = async () => {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Failed to clear token:', error);
    }
};

// Custom Fetch Wrapper
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : {};
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

// Helper to get the server base URL (without /api)
export const getServerBaseUrl = () => {
    const SERVER_PORT = 3000;
    if (__DEV__) {
        const hostUri = Constants.expoConfig?.hostUri;
        if (hostUri) {
            const host = hostUri.split(':')[0];
            return `http://${host}:${SERVER_PORT}`;
        }
        if (Platform.OS === 'android') return `http://10.0.2.2:${SERVER_PORT}`;
        return `http://localhost:${SERVER_PORT}`;
    }
    return 'https://your-production-api.com';
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
