const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function getAccessToken() { return localStorage.getItem('drrm_access_token'); }
function getRefreshToken() { return localStorage.getItem('drrm_refresh_token'); }

function clearSessionAndRedirect() {
  localStorage.removeItem('drrm_access_token');
  localStorage.removeItem('drrm_refresh_token');
  localStorage.removeItem('drrm_user');
  window.location.href = '/login';
}

// Shared in-flight refresh promise: if several requests 401 at nearly the
// same moment (e.g. the Emergency Mode poll and a user click landing
// together), they all await the SAME refresh call instead of each firing
// their own — avoiding a burst of redundant /auth/refresh requests and any
// risk of one succeeding while another races it.
let refreshPromise = null;

async function performRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('Refresh token invalid or expired');

  const data = await res.json();
  localStorage.setItem('drrm_access_token', data.accessToken);
  return data.accessToken;
}

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

/**
 * Thin fetch wrapper: attaches the JWT access token, parses JSON, and
 * normalizes errors.
 *
 * On a 401 (expired access token — these are short-lived by design, see
 * JWT_ACCESS_EXPIRES_IN in the backend .env), it silently exchanges the
 * refresh token for a new access token and retries the SAME request once,
 * so the user never sees a login screen mid-session. Only if that refresh
 * itself fails (refresh token also expired/invalid — this is the genuine
 * "your session is over" case) does it clear storage and redirect to
 * /login. `isRetry` prevents this from looping forever if the retried
 * request 401s again for some other reason.
 */
async function request(path, { method = 'GET', body, headers = {} } = {}, isRetry = false) {
  const accessToken = getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    if (isRetry) {
      clearSessionAndRedirect();
      return null;
    }
    try {
      await refreshAccessToken();
      return request(path, { method, body, headers }, true);
    } catch {
      clearSessionAndRedirect();
      return null;
    }
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }

  return data;
}

/**
 * Separate from request() because file uploads must NOT send
 * Content-Type: application/json (and must NOT JSON.stringify the body) —
 * the browser needs to set its own multipart/form-data boundary header.
 * Same silent-refresh-and-retry behavior as request() on a 401.
 */
async function upload(path, formData, isRetry = false) {
  const accessToken = getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: formData,
  });

  if (res.status === 401) {
    if (isRetry) {
      clearSessionAndRedirect();
      return null;
    }
    try {
      await refreshAccessToken();
      return upload(path, formData, true);
    } catch {
      clearSessionAndRedirect();
      return null;
    }
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || `Upload failed: ${res.status}`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload,
};
