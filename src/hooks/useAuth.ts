import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, signout } from "../utils/api";

export const useAuth = () => {
  const [isSignedIn, setisSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    setisSignedIn(!!token);
    setIsLoading(false);
  }, []);

  const handleSignOut = () => {
    signout();
    setisSignedIn(false);
    router.push("/signin");
  };

  const checkAuth = () => {
    const token = getToken();
    if (!token) {
      setisSignedIn(false);
      router.push("/signin");
      return false;
    }
    return true;
  };

  return {
    isSignedIn,
    isLoading,
    handleSignOut,
    checkAuth,
  };
};
