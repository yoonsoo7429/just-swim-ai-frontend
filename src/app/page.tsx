"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URLS } from "@/config/api";
import styles from "./page.module.scss";

interface UserStats {
  totalRecords: number;
  totalDistance: number;
  totalTime: number;
  averageDistance: number;
  averageTime: number;
  personalBests: {
    distance: number;
    duration: number;
    speed: number;
  } | null;
  weeklyStats: {
    totalDistance: number;
    totalTime: number;
    sessionCount: number;
    averageDistance: number;
    averageTime: number;
  } | null;
}

interface StyleStats {
  [key: string]: {
    count: number;
    totalDistance: number;
    totalTime: number;
    averageDistance: number;
    averageTime: number;
    bestDistance: number;
    bestTime: number;
  };
}

interface TrainingAnalysis {
  isNewRecord: boolean;
  recordType: string;
  improvement: {
    distanceImprovement: number;
    timeImprovement: number;
    speedImprovement: number;
    isFirstRecord: boolean;
  } | null;
  weeklyStats: any;
  personalBests: any;
}

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
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [trainingAnalysis, setTrainingAnalysis] =
    useState<TrainingAnalysis | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [styleStats, setStyleStats] = useState<StyleStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
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

  // 사용자 통계 가져오기
  const fetchUserStats = async () => {
    const token =
      localStorage.getItem("access_token") || getCookie("access_token");
    if (!token) return;

    try {
      setLoadingStats(true);
      const [statsRes, styleStatsRes] = await Promise.all([
        fetch(API_URLS.RECORDS_STATS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(API_URLS.RECORDS_STYLE_STATS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setUserStats(statsData);
      }

      if (styleStatsRes.ok) {
        const styleData = await styleStatsRes.json();
        setStyleStats(styleData);
      }
    } catch (error) {
      console.error("통계 로딩 실패:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") || getCookie("access_token");
    setIsLoggedIn(!!token);

    if (token) {
      fetchUserStats();
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
    setTrainingAnalysis(null);

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

      const recordData = await recordRes.json();
      setSuccess("기록이 저장되었습니다!");
      setShowRecordForm(false);

      // 훈련 분석 결과 표시
      if (recordData.analysis) {
        setTrainingAnalysis(recordData.analysis);
        setShowAnalysis(true);
      }

      // 통계 새로고침
      await fetchUserStats();

      // 추천 요청
      const recommendRes = await fetch(API_URLS.RECOMMEND, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (recommendRes.ok) {
        const recommendData = await recommendRes.json();
        setRecommend(recommendData);
      }
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

  const formatSpeed = (speed: number) => {
    return `${speed.toFixed(2)} m/min`;
  };

  const getStyleName = (style: string) => {
    const styleNames = {
      freestyle: "자유형",
      backstroke: "배영",
      breaststroke: "평영",
      butterfly: "접영",
    };
    return styleNames[style as keyof typeof styleNames] || style;
  };

  const getGoalName = (goal: string) => {
    const goalNames = {
      endurance: "지구력",
      speed: "스피드",
      technique: "테크닉",
    };
    return goalNames[goal as keyof typeof goalNames] || goal;
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

            {loadingStats ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>통계를 불러오는 중...</p>
              </div>
            ) : (
              <>
                {/* 통계 카드들 */}
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>🏊‍♂️</div>
                    <div className={styles.statContent}>
                      <h3 className={styles.statTitle}>이번 주 거리</h3>
                      <p className={styles.statValue}>
                        {userStats?.weeklyStats
                          ? formatDistance(userStats.weeklyStats.totalDistance)
                          : "0m"}
                      </p>
                      <p className={styles.statSubtitle}>
                        {userStats?.weeklyStats?.sessionCount || 0}회 훈련
                      </p>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>⏱️</div>
                    <div className={styles.statContent}>
                      <h3 className={styles.statTitle}>이번 주 시간</h3>
                      <p className={styles.statValue}>
                        {userStats?.weeklyStats
                          ? formatTime(userStats.weeklyStats.totalTime)
                          : "0분"}
                      </p>
                      <p className={styles.statSubtitle}>
                        평균{" "}
                        {userStats?.weeklyStats
                          ? formatTime(userStats.weeklyStats.averageTime)
                          : "0분"}
                      </p>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statContent}>
                      <h3 className={styles.statTitle}>총 거리</h3>
                      <p className={styles.statValue}>
                        {userStats
                          ? formatDistance(userStats.totalDistance)
                          : "0m"}
                      </p>
                      <p className={styles.statSubtitle}>
                        {userStats?.totalRecords || 0}회 기록
                      </p>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>🎯</div>
                    <div className={styles.statContent}>
                      <h3 className={styles.statTitle}>개인 최고</h3>
                      <p className={styles.statValue}>
                        {userStats?.personalBests
                          ? formatDistance(userStats.personalBests.distance)
                          : "0m"}
                      </p>
                      <p className={styles.statSubtitle}>
                        최고 시간:{" "}
                        {userStats?.personalBests
                          ? formatTime(userStats.personalBests.duration)
                          : "0분"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 영법별 통계 */}
                {styleStats && (
                  <div className={styles.styleStatsSection}>
                    <h3 className={styles.sectionTitle}>영법별 통계</h3>
                    <div className={styles.styleStatsGrid}>
                      {Object.entries(styleStats).map(([style, stats]) => (
                        <div key={style} className={styles.styleStatCard}>
                          <h4 className={styles.styleName}>
                            {getStyleName(style)}
                          </h4>
                          <div className={styles.styleStatContent}>
                            <p className={styles.styleStatValue}>
                              {stats.count}회
                            </p>
                            <p className={styles.styleStatSubtitle}>
                              총 {formatDistance(stats.totalDistance)} /{" "}
                              {formatTime(stats.totalTime)}
                            </p>
                            <p className={styles.styleStatBest}>
                              최고: {formatDistance(stats.bestDistance)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                      <h3 className={styles.recommendationTitle}>
                        오늘의 추천
                      </h3>
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
              </>
            )}

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
                        max={7}
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

            {/* 훈련 분석 결과 모달 */}
            {showAnalysis && trainingAnalysis && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>훈련 분석 결과</h3>
                    <button
                      onClick={() => setShowAnalysis(false)}
                      className={styles.closeButton}
                    >
                      ✕
                    </button>
                  </div>

                  <div className={styles.analysisContent}>
                    {trainingAnalysis.isNewRecord && (
                      <div className={styles.newRecordAlert}>
                        <div className={styles.newRecordIcon}>🏆</div>
                        <div className={styles.newRecordText}>
                          <h4>새로운 기록 달성!</h4>
                          <p>
                            {trainingAnalysis.recordType === "distance"
                              ? "거리"
                              : trainingAnalysis.recordType === "duration"
                              ? "시간"
                              : "속도"}{" "}
                            기록을 갱신했습니다!
                          </p>
                        </div>
                      </div>
                    )}

                    {trainingAnalysis.improvement &&
                      !trainingAnalysis.improvement.isFirstRecord && (
                        <div className={styles.improvementSection}>
                          <h4>이전 훈련 대비 개선도</h4>
                          <div className={styles.improvementGrid}>
                            <div className={styles.improvementItem}>
                              <span className={styles.improvementLabel}>
                                거리
                              </span>
                              <span
                                className={`${styles.improvementValue} ${
                                  trainingAnalysis.improvement
                                    .distanceImprovement > 0
                                    ? styles.positive
                                    : styles.negative
                                }`}
                              >
                                {trainingAnalysis.improvement
                                  .distanceImprovement > 0
                                  ? "+"
                                  : ""}
                                {trainingAnalysis.improvement.distanceImprovement.toFixed(
                                  1
                                )}
                                %
                              </span>
                            </div>
                            <div className={styles.improvementItem}>
                              <span className={styles.improvementLabel}>
                                시간
                              </span>
                              <span
                                className={`${styles.improvementValue} ${
                                  trainingAnalysis.improvement.timeImprovement >
                                  0
                                    ? styles.positive
                                    : styles.negative
                                }`}
                              >
                                {trainingAnalysis.improvement.timeImprovement >
                                0
                                  ? "+"
                                  : ""}
                                {trainingAnalysis.improvement.timeImprovement.toFixed(
                                  1
                                )}
                                %
                              </span>
                            </div>
                            <div className={styles.improvementItem}>
                              <span className={styles.improvementLabel}>
                                속도
                              </span>
                              <span
                                className={`${styles.improvementValue} ${
                                  trainingAnalysis.improvement
                                    .speedImprovement > 0
                                    ? styles.positive
                                    : styles.negative
                                }`}
                              >
                                {trainingAnalysis.improvement.speedImprovement >
                                0
                                  ? "+"
                                  : ""}
                                {trainingAnalysis.improvement.speedImprovement.toFixed(
                                  1
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    {trainingAnalysis.improvement?.isFirstRecord && (
                      <div className={styles.firstRecordMessage}>
                        <h4>첫 번째 훈련 기록!</h4>
                        <p>수영 여정의 시작을 축하합니다! 🎉</p>
                      </div>
                    )}

                    <div className={styles.modalActions}>
                      <button
                        onClick={() => setShowAnalysis(false)}
                        className={styles.submitButton}
                      >
                        확인
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
