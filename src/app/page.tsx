"use client";
import { useState } from "react";
import styles from "./page.module.scss";

export default function Home() {
  const [form, setForm] = useState({
    date: "",
    distance: 0,
    style: "freestyle",
    duration: 0,
    frequency_per_week: 1,
    goal: "endurance",
  });
  const [loading, setLoading] = useState(false);
  const [recommend, setRecommend] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setRecommend(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("로그인이 필요합니다.");
      // 기록 저장
      const recordRes = await fetch("http://localhost:3001/api/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!recordRes.ok) {
        const data = await recordRes.json();
        throw new Error(data.message || "기록 저장 실패");
      }
      setSuccess("기록이 저장되었습니다.");
      // 추천 요청
      const recommendRes = await fetch("http://localhost:3001/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!recommendRes.ok) {
        const data = await recommendRes.json();
        throw new Error(data.message || "추천 실패");
      }
      const recommendData = await recommendRes.json();
      setRecommend(recommendData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navigation}>
        <div className={styles.navContent}>
          <h1 className={styles.logo}>Just Swim AI</h1>
          <div className={styles.navLinks}>
            <a href="/signin" className={styles.navLink}>
              Sign In
            </a>
            <a href="/signup" className={styles.navLink}>
              Sign Up
            </a>
          </div>
        </div>
      </nav>

      <div className={styles.mainContent}>
        <div className={styles.formWrapper}>
          <h2 className={styles.title}>수영 기록 입력 및 맞춤 추천</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>날짜</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>거리(m)</label>
              <input
                type="number"
                name="distance"
                value={form.distance}
                onChange={handleChange}
                required
                min={0}
                className={styles.input}
                placeholder="수영한 거리를 입력하세요"
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>영법</label>
              <select
                name="style"
                value={form.style}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="freestyle">자유형</option>
                <option value="backstroke">배영</option>
                <option value="breaststroke">평영</option>
                <option value="butterfly">접영</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>시간(분)</label>
              <input
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                required
                min={0}
                className={styles.input}
                placeholder="수영한 시간을 입력하세요"
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>주간 빈도(회)</label>
              <input
                type="number"
                name="frequency_per_week"
                value={form.frequency_per_week}
                onChange={handleChange}
                required
                min={1}
                className={styles.input}
                placeholder="주간 수영 빈도를 입력하세요"
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>목표</label>
              <select
                name="goal"
                value={form.goal}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="endurance">지구력</option>
                <option value="speed">스피드</option>
                <option value="technique">테크닉</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? "처리 중..." : "기록 저장 및 추천 받기"}
            </button>
            {success && <div className={styles.successMessage}>{success}</div>}
            {error && <div className={styles.errorMessage}>{error}</div>}
          </form>
          {recommend && (
            <div className={styles.recommendationCard}>
              <h3 className={styles.recommendationTitle}>맞춤 추천 결과</h3>
              <div className={styles.recommendationContent}>
                <div className={styles.recommendationItem}>
                  <span className={styles.recommendationLabel}>수영 훈련:</span>
                  <span className={styles.recommendationText}>
                    {recommend.swim_training}
                  </span>
                </div>
                <div className={styles.recommendationItem}>
                  <span className={styles.recommendationLabel}>지상 운동:</span>
                  <span className={styles.recommendationText}>
                    {recommend.dryland_training}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
