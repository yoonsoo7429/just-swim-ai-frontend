"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URLS } from "@/config/api";
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [userStats, setUserStats] = useState({
    totalDistance: 0,
    totalTime: 0,
    weeklyGoal: 2000, // 2km 목표
    weeklyProgress: 0,
    thisWeekDistance: 0,
    thisWeekTime: 0,
  });
  const router = useRouter();

  // 쿠키에서 토큰 읽기
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  // 로그아웃 함수
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsLoggedIn(false);
    router.push("/signin");
  };

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") || getCookie("access_token");
    setIsLoggedIn(!!token);

    // 임시 데이터 (실제로는 API에서 가져올 데이터)
    if (token) {
      setUserStats({
        totalDistance: 8500,
        totalTime: 420,
        weeklyGoal: 2000,
        weeklyProgress: 65,
        thisWeekDistance: 1300,
        thisWeekTime: 78,
      });
    }
  }, []);

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
      const token =
        localStorage.getItem("access_token") || getCookie("access_token");
      if (!token) throw new Error("로그인이 필요합니다.");
      // 기록 저장
      const recordRes = await fetch(API_URLS.RECORDS, {
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
      setSuccess("기록이 저장되었습니다!");
      setShowRecordForm(false);

      // 통계 업데이트
      setUserStats((prev) => ({
        ...prev,
        thisWeekDistance: prev.thisWeekDistance + form.distance,
        thisWeekTime: prev.thisWeekTime + form.duration,
        weeklyProgress: Math.min(
          100,
          ((prev.thisWeekDistance + form.distance) / prev.weeklyGoal) * 100
        ),
      }));

      // 추천 요청
      const recommendRes = await fetch(API_URLS.RECOMMEND, {
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

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
  };

  const formatDistance = (meters: number) => {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navigation}>
        <div className={styles.navContent}>
          <h1 className={styles.logo}>Just Swim AI</h1>
          <div className={styles.navLinks}>
            {isLoggedIn ? (
              <button onClick={handleLogout} className={styles.navLink}>
                Sign Out
              </button>
            ) : (
              <>
                <a href="/signin" className={styles.navLink}>
                  Sign In
                </a>
                <a href="/signup" className={styles.navLink}>
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className={styles.mainContent}>
        {!isLoggedIn ? (
          <div className={styles.formWrapper}>
            <h2 className={styles.title}>
              Just Swim AI에 오신 것을 환영합니다!
            </h2>
            <p className={styles.welcomeText}>
              수영 기록을 입력하고 맞춤형 추천을 받으려면 로그인해주세요.
            </p>
            <div className={styles.authButtons}>
              <a href="/signin" className={styles.authButton}>
                Sign In
              </a>
              <a href="/signup" className={styles.authButton}>
                Sign Up
              </a>
            </div>
          </div>
        ) : (
          <div className={styles.dashboardContainer}>
            {/* 헤더 섹션 */}
            <div className={styles.dashboardHeader}>
              <h2 className={styles.dashboardTitle}>수영 대시보드</h2>
              <p className={styles.dashboardSubtitle}>
                이번 주 수영 기록을 확인하고 새로운 기록을 추가해보세요
              </p>
            </div>

            {/* 통계 카드들 */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🏊‍♂️</div>
                <div className={styles.statContent}>
                  <h3 className={styles.statTitle}>이번 주 거리</h3>
                  <p className={styles.statValue}>
                    {formatDistance(userStats.thisWeekDistance)}
                  </p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>⏱️</div>
                <div className={styles.statContent}>
                  <h3 className={styles.statTitle}>이번 주 시간</h3>
                  <p className={styles.statValue}>
                    {formatTime(userStats.thisWeekTime)}
                  </p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>🎯</div>
                <div className={styles.statContent}>
                  <h3 className={styles.statTitle}>주간 목표</h3>
                  <p className={styles.statValue}>
                    {userStats.weeklyProgress.toFixed(0)}%
                  </p>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${userStats.weeklyProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statContent}>
                  <h3 className={styles.statTitle}>총 거리</h3>
                  <p className={styles.statValue}>
                    {formatDistance(userStats.totalDistance)}
                  </p>
                </div>
              </div>
            </div>

            {/* 액션 카드들 */}
            <div className={styles.actionGrid}>
              <div className={styles.actionCard}>
                <h3 className={styles.actionTitle}>새로운 기록 추가</h3>
                <p className={styles.actionDescription}>
                  오늘의 수영 기록을 입력하고 맞춤형 추천을 받아보세요
                </p>
                <button
                  onClick={() => setShowRecordForm(true)}
                  className={styles.actionButton}
                >
                  기록 입력하기
                </button>
              </div>

              {recommend && (
                <div className={styles.recommendationCard}>
                  <h3 className={styles.recommendationTitle}>오늘의 추천</h3>
                  <div className={styles.recommendationContent}>
                    <div className={styles.recommendationItem}>
                      <span className={styles.recommendationLabel}>
                        수영 훈련:
                      </span>
                      <span className={styles.recommendationText}>
                        {recommend.swim_training}
                      </span>
                    </div>
                    <div className={styles.recommendationItem}>
                      <span className={styles.recommendationLabel}>
                        지상 운동:
                      </span>
                      <span className={styles.recommendationText}>
                        {recommend.dryland_training}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 기록 입력 폼 (모달 스타일) */}
            {showRecordForm && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>수영 기록 입력</h3>
                    <button
                      onClick={() => setShowRecordForm(false)}
                      className={styles.closeButton}
                    >
                      ✕
                    </button>
                  </div>

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
                    <div className={styles.modalActions}>
                      <button
                        type="button"
                        onClick={() => setShowRecordForm(false)}
                        className={styles.cancelButton}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={styles.submitButton}
                      >
                        {loading ? "저장 중..." : "기록 저장"}
                      </button>
                    </div>
                  </form>

                  {success && (
                    <div className={styles.successMessage}>{success}</div>
                  )}
                  {error && <div className={styles.errorMessage}>{error}</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
