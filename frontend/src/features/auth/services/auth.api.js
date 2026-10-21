import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, //to send cookies to the server
});

let currentAccessToken = null;
let onAccessTokenChange = () => {};
let refreshPromise = null;

export function configureAuth(accessToken, setAccessToken) {
  currentAccessToken = accessToken;
  onAccessTokenChange = setAccessToken;
}

api.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }

  return config;
});

export async function refreshToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        // Use axios directly so a refresh 401 won't trigger the api interceptor.
        const response = await axios.get(
          `${API_BASE_URL}/api/auth/refresh-token`,
          { withCredentials: true },
        );

        currentAccessToken = response.data.accessToken;
        onAccessTokenChange(response.data.accessToken);

        return response.data;
      } catch (err) {
        currentAccessToken = null;
        onAccessTokenChange(null);

        // No refresh cookie means the user is simply logged out.
        if (err.response?.status !== 401) {
          console.error("Refresh request failed:", err);
        }

        throw err;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (err) => {
    const originalRequest = err.config;

    if (
      err.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retried ||
      originalRequest.url?.includes("/api/auth/refresh-token")
    ) {
      return Promise.reject(err);
    }

    originalRequest._retried = true;

    try {
      await refreshToken();
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export async function register({ username, email, password }) {
  try {
    const response = await api.post("/api/auth/register", {
      username,
      email,
      password,
    });

    currentAccessToken = response.data.accessToken;
    onAccessTokenChange(response.data.accessToken);

    return response.data;
  } catch (err) {
    console.log(err);
  }
}

export async function login({ email, password }) {
  try {
    const response = await api.post("/api/auth/login", {
      email,
      password,
    });

    currentAccessToken = response.data.accessToken;
    onAccessTokenChange(response.data.accessToken);

    return response.data;
  } catch (err) {
    console.log(err);
  }
}

export async function logout() {
  try {
    const response = await api.get("/api/auth/logout");

    currentAccessToken = null;
    onAccessTokenChange(null);

    return response.data;
  } catch (err) {
    console.log(err);
  }
}

export async function getMe(accessToken = currentAccessToken) {
  try {
    const response = await api.get("/api/auth/get-me", {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });

    return response.data;
  } catch (err) {
    console.log(err);
  }
}
