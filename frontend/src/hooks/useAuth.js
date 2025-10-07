// hooks/useAuth.js
import { use, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js'

const IS_LOGGED_IN = 'isLoggedIn';
const USER_ROLE = 'userRole';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);  
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {    
    const role = localStorage.getItem(USER_ROLE);

    if (role) {
      setIsLoggedIn(true);
        setUserRole(role);
    } else {
      clearAuthData();
    }
  }, []);

  const saveAuthData = (user) => {    
    localStorage.setItem(USER_ROLE, user.role);    
    localStorage.setItem(IS_LOGGED_IN, true);    

    setIsLoggedIn(true);
    setUserRole(user.role);
  };

  const clearAuthData = () => {
    localStorage.clear();

    setIsLoggedIn(false);    
    setUserRole('');
  };  

  const login = (user) => {
    saveAuthData(user);
    if (user.role === 'CEO') {
      navigate(`/admin`);
    } else if (user.role === 'Manager') {
      navigate(`/manager/dashboard`)
    } else {
      navigate('/');
    }
  };

  const logout = async () => {
  // Call backend to clear cookie
  try {
    await api.post("/auth/logout"); // Assuming you have axios instance 'api'
  } catch (err) {
    console.log("Failed to logout from server:", err);
  }

  clearAuthData();  
  navigate("/");
};


  return {
    isLoggedIn,    
    logout,
    userRole,
    setUserRole,
    login
  };
};

export default useAuth;