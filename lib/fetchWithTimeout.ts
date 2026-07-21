export class RequestTimeoutError extends Error {
    constructor(timeoutMs: number) {
        super(`Request timed out after ${timeoutMs}ms`);
        this.name = 'RequestTimeoutError';
    }
}

export async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs = 15_000,
): Promise<Response> {
    const controller = new AbortController();
    let timedOut = false;
    const abortFromCaller = () => controller.abort();
    if (init.signal?.aborted) controller.abort();
    init.signal?.addEventListener('abort', abortFromCaller, { once: true });
    const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
        if (timedOut) throw new RequestTimeoutError(timeoutMs);
        throw error;
    } finally {
        clearTimeout(timer);
        init.signal?.removeEventListener('abort', abortFromCaller);
    }
}
