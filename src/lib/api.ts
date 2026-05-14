/**
 * API helper that respects NEXT_PUBLIC_BASE_PATH so the same code works
 * whether the app is mounted at "/" (Railway default) or under a sub-path
 * like "/story_foraging_study".
 */

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function getApiPath(path: string): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${BASE_PATH}${cleanPath}`;
}
