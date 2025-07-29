"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URLS } from "@/config/api";
import styles from "./signup.module.scss";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        throw new Error(data.message || "회원가입 실패");
      }
      setSuccess("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");

      // 2초 후 로그인 페이지로 리다이렉트
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={styles.input}
              placeholder="닉네임을 입력하세요"
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
