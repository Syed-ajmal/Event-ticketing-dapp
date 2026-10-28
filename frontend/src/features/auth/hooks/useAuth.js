import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context.jsx";
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
} from "../services/auth.api.js";

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { user, setUser, loading, setLoading, accessToken, setAccessToken } =
    context;

  

  const handleLogin = async ({ email, password }) => {
    setLoading(true);

    try {
      const data = await login({ email, password });

      if (!data?.user || !data?.accessToken) {
        return { success: false, message: "Invalid email or password." };
      }

      const profile = await getMe(data.accessToken);
      setUser(profile?.user ?? data.user);
      setAccessToken(data.accessToken);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message:
          err.response?.data?.message || "Unable to log in. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ username, email, password }) => {
    setLoading(true);

    try {
      const data = await register({ username, email, password });

      if (!data?.user || !data?.accessToken) {
        return { success: false, message: "Unable to create your account." };
      }

      setAccessToken(data.accessToken);

      // Registration returns only username and email. Load the canonical
      // profile so role-based UI (such as event ticket claims) is correct
      // immediately without requiring a page refresh.
      const profile = await getMe(data.accessToken);
      setUser(
        profile?.user ?? {
          ...data.user,
          role: "attendee",
          walletAddress: null,
        },
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message:
          err.response?.status === 409
            ? "Username or email already taken"
            : err.response?.data?.message || "Unable to register. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);

    try {
      await logout();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setUser(null);
      setAccessToken(null);
      setLoading(false);
    }
  };

  return { user, loading, handleLogin, handleRegister, handleLogout };
};
