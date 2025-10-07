import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const useFetchUser = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      setIsLoggedIn(true);
    } catch (err) {
      setUser(null);
      setIsLoggedIn(false);
      console.warn("Unauthorized — possible expired token or not logged in.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    setUser(null);
    setIsLoggedIn(false);
    navigate("/login");
  };

  return { user, isLoggedIn, loading, fetchUser, logout };
};

export default useFetchUser;
