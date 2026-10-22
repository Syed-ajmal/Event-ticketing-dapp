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
        return false;
      }

      const profile = await getMe(data.accessToken);
      setUser(profile?.user ?? data.user);
      setAccessToken(data.accessToken);
      return true;
    } catch (err) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ username, email, password }) => {
    setLoading(true);

    try {
      const data = await register({ username, email, password });

      if (!data?.user || !data?.accessToken) {
        return false;
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      return true;
    } catch (err) {
      return false;
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
