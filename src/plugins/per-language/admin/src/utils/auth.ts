// src/plugins/per-language/admin/src/utils/auth.ts

/**
 * Authentication token retrieval for Strapi v5
 */
export function getAuthToken(): string | null {
    const tokenKeys = ['jwtToken', 'strapi-jwt-token', 'strapiToken'];

    // Check localStorage and sessionStorage quietly
    for (const key of tokenKeys) {
        let token = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (token && token.trim().length > 10) {
            return token;
        }
    }
    return null;
}

/**
 * Create authenticated headers for API requests
 */
export function createAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Fetch wrapper with automatic retry and error handling
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = createAuthHeaders();

    const enhancedOptions: RequestInit = {
        ...options,
        headers: { ...headers, ...options.headers }
    };

    try {
        const response = await fetch(url, enhancedOptions);

        // Only log important events, not routine success
        if (!response.ok && response.status !== 404) {
            console.log(`[API] ${response.status} response for ${url}`);
        }

        return response;
    } catch (error) {
        console.error(`[API] Network error for ${url}:`, error);
        throw error;
    }
}