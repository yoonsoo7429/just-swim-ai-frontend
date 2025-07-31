"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.scss";
import { useAuth } from "../hooks/useAuth";
import { useForm } from "../hooks/useForm";
import { recordsApi, recommendApi, achievementsApi } from "../utils/api";
import SmartRecommendation from "../components/recommend/SmartRecommendation";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";

import {
  UserStats,
  StyleStats,
  Achievement,
  AchievementStats,
  TrainingAnalysis,
  CreateRecordRequest,
  CreateDetailedRecordRequest,
  SwimSegment,
  DetailedAnalysis,
} from "../types";
import {
  formatTime,
  formatDistance,
  formatSpeed,
  getStyleName,
  getGoalName,
  getLevelColor,
  getLevelName,
} from "../utils/formatters";

// 안전한 숫자 처리를 위한 유틸리티 함수
const safeToFixed = (value: any, decimals: number = 1): string => {
  if (typeof value === "number" && !isNaN(value)) {
    return value.toFixed(decimals);
  }
  if (typeof value === "string") {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num.toFixed(decimals);
    }
  }
  return "0.0";
};

type TabType = "summary" | "stats" | "recommend";

export default function Home() {
  const { isSignedIn, isLoading, error: authError } = useAuth();
  const {
    form,
    formState,
    handleChange,
    setLoading,
    setError,
    setSuccess,
    resetForm,
  } = useForm<CreateRecordRequest>({
    date: "",
    distance: 0,
    style: "freestyle",
    duration: 0,
    frequency_per_week: 1,
    goal: "endurance",
  });

  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [recommend, setRecommend] = useState<any>(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showDetailedRecordForm, setShowDetailedRecordForm] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [trainingAnalysis, setTrainingAnalysis] =
    useState<TrainingAnalysis | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [styleStats, setStyleStats] = useState<StyleStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementStats, setAchievementStats] =
    useState<AchievementStats | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [showNewAchievements, setShowNewAchievements] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [detailedRecords, setDetailedRecords] = useState<any[]>([]);
  const [detailedAnalysis, setDetailedAnalysis] =
    useState<DetailedAnalysis | null>(null);
  const router = useRouter();

  // 상세 기록 분석 함수들
  const calculateAverageHeartRate = () => {
    if (detailedRecords.length === 0) return 0;
    const recordsWithHeartRate = detailedRecords.filter(
      (record) => record.averageHeartRate
    );
    if (recordsWithHeartRate.length === 0) return 0;
    const total = recordsWithHeartRate.reduce(
      (sum, record) => sum + record.averageHeartRate,
      0
    );
    return Math.round(total / recordsWithHeartRate.length);
  };

  const calculateAveragePoolLength = () => {
    if (detailedRecords.length === 0) return 0;
    const recordsWithPoolLength = detailedRecords.filter(
      (record) => record.poolLength
    );
    if (recordsWithPoolLength.length === 0) return 0;
    const total = recordsWithPoolLength.reduce(
      (sum, record) => sum + record.poolLength,
      0
    );
    return Math.round(total / recordsWithPoolLength.length);
  };

  const calculateAverageSessionDuration = () => {
    if (detailedRecords.length === 0) return 0;
    const total = detailedRecords.reduce(
      (sum, record) => sum + record.duration,
      0
    );
    return Math.round(total / detailedRecords.length);
  };

  const calculateComplexTrainingRatio = () => {
    if (detailedRecords.length === 0) return 0;
    const complexRecords = detailedRecords.filter(
      (record) => record.segments && record.segments.length > 1
    );
    return Math.round((complexRecords.length / detailedRecords.length) * 100);
  };

  const getDetailedStyleStats = () => {
    const styleCounts: { [key: string]: number } = {};
    detailedRecords.forEach((record) => {
      if (record.segments) {
        record.segments.forEach((segment: any) => {
          styleCounts[segment.style] = (styleCounts[segment.style] || 0) + 1;
        });
      }
    });
    return styleCounts;
  };

  // 상세 기록 입력 폼 상태
  const [detailedForm, setDetailedForm] = useState<CreateDetailedRecordRequest>(
    {
      date: "",
      startTime: "",
      endTime: "",
      poolLength: 25,
      averageHeartRate: 0,
      frequencyPerWeek: 1,
      goal: "endurance",
      location: "",
      notes: "",
      segments: [
        {
          style: "freestyle",
          distance: 0,
          duration: 0,
          pace: 0,
          heartRate: 0,
          laps: 0,
          notes: "",
        },
      ],
    }
  );

  const addSegment = () => {
    setDetailedForm((prev) => ({
      ...prev,
      segments: [
        ...prev.segments,
        {
          style: "freestyle",
          distance: 0,
          duration: 0,
          pace: 0,
          heartRate: 0,
          laps: 0,
          notes: "",
        },
      ],
    }));
  };

  const updateSegment = (
    index: number,
    field: keyof SwimSegment,
    value: any
  ) => {
    setDetailedForm((prev) => ({
      ...prev,
      segments: prev.segments.map((segment, i) =>
        i === index ? { ...segment, [field]: value } : segment
      ),
    }));
  };

  const removeSegment = (index: number) => {
    setDetailedForm((prev) => ({
      ...prev,
      segments: prev.segments.filter((_, i) => i !== index),
    }));
  };

  // 상세 기록 제출 처리
  const handleDetailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await recordsApi.create(detailedForm);
      setSuccess("상세 기록이 성공적으로 저장되었습니다!");
      setShowDetailedRecordForm(false);
      fetchUserStats();
      fetchRecommendation();

      // 새로운 업적 확인
      if (response.newAchievements && response.newAchievements.length > 0) {
        setNewAchievements(response.newAchievements);
        setShowNewAchievements(true);
      }
    } catch (error: any) {
      setError(error.message || "상세 기록 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 상세 기록 폼 입력 처리
  const handleDetailedFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setDetailedForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 사용자 통계 데이터 가져오기
  const fetchUserStats = async () => {
    try {
      setLoadingStats(true);
      const [statsResponse, styleResponse, achievementsResponse] =
        await Promise.all([
          recordsApi.getStats().catch(() => null),
          recordsApi.getStyleStats().catch(() => null),
          achievementsApi.getStats().catch(() => null),
        ]);

      setUserStats(statsResponse);
      setStyleStats(styleResponse);
      setAchievements(achievementsResponse?.achievements || []);
      setAchievementStats(achievementsResponse?.stats || null);

      // 상세 기록 가져오기
      const detailedResponse = await recordsApi.getAll().catch(() => []);
      setDetailedRecords(detailedResponse);

      // 상세 분석 가져오기
      const analysisResponse = await recordsApi.getAnalysis().catch(() => null);
      setDetailedAnalysis(analysisResponse);
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // AI 추천 가져오기
  const fetchRecommendation = async () => {
    try {
      const response = await recommendApi.getStats().catch(() => null);
      setRecommend(response);
    } catch (error) {
      console.error("Failed to fetch recommendation:", error);
    }
  };

  // 기록 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await recordsApi.create(form);
      setSuccess("기록이 성공적으로 저장되었습니다!");
      resetForm();
      fetchUserStats();
      fetchRecommendation();

      // 새로운 업적 확인
      if (response.newAchievements && response.newAchievements.length > 0) {
        setNewAchievements(response.newAchievements);
        setShowNewAchievements(true);
      }
    } catch (error: any) {
      setError(error.message || "기록 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    if (isSignedIn) {
      fetchUserStats();
      fetchRecommendation();
    }
  }, [isSignedIn]);

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner size="large" text="인증 상태를 확인하는 중..." />
      </div>
    );
  }

  // 인증 에러가 있는 경우
  if (authError) {
    return (
      <div className={styles.container}>
        <ErrorMessage
          message={authError}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // 요약 탭 컴포넌트
  const SummaryTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.summaryHeader}>
        <h3 className={styles.summaryTitle}>최근 7일 요약</h3>
        <button
          onClick={() => setShowRecordForm(true)}
          className={styles.quickAddButton}
        >
          + 기록 추가
        </button>
      </div>

      <div className={styles.summaryStats}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>🏊‍♂️</div>
          <div className={styles.summaryContent}>
            <h4>최근 7일 거리</h4>
            <p className={styles.summaryValue}>
              {userStats?.weeklyStats?.totalDistance
                ? formatDistance(userStats.weeklyStats.totalDistance)
                : "0m"}
            </p>
            <p className={styles.summarySubtitle}>
              {userStats?.weeklyStats?.sessionCount || 0}회 훈련
            </p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>⏱️</div>
          <div className={styles.summaryContent}>
            <h4>최근 7일 시간</h4>
            <p className={styles.summaryValue}>
              {userStats?.weeklyStats?.totalTime
                ? formatTime(userStats.weeklyStats.totalTime)
                : "0분"}
            </p>
            <p className={styles.summarySubtitle}>
              평균{" "}
              {userStats?.weeklyStats?.averageTime
                ? formatTime(userStats.weeklyStats.averageTime)
                : "0분"}
            </p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>🎯</div>
          <div className={styles.summaryContent}>
            <h4>개인 최고</h4>
            <p className={styles.summaryValue}>
              {userStats?.personalBests?.distance
                ? formatDistance(userStats.personalBests.distance)
                : "0m"}
            </p>
            <p className={styles.summarySubtitle}>
              최고 시간:{" "}
              {userStats?.personalBests?.duration
                ? formatTime(userStats.personalBests.duration)
                : "0분"}
            </p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📊</div>
          <div className={styles.summaryContent}>
            <h4>총 거리</h4>
            <p className={styles.summaryValue}>
              {userStats?.totalDistance
                ? formatDistance(userStats.totalDistance)
                : "0m"}
            </p>
            <p className={styles.summarySubtitle}>
              {userStats?.totalRecords || 0}회 기록
            </p>
          </div>
        </div>

        {/* 상세 기록 통계 */}
        {detailedRecords.length > 0 && (
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>💓</div>
            <div className={styles.summaryContent}>
              <h4>평균 심박수</h4>
              <p className={styles.summaryValue}>
                {calculateAverageHeartRate()} BPM
              </p>
              <p className={styles.summarySubtitle}>
                {detailedRecords.length}회 상세 기록
              </p>
            </div>
          </div>
        )}

        {detailedRecords.length > 0 && (
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>🏊‍♀️</div>
            <div className={styles.summaryContent}>
              <h4>복합 훈련</h4>
              <p className={styles.summaryValue}>
                {calculateComplexTrainingRatio()}%
              </p>
              <p className={styles.summarySubtitle}>복합 영법 훈련 비율</p>
            </div>
          </div>
        )}

        {/* 웨어러블 연결 상태 */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>⌚</div>
          <div className={styles.summaryContent}>
            <h4>웨어러블 연동</h4>
            <p className={styles.summaryValue}>
              <a href="/mypage" className={styles.wearableLink}>
                설정하기
              </a>
            </p>
            <p className={styles.summarySubtitle}>
              자동 데이터 수집으로 편리하게
            </p>
          </div>
        </div>
      </div>

      {recommend && (
        <div className={styles.quickRecommendation}>
          <h3 className={styles.quickRecommendationTitle}>오늘의 추천</h3>
          <div className={styles.quickRecommendationContent}>
            <div className={styles.quickRecommendationItem}>
              <span className={styles.quickRecommendationLabel}>
                수영 훈련:
              </span>
              <span className={styles.quickRecommendationText}>
                {recommend.swim_training}
              </span>
            </div>
            <div className={styles.quickRecommendationItem}>
              <span className={styles.quickRecommendationLabel}>
                지상 운동:
              </span>
              <span className={styles.quickRecommendationText}>
                {recommend.dryland_training}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 상세 통계 탭 컴포넌트
  const StatsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.statsHeader}>
        <div className={styles.statsTitleContainer}>
          <h3 className={styles.statsTitle}>상세 통계</h3>
          <p className={styles.statsSubtitle}>
            수영 기록을 분석하여 개선점을 찾아보세요
          </p>
        </div>
        <button
          onClick={() => setShowDetailedRecordForm(true)}
          className={styles.quickAddButton}
        >
          + 상세 기록 입력
        </button>
      </div>

      {loadingStats ? (
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="medium" text="통계를 불러오는 중..." />
        </div>
      ) : (
        <div className={styles.statsGrid}>
          {userStats && (
            <div className={styles.statCard}>
              <h4 className={styles.statCardTitle}>전체 통계</h4>
              <div className={styles.statCardContent}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>총 거리</span>
                  <span className={styles.statValue}>
                    {formatDistance(userStats.totalDistance)}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>총 시간</span>
                  <span className={styles.statValue}>
                    {formatTime(userStats.totalTime)}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>총 횟수</span>
                  <span className={styles.statValue}>
                    {userStats.totalRecords}회
                  </span>
                </div>
              </div>
            </div>
          )}

          {styleStats && (
            <div className={styles.statCard}>
              <h4 className={styles.statCardTitle}>영법별 통계</h4>
              <div className={styles.statCardContent}>
                {Object.entries(styleStats).map(([style, stats]) => (
                  <div key={style} className={styles.statItem}>
                    <span className={styles.statLabel}>
                      {getStyleName(style)}
                    </span>
                    <span className={styles.statValue}>
                      {formatDistance(stats.totalDistance)} ({stats.count}회)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {achievementStats && (
            <div className={styles.statCard}>
              <h4 className={styles.statCardTitle}>업적 현황</h4>
              <div className={styles.statCardContent}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>달성한 업적</span>
                  <span className={styles.statValue}>
                    {achievementStats.completedCount || 0}개
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>전체 업적</span>
                  <span className={styles.statValue}>
                    {achievementStats.totalCount || 0}개
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>달성률</span>
                  <span className={styles.statValue}>
                    {achievementStats.totalCount
                      ? Math.round(
                          ((achievementStats.completedCount || 0) /
                            achievementStats.totalCount) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      <nav className={styles.navigation}>
        <div className={styles.navContent}>
          <h1 className={styles.logo}>Just Swim AI</h1>
          <div className={styles.navLinks}>
            {isSignedIn ? (
              <>
                <button
                  onClick={() => setShowAchievements(true)}
                  className={styles.navLink}
                >
                  업적 🏆
                </button>
                <a href="/goals" className={styles.navLink}>
                  목표 🎯
                </a>
                <a href="/charts" className={styles.navLink}>
                  차트 📊
                </a>
                <a href="/mypage" className={styles.navLink}>
                  마이페이지 👤
                </a>
              </>
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
        {!isSignedIn ? (
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
                수영 기록을 관리하고 맞춤형 추천을 받아보세요
              </p>
            </div>

            {loadingStats ? (
              <div className={styles.loadingContainer}>
                <LoadingSpinner size="medium" text="통계를 불러오는 중..." />
              </div>
            ) : (
              <>
                {/* 탭 네비게이션 */}
                <div className={styles.tabNavigation}>
                  <button
                    className={`${styles.tabButton} ${
                      activeTab === "summary" ? styles.active : ""
                    }`}
                    onClick={() => setActiveTab("summary")}
                  >
                    📊 요약
                  </button>
                  <button
                    className={`${styles.tabButton} ${
                      activeTab === "stats" ? styles.active : ""
                    }`}
                    onClick={() => setActiveTab("stats")}
                  >
                    📈 상세 통계
                  </button>
                  <button
                    className={`${styles.tabButton} ${
                      activeTab === "recommend" ? styles.active : ""
                    }`}
                    onClick={() => setActiveTab("recommend")}
                  >
                    🤖 AI 추천
                  </button>
                </div>

                {/* 탭 컨텐츠 */}
                {activeTab === "summary" && <SummaryTab />}
                {activeTab === "stats" && <StatsTab />}
                {activeTab === "recommend" && <SmartRecommendation />}
              </>
            )}

            {/* 기록 입력 모달 */}
            {showRecordForm && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>📝 수영 기록 입력</h3>
                    <button
                      onClick={() => setShowRecordForm(false)}
                      className={styles.closeButton}
                    >
                      ✕
                    </button>
                  </div>
                  <div className={styles.modalBody}>
                    <form onSubmit={handleSubmit} className={styles.recordForm}>
                      <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>날짜</label>
                          <input
                            type="date"
                            value={form.date}
                            onChange={handleChange}
                            name="date"
                            required
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>거리 (m)</label>
                          <input
                            type="number"
                            value={form.distance}
                            onChange={handleChange}
                            name="distance"
                            min="0"
                            required
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>영법</label>
                          <select
                            value={form.style}
                            onChange={handleChange}
                            name="style"
                            className={styles.select}
                          >
                            <option value="freestyle">자유형</option>
                            <option value="backstroke">배영</option>
                            <option value="breaststroke">평영</option>
                            <option value="butterfly">접영</option>
                          </select>
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>시간 (분)</label>
                          <input
                            type="number"
                            value={form.duration}
                            onChange={handleChange}
                            name="duration"
                            min="0"
                            required
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>주간 빈도</label>
                          <select
                            value={form.frequency_per_week}
                            onChange={handleChange}
                            name="frequency_per_week"
                            className={styles.select}
                          >
                            <option value={1}>1회</option>
                            <option value={2}>2회</option>
                            <option value={3}>3회</option>
                            <option value={4}>4회</option>
                            <option value={5}>5회</option>
                            <option value={6}>6회</option>
                            <option value={7}>7회</option>
                          </select>
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>목표</label>
                          <select
                            value={form.goal}
                            onChange={handleChange}
                            name="goal"
                            className={styles.select}
                          >
                            <option value="endurance">지구력</option>
                            <option value="speed">속도</option>
                            <option value="technique">기술</option>
                          </select>
                        </div>
                      </div>
                      <div className={styles.formActions}>
                        <button
                          type="button"
                          onClick={() => setShowRecordForm(false)}
                          className={styles.cancelButton}
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={formState.loading}
                          className={styles.submitButton}
                        >
                          {formState.loading ? "저장 중..." : "기록 저장"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* 상세 기록 입력 모달 */}
            {showDetailedRecordForm && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                      📝 상세 수영 기록 입력
                    </h3>
                    <button
                      onClick={() => setShowDetailedRecordForm(false)}
                      className={styles.closeButton}
                    >
                      ✕
                    </button>
                  </div>
                  <div className={styles.modalBody}>
                    <form
                      onSubmit={handleDetailedSubmit}
                      className={styles.recordForm}
                    >
                      <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>날짜</label>
                          <input
                            type="date"
                            value={detailedForm.date}
                            onChange={handleDetailedFormChange}
                            name="date"
                            required
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>시작 시간</label>
                          <input
                            type="time"
                            value={detailedForm.startTime}
                            onChange={handleDetailedFormChange}
                            name="startTime"
                            required
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>종료 시간</label>
                          <input
                            type="time"
                            value={detailedForm.endTime}
                            onChange={handleDetailedFormChange}
                            name="endTime"
                            required
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>
                            수영장 길이 (m)
                          </label>
                          <input
                            type="number"
                            value={detailedForm.poolLength}
                            onChange={handleDetailedFormChange}
                            name="poolLength"
                            min="0"
                            required
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>
                            평균 심박수 (BPM)
                          </label>
                          <input
                            type="number"
                            value={detailedForm.averageHeartRate}
                            onChange={handleDetailedFormChange}
                            name="averageHeartRate"
                            min="0"
                            required
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>주간 빈도</label>
                          <select
                            value={detailedForm.frequencyPerWeek}
                            onChange={handleDetailedFormChange}
                            name="frequencyPerWeek"
                            className={styles.select}
                          >
                            <option value={1}>1회</option>
                            <option value={2}>2회</option>
                            <option value={3}>3회</option>
                            <option value={4}>4회</option>
                            <option value={5}>5회</option>
                            <option value={6}>6회</option>
                            <option value={7}>7회</option>
                          </select>
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>목표</label>
                          <select
                            value={detailedForm.goal}
                            onChange={handleDetailedFormChange}
                            name="goal"
                            className={styles.select}
                          >
                            <option value="endurance">지구력</option>
                            <option value="speed">속도</option>
                            <option value="technique">기술</option>
                          </select>
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>위치</label>
                          <input
                            type="text"
                            value={detailedForm.location}
                            onChange={handleDetailedFormChange}
                            name="location"
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>비고</label>
                          <textarea
                            value={detailedForm.notes}
                            onChange={handleDetailedFormChange}
                            name="notes"
                            className={styles.textarea}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>세그먼트</label>
                          <button
                            type="button"
                            onClick={addSegment}
                            className={styles.addSegmentButton}
                          >
                            ➕ 세그먼트 추가
                          </button>
                          {detailedForm.segments.map((segment, index) => (
                            <div key={index} className={styles.segmentItem}>
                              <div className={styles.segmentHeader}>
                                <span>세그먼트 {index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => removeSegment(index)}
                                  className={styles.removeSegmentButton}
                                >
                                  ✖️
                                </button>
                              </div>
                              <div className={styles.segmentForm}>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>영법</label>
                                  <select
                                    value={segment.style}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "style",
                                        e.target.value
                                      )
                                    }
                                    className={styles.select}
                                  >
                                    <option value="freestyle">자유형</option>
                                    <option value="backstroke">배영</option>
                                    <option value="breaststroke">평영</option>
                                    <option value="butterfly">접영</option>
                                  </select>
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>
                                    거리 (m)
                                  </label>
                                  <input
                                    type="number"
                                    value={segment.distance}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "distance",
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    className={styles.input}
                                  />
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>
                                    시간 (분)
                                  </label>
                                  <input
                                    type="number"
                                    value={segment.duration}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "duration",
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    className={styles.input}
                                  />
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>
                                    페이스 (m/s)
                                  </label>
                                  <input
                                    type="number"
                                    value={segment.pace}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "pace",
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    className={styles.input}
                                  />
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>
                                    심박수 (BPM)
                                  </label>
                                  <input
                                    type="number"
                                    value={segment.heartRate}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "heartRate",
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    className={styles.input}
                                  />
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>
                                    레인 (개)
                                  </label>
                                  <input
                                    type="number"
                                    value={segment.laps}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "laps",
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    className={styles.input}
                                  />
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>비고</label>
                                  <input
                                    type="text"
                                    value={segment.notes}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "notes",
                                        e.target.value
                                      )
                                    }
                                    className={styles.input}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={styles.formActions}>
                        <button
                          type="button"
                          onClick={() => setShowDetailedRecordForm(false)}
                          className={styles.cancelButton}
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={formState.loading}
                          className={styles.submitButton}
                        >
                          {formState.loading ? "저장 중..." : "상세 기록 저장"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* 성취 모달 */}
            {showAchievements && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>🏆 성취 현황</h3>
                    <button
                      onClick={() => setShowAchievements(false)}
                      className={styles.closeButton}
                    >
                      ✕
                    </button>
                  </div>
                  <div className={styles.achievementsContent}>
                    <div className={styles.achievementsGrid}>
                      {achievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={styles.achievementCard}
                        >
                          <div className={styles.achievementIcon}>
                            {achievement.icon}
                          </div>
                          <div className={styles.achievementContent}>
                            <h4 className={styles.achievementTitle}>
                              {achievement.title}
                            </h4>
                            <p className={styles.achievementDescription}>
                              {achievement.description}
                            </p>
                            <div className={styles.achievementProgress}>
                              <div className={styles.progressBar}>
                                <div
                                  className={styles.progressFill}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (achievement.progress /
                                        achievement.target) *
                                        100
                                    )}%`,
                                    backgroundColor: getLevelColor(
                                      achievement.level
                                    ),
                                  }}
                                ></div>
                              </div>
                              <span className={styles.progressText}>
                                {achievement.progress}/{achievement.target}
                              </span>
                            </div>
                            <div className={styles.achievementLevel}>
                              <span
                                className={styles.levelBadge}
                                style={{
                                  backgroundColor: getLevelColor(
                                    achievement.level
                                  ),
                                }}
                              >
                                {getLevelName(achievement.level)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 새로운 성취 알림 모달 */}
            {showNewAchievements && newAchievements.length > 0 && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>🎉 새로운 성취 달성!</h3>
                    <button
                      onClick={() => setShowNewAchievements(false)}
                      className={styles.closeButton}
                    >
                      ✕
                    </button>
                  </div>

                  <div className={styles.newAchievementsContent}>
                    {newAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={styles.newAchievementCard}
                      >
                        <div className={styles.newAchievementIcon}>
                          {achievement.icon}
                        </div>
                        <div className={styles.newAchievementContent}>
                          <h4 className={styles.newAchievementTitle}>
                            {achievement.title}
                          </h4>
                          <p className={styles.newAchievementDescription}>
                            {achievement.description}
                          </p>
                          <div className={styles.newAchievementLevel}>
                            <span
                              className={styles.levelBadge}
                              style={{
                                backgroundColor: getLevelColor(
                                  achievement.level
                                ),
                              }}
                            >
                              {getLevelName(achievement.level)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className={styles.modalActions}>
                      <button
                        onClick={() => setShowNewAchievements(false)}
                        className={styles.submitButton}
                      >
                        축하합니다! 🎉
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
