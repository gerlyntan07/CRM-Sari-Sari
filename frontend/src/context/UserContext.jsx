import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { UserContext } from "./userContext";

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      setIsLoggedIn(true);
      return res.data;
    } catch (err) {
      setUser(null);
      setIsLoggedIn(false);
      console.warn(
        "Unauthorized — possible expired token or not logged in.",
        err
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // best-effort
    }
    setUser(null);
    setIsLoggedIn(false);
    navigate("/login");
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn,
      loading,
      fetchUser,
      mutate: fetchUser,
      logout,
    }),
    [user, isLoggedIn, loading, fetchUser, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
