export interface AuthSessionSnapshot {
    generation: number;
    userId: string;
}

let generation = 0;
let activeUserId: string | null = null;

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
