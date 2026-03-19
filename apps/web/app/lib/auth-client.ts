const TOKEN_KEY = 'baby_bites_access_token';

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredAccessToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredAccessToken() {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
}
