"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { API_URLS } from "../../config/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import styles from "./signup.module.scss";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const { isSignedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, isLoading, router]);

  const validateForm = () => {
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
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

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }

    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return false;
    }

    if (nickname.length < 2) {
      setError("닉네임은 최소 2자 이상이어야 합니다.");
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
      const res = await fetch(API_URLS.SIGNUP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "회원가입에 실패했습니다.");
      }

      setSuccess("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");

      // 2초 후 로그인 페이지로 리다이렉트
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "회원가입 중 오류가 발생했습니다.");
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
        <h2 className={styles.title}>Sign Up</h2>
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
              placeholder="비밀번호를 입력하세요 (최소 6자)"
              disabled={loading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="비밀번호를 다시 입력하세요"
              disabled={loading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              className={styles.input}
              placeholder="닉네임을 입력하세요 (최소 2자)"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? "가입 중..." : "Sign Up"}
          </button>
          {success && <div className={styles.successMessage}>{success}</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}
        </form>
        <div className={styles.linkWrapper}>
          <p className={styles.linkText}>
            이미 계정이 있으신가요?{" "}
            <a href="/signin" className={styles.link}>
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
