"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { API_URLS } from "../../config/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import styles from "./signin.module.scss";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { isSignedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, isLoading, router]);

  const setCookie = (name: string, value: string, days: number = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return false;
    }
    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return false;
    }
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(API_URLS.SIGNIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "로그인에 실패했습니다.");
      }

      const data = await res.json();

      // localStorage와 쿠키에 토큰 저장
      localStorage.setItem("access_token", data.access_token);
      setCookie("access_token", data.access_token, 7); // 7일간 유효

      setSuccess("로그인 성공! 메인 페이지로 이동합니다.");

      // 1초 후 메인 페이지로 리다이렉트
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner size="large" text="인증 상태를 확인하는 중..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Sign In</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="이메일을 입력하세요"
              disabled={loading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="비밀번호를 입력하세요"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? "로그인 중..." : "Sign In"}
          </button>
          {success && <div className={styles.successMessage}>{success}</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}
        </form>
        <div className={styles.linkWrapper}>
          <p className={styles.linkText}>
            계정이 없으신가요?{" "}
            <a href="/signup" className={styles.link}>
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
