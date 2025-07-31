import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, signout, userApi } from "../utils/api";
import { User } from "../types";

export const useAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUserProfile = async () => {
    try {
      setError(null);
      const userData = await userApi.getProfile();
      setUser(userData);
      setIsSignedIn(true);
    } catch (error: any) {
      console.error("Failed to fetch user profile:", error);
      setError(error.message || "사용자 정보를 불러오는데 실패했습니다.");
      setIsSignedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const token = getToken();
        if (token) {
          await fetchUserProfile();
        } else {
          setIsSignedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsSignedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleSignOut = () => {
    try {
      signout();
      setIsSignedIn(false);
      setUser(null);
      setError(null);
      router.push("/signin");
    } catch (error) {
      console.error("Sign out error:", error);
      setError("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const checkAuth = () => {
    const token = getToken();
    if (!token) {
      setIsSignedIn(false);
      setUser(null);
      router.push("/signin");
      return false;
    }
    return true;
  };

  const refreshUser = async () => {
    if (isSignedIn) {
      await fetchUserProfile();
    }
  };

  return {
    isSignedIn,
    isLoading,
    user,
    error,
    handleSignOut,
    checkAuth,
    refreshUser,
  };
};
