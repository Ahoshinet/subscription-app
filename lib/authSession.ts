export interface AuthSessionSnapshot {
    generation: number;
    userId: string;
}

let generation = 0;
let activeUserId: string | null = null;

export function getAuthTokenUserId(token: string): string | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3 || typeof globalThis.atob !== 'function') return null;

        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        const claims = JSON.parse(globalThis.atob(padded)) as { sub?: unknown };

        return typeof claims.sub === 'string' && claims.sub.length > 0
            ? claims.sub
            : null;
    } catch {
        return null;
    }
}

export function activateAuthSession(userId: string): AuthSessionSnapshot {
    generation += 1;
    activeUserId = userId;
    return { generation, userId };
}

export function invalidateAuthSession(): void {
    generation += 1;
    activeUserId = null;
}

export function captureAuthSession(): AuthSessionSnapshot | null {
    return activeUserId == null ? null : { generation, userId: activeUserId };
}

export function isAuthSessionCurrent(snapshot: AuthSessionSnapshot | null): boolean {
    return snapshot != null
        && snapshot.generation === generation
        && snapshot.userId === activeUserId;
}
