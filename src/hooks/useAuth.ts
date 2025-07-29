import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, logout } from "../utils/api";

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    router.push("/signin");
  };

  const checkAuth = () => {
    const token = getToken();
    if (!token) {
      setIsLoggedIn(false);
      router.push("/signin");
      return false;
    }
    return true;
  };

  return {
    isLoggedIn,
    isLoading,
    handleLogout,
    checkAuth,
  };
};
