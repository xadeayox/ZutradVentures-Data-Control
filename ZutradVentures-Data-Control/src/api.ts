// ─── Central API Helper ───────────────────────────────────────────────────────
// Instead of calling fetch() directly in every component, we call apiFetch().
// It automatically:
// 1. Attaches the Authorization token to every request
// 2. Detects a 401 Unauthorized response (expired or invalid token)
// 3. Clears localStorage and redirects the user to login
//
// This means no matter which page the user is on, if their token expires,
// they will be sent back to the login page automatically.

const BASE_URL = 'http://localhost:5000';
// replace with: http://zutrad-ventures-data-control-env.eba-kpm7wuuy.eu-north-1.elasticbeanstalk.com
// http://localhost:5000

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = localStorage.getItem('token');

    // Merge the Authorization header into whatever headers were passed in
    const headers: HeadersInit = {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    // Don't set Content-Type for FormData — browser sets it automatically
    // with the correct boundary. Only set it for JSON requests.
    if (!(options.body instanceof FormData)) {
        (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    // ── 401 means the token is expired or invalid ─────────────────────────────
    if (response.status === 401) {
        // Clear everything from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to login page
        window.location.href = '/';
    }

    return response;
}
