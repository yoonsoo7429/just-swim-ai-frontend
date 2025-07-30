"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URLS } from "@/config/api";
import styles from "./page.module.scss";
import { useAuth } from "../hooks/useAuth";
import { useForm } from "../hooks/useForm";
import { recordsApi, recommendApi, achievementsApi } from "../utils/api";
import SmartRecommendation from "../components/recommend/SmartRecommendation";
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

type TabType = "summary" | "stats" | "actions" | "recommend";

export default function Home() {
  const { isSignedIn, handleSignOut } = useAuth();
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
    const total = detailedRecords.reduce(
      (sum, record) => sum + record.poolLength,
      0
    );
    return Math.round(total / detailedRecords.length);
  };

  const calculateAverageSessionDuration = () => {
    if (detailedRecords.length === 0) return 0;
    const total = detailedRecords.reduce(
      (sum, record) => sum + record.totalDuration,
      0
    );
    return Math.round(total / detailedRecords.length);
  };

  const calculateComplexTrainingRatio = () => {
    if (detailedRecords.length === 0) return 0;
    const complexSessions = detailedRecords.filter(
      (record) => record.segments.length > 1
    );
    return Math.round((complexSessions.length / detailedRecords.length) * 100);
  };

  const getDetailedStyleStats = () => {
    const styleMap = new Map<
      string,
      {
        style: string;
        totalDistance: number;
        segments: number;
        totalDuration: number;
        totalHeartRate: number;
        heartRateCount: number;
      }
    >();

    detailedRecords.forEach((record) => {
      record.segments.forEach((segment: any) => {
        const existing = styleMap.get(segment.style) || {
          style: segment.style,
          totalDistance: 0,
          segments: 0,
          totalDuration: 0,
          totalHeartRate: 0,
          heartRateCount: 0,
        };

        existing.totalDistance += segment.distance;
        existing.segments += 1;
        existing.totalDuration += segment.duration;
        if (segment.heartRate) {
          existing.totalHeartRate += segment.heartRate;
          existing.heartRateCount += 1;
        }

        styleMap.set(segment.style, existing);
      });
    });

    return Array.from(styleMap.values()).map((stat) => ({
      ...stat,
      averagePace: stat.totalDuration / (stat.totalDistance / 100),
      averageHeartRate:
        stat.heartRateCount > 0
          ? Math.round(stat.totalHeartRate / stat.heartRateCount)
          : undefined,
    }));
  };

  // 새로운 상세 기록 폼 상태
  const [detailedForm, setDetailedForm] = useState<CreateDetailedRecordRequest>(
    {
      date: "",
      startTime: "",
      endTime: "",
      poolLength: 25,
      averageHeartRate: undefined,
      segments: [],
      frequencyPerWeek: 1,
      goal: "endurance",
      location: "",
      notes: "",
    }
  );

  // 세그먼트 추가 함수
  const addSegment = () => {
    const newSegment: SwimSegment = {
      style: "freestyle",
      distance: 0,
      duration: 0,
      pace: 0,
      heartRate: undefined,
      laps: 0,
      notes: "",
    };
    setDetailedForm((prev) => ({
      ...prev,
      segments: [...prev.segments, newSegment],
    }));
  };

  // 세그먼트 업데이트 함수
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

  // 세그먼트 삭제 함수
  const removeSegment = (index: number) => {
    setDetailedForm((prev) => ({
      ...prev,
      segments: prev.segments.filter((_, i) => i !== index),
    }));
  };

  // 총 거리 계산
  const totalDistance = detailedForm.segments.reduce(
    (sum, segment) => sum + segment.distance,
    0
  );

  // 총 시간 계산 (분 단위)
  const totalDuration = detailedForm.segments.reduce(
    (sum, segment) => sum + segment.duration,
    0
  );

  // 평균 페이스 계산 (100m당 분 단위)
  const averagePace =
    totalDistance > 0 ? (totalDuration / totalDistance) * 100 : 0;

  // 총 랩 수 계산
  const totalLaps = detailedForm.segments.reduce(
    (sum, segment) => sum + segment.laps,
    0
  );

  // 사용자 통계 가져오기
  const fetchUserStats = async () => {
    try {
      setLoadingStats(true);
      const [
        statsData,
        styleData,
        achievementsData,
        achievementStatsData,
        recordsData,
        analysisData,
      ] = await Promise.all([
        recordsApi.getStats(),
        recordsApi.getStyleStats(),
        achievementsApi.getAll(),
        achievementsApi.getStats(),
        recordsApi.getAll(),
        recordsApi.getAnalysis(),
      ]);

      setUserStats(statsData);
      setStyleStats(styleData);
      setAchievements(achievementsData);
      setAchievementStats(achievementStatsData);
      setDetailedRecords(recordsData);
      setDetailedAnalysis(analysisData);
    } catch (error) {
      console.error("통계 로딩 실패:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchUserStats();
    }
  }, [isSignedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setRecommend(null);
    setTrainingAnalysis(null);
    setNewAchievements([]);

    try {
      // 상세 기록 데이터 준비 - 백엔드 DTO에 맞게 변환
      const recordData = {
        date: detailedForm.date,
        startTime: detailedForm.startTime,
        endTime: detailedForm.endTime,
        poolLength: detailedForm.poolLength,
        averageHeartRate: detailedForm.averageHeartRate,
        segments: detailedForm.segments,
        frequency_per_week: detailedForm.frequencyPerWeek, // snake_case로 변환
        goal: detailedForm.goal,
        location: detailedForm.location,
        notes: detailedForm.notes,
        // 세그먼트가 있으면 기본 필드들은 제외 (백엔드에서 세그먼트로 계산)
      };

      // 통합된 기록 API 사용
      const savedRecord = await recordsApi.create(recordData);
      setSuccess("기록이 저장되었습니다!");
      setShowRecordForm(false);

      // 훈련 분석 결과 표시
      if (savedRecord.analysis) {
        setTrainingAnalysis(savedRecord.analysis);
        setShowAnalysis(true);
      }

      // 새로운 성취 확인
      if (
        savedRecord.newAchievements &&
        savedRecord.newAchievements.length > 0
      ) {
        setNewAchievements(savedRecord.newAchievements);
        setShowNewAchievements(true);
      }

      // 통계 새로고침
      await fetchUserStats();

      // 추천 요청
      const recommendData = await recommendApi.create(form);
      setRecommend(recommendData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        <h3 className={styles.statsTitle}>상세 통계</h3>
        <p className={styles.statsSubtitle}>
          수영 기록을 분석하여 개선점을 찾아보세요
        </p>
      </div>

      {loadingStats ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>통계를 불러오는 중...</p>
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

          {/* AI 상세 분석 */}
          {detailedAnalysis && (
            <div className={styles.statCard}>
              <h4 className={styles.statCardTitle}>🤖 AI 상세 분석</h4>
              <div className={styles.statCardContent}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>전체 개선도</span>
                  <span className={styles.statValue}>
                    {detailedAnalysis.overallImprovement > 0 ? "+" : ""}
                    {safeToFixed(detailedAnalysis.overallImprovement, 1)}%
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>복합 훈련 비율</span>
                  <span className={styles.statValue}>
                    {safeToFixed(detailedAnalysis.complexTrainingRatio, 1)}%
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>평균 세션 시간</span>
                  <span className={styles.statValue}>
                    {formatTime(detailedAnalysis.averageSessionDuration)}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>훈련 강도 트렌드</span>
                  <span className={styles.statValue}>
                    {detailedAnalysis.intensityAnalysis.intensityTrend ===
                    "increasing"
                      ? "📈 증가"
                      : detailedAnalysis.intensityAnalysis.intensityTrend ===
                        "decreasing"
                      ? "📉 감소"
                      : "➡️ 안정"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 훈련 강도 분석 */}
          {detailedAnalysis && (
            <div className={styles.statCard}>
              <h4 className={styles.statCardTitle}>💓 훈련 강도 분석</h4>
              <div className={styles.statCardContent}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>
                    저강도 (130 BPM 미만)
                  </span>
                  <span className={styles.statValue}>
                    {safeToFixed(
                      detailedAnalysis.intensityAnalysis.lowIntensity,
                      1
                    )}
                    %
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>중강도 (130-160 BPM)</span>
                  <span className={styles.statValue}>
                    {safeToFixed(
                      detailedAnalysis.intensityAnalysis.mediumIntensity,
                      1
                    )}
                    %
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>
                    고강도 (160 BPM 이상)
                  </span>
                  <span className={styles.statValue}>
                    {safeToFixed(
                      detailedAnalysis.intensityAnalysis.highIntensity,
                      1
                    )}
                    %
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>평균 심박수</span>
                  <span className={styles.statValue}>
                    {safeToFixed(
                      detailedAnalysis.intensityAnalysis.averageHeartRate,
                      0
                    )}{" "}
                    BPM
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
                  <div key={style} className={styles.styleStatItem}>
                    <div className={styles.styleStatHeader}>
                      <span className={styles.styleName}>
                        {getStyleName(style)}
                      </span>
                      <span className={styles.styleDistance}>
                        {formatDistance(stats.totalDistance)}
                      </span>
                    </div>
                    <div className={styles.styleStatDetails}>
                      <span className={styles.styleStatDetail}>
                        {stats.count}회
                      </span>
                      <span className={styles.styleStatDetail}>
                        {formatTime(stats.totalTime)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI 영법별 분석 */}
          {detailedAnalysis && detailedAnalysis.styleAnalysis.length > 0 && (
            <div className={styles.statCard}>
              <h4 className={styles.statCardTitle}>🏊‍♀️ AI 영법별 분석</h4>
              <div className={styles.statCardContent}>
                {detailedAnalysis.styleAnalysis.map((styleAnalysis) => (
                  <div
                    key={styleAnalysis.style}
                    className={styles.styleStatItem}
                  >
                    <div className={styles.styleStatHeader}>
                      <span className={styles.styleName}>
                        {getStyleName(styleAnalysis.style)}
                      </span>
                      <span className={styles.styleDistance}>
                        {formatDistance(styleAnalysis.totalDistance)}
                      </span>
                    </div>
                    <div className={styles.styleStatDetails}>
                      <span className={styles.styleStatDetail}>
                        {styleAnalysis.totalSessions}회
                      </span>
                      <span className={styles.styleStatDetail}>
                        {formatTime(styleAnalysis.averagePace)}/100m
                      </span>
                      {styleAnalysis.averageHeartRate && (
                        <span className={styles.styleStatDetail}>
                          {safeToFixed(styleAnalysis.averageHeartRate, 0)} BPM
                        </span>
                      )}
                    </div>
                    {/* 개선도 표시 */}
                    {(styleAnalysis.improvement.pace > 0 ||
                      styleAnalysis.improvement.distance > 0) && (
                      <div className={styles.improvementIndicator}>
                        <span className={styles.improvementText}>
                          📈 페이스{" "}
                          {styleAnalysis.improvement.pace > 0 ? "+" : ""}
                          {safeToFixed(styleAnalysis.improvement.pace, 1)}% |
                          거리{" "}
                          {styleAnalysis.improvement.distance > 0 ? "+" : ""}
                          {safeToFixed(styleAnalysis.improvement.distance, 1)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {achievementStats && (
            <div className={styles.statCard}>
              <h4 className={styles.statCardTitle}>성취 현황</h4>
              <div className={styles.statCardContent}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>달성한 성취</span>
                  <span className={styles.statValue}>
                    {achievementStats.unlockedAchievements}개
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>전체 성취</span>
                  <span className={styles.statValue}>
                    {achievementStats.totalAchievements}개
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>달성률</span>
                  <span className={styles.statValue}>
                    {Math.round(achievementStats.completionRate)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // 액션 탭 컴포넌트
  const ActionsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.actionsHeader}>
        <h3 className={styles.actionsTitle}>기록 관리</h3>
        <p className={styles.actionsSubtitle}>
          새로운 기록을 입력하고 맞춤형 추천을 받아보세요
        </p>
      </div>

      <div className={styles.actionsGrid}>
        <div className={styles.actionCard}>
          <h4 className={styles.actionCardTitle}>새로운 기록 추가</h4>
          <p className={styles.actionCardDescription}>
            오늘의 수영 기록을 입력하고 맞춤형 추천을 받아보세요
          </p>
          <button
            onClick={() => setShowRecordForm(true)}
            className={styles.actionButton}
          >
            기록 입력하기
          </button>
        </div>

        <div className={styles.actionCard}>
          <h4 className={styles.actionCardTitle}>성취 확인</h4>
          <p className={styles.actionCardDescription}>
            달성한 성취와 진행 상황을 확인해보세요
          </p>
          <button
            onClick={() => setShowAchievements(true)}
            className={styles.actionButton}
          >
            성취 보기
          </button>
        </div>

        <div className={styles.actionCard}>
          <h4 className={styles.actionCardTitle}>목표 설정</h4>
          <p className={styles.actionCardDescription}>
            새로운 목표를 설정하고 달성해보세요
          </p>
          <a href="/goals" className={styles.actionButton}>
            목표 설정하기
          </a>
        </div>

        <div className={styles.actionCard}>
          <h4 className={styles.actionCardTitle}>차트 보기</h4>
          <p className={styles.actionCardDescription}>
            수영 기록을 차트로 분석해보세요
          </p>
          <a href="/charts" className={styles.actionButton}>
            차트 보기
          </a>
        </div>
      </div>

      {/* 최근 상세 기록 */}
      {detailedRecords.length > 0 && (
        <div className={styles.recentRecordsSection}>
          <h3 className={styles.recentRecordsTitle}>최근 상세 기록</h3>
          <div className={styles.recentRecordsList}>
            {detailedRecords.slice(0, 3).map((record) => (
              <div key={record.id} className={styles.recentRecordCard}>
                <div className={styles.recentRecordHeader}>
                  <h4 className={styles.recentRecordDate}>
                    {new Date(record.date).toLocaleDateString("ko-KR")}
                  </h4>
                  <span className={styles.recentRecordTime}>
                    {record.startTime} - {record.endTime}
                  </span>
                </div>
                <div className={styles.recentRecordStats}>
                  <div className={styles.recentRecordStat}>
                    <span className={styles.recentRecordLabel}>총 거리:</span>
                    <span className={styles.recentRecordValue}>
                      {formatDistance(record.totalDistance)}
                    </span>
                  </div>
                  <div className={styles.recentRecordStat}>
                    <span className={styles.recentRecordLabel}>총 시간:</span>
                    <span className={styles.recentRecordValue}>
                      {formatTime(record.totalDuration)}
                    </span>
                  </div>
                  <div className={styles.recentRecordStat}>
                    <span className={styles.recentRecordLabel}>
                      평균 페이스:
                    </span>
                    <span className={styles.recentRecordValue}>
                      {safeToFixed(record.averagePace, 1)}분/100m
                    </span>
                  </div>
                </div>
                <div className={styles.recentRecordSegments}>
                  <span className={styles.recentRecordLabel}>영법:</span>
                  <div className={styles.recentRecordSegmentList}>
                    {record.segments.map((segment: any, index: number) => (
                      <span key={index} className={styles.recentRecordSegment}>
                        {getStyleName(segment.style)}{" "}
                        {formatDistance(segment.distance)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommend && (
        <div className={styles.recommendationCard}>
          <h3 className={styles.recommendationTitle}>오늘의 추천</h3>
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
                  성취 🏆
                </button>
                <a href="/goals" className={styles.navLink}>
                  목표 🎯
                </a>
                <a href="/charts" className={styles.navLink}>
                  차트 📊
                </a>
                <button onClick={handleSignOut} className={styles.navLink}>
                  Sign Out
                </button>
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
                <div className={styles.loadingSpinner}></div>
                <p>통계를 불러오는 중...</p>
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
                      activeTab === "actions" ? styles.active : ""
                    }`}
                    onClick={() => setActiveTab("actions")}
                  >
                    ✏️ 기록 관리
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
                {activeTab === "actions" && <ActionsTab />}
                {activeTab === "recommend" && <SmartRecommendation />}
              </>
            )}

            {/* 상세 기록 입력 폼 (모달 스타일) */}
            {showRecordForm && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                      🏊‍♂️ 상세 수영 기록 입력
                    </h3>
                    <p className={styles.modalSubtitle}>
                      오늘의 수영 훈련을 자세히 기록해보세요
                    </p>
                    <button
                      onClick={() => setShowRecordForm(false)}
                      className={styles.closeButton}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className={styles.form}>
                    {/* 기본 정보 */}
                    <div className={styles.formSection}>
                      <h4 className={styles.sectionTitle}>📅 기본 정보</h4>
                      <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>날짜</label>
                          <input
                            type="date"
                            value={detailedForm.date}
                            onChange={(e) =>
                              setDetailedForm((prev) => ({
                                ...prev,
                                date: e.target.value,
                              }))
                            }
                            required
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>시작 시간</label>
                          <input
                            type="time"
                            value={detailedForm.startTime}
                            onChange={(e) =>
                              setDetailedForm((prev) => ({
                                ...prev,
                                startTime: e.target.value,
                              }))
                            }
                            required
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>종료 시간</label>
                          <input
                            type="time"
                            value={detailedForm.endTime}
                            onChange={(e) =>
                              setDetailedForm((prev) => ({
                                ...prev,
                                endTime: e.target.value,
                              }))
                            }
                            required
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>수영장 길이(m)</label>
                          <select
                            value={detailedForm.poolLength}
                            onChange={(e) =>
                              setDetailedForm((prev) => ({
                                ...prev,
                                poolLength: Number(e.target.value),
                              }))
                            }
                            className={styles.select}
                          >
                            <option value={20}>20m</option>
                            <option value={25}>25m</option>
                            <option value={50}>50m</option>
                          </select>
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>
                            평균 심박수(BPM)
                          </label>
                          <input
                            type="number"
                            value={detailedForm.averageHeartRate || ""}
                            onChange={(e) =>
                              setDetailedForm((prev) => ({
                                ...prev,
                                averageHeartRate: e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              }))
                            }
                            min={60}
                            max={200}
                            className={styles.input}
                            placeholder="선택사항"
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>주간 빈도(회)</label>
                          <input
                            type="number"
                            value={detailedForm.frequencyPerWeek}
                            onChange={(e) =>
                              setDetailedForm((prev) => ({
                                ...prev,
                                frequencyPerWeek: Number(e.target.value),
                              }))
                            }
                            required
                            min={1}
                            max={7}
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>목표</label>
                          <select
                            value={detailedForm.goal}
                            onChange={(e) =>
                              setDetailedForm((prev) => ({
                                ...prev,
                                goal: e.target.value,
                              }))
                            }
                            className={styles.select}
                          >
                            <option value="endurance">지구력</option>
                            <option value="speed">스피드</option>
                            <option value="technique">테크닉</option>
                          </select>
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>위치</label>
                          <input
                            type="text"
                            value={detailedForm.location}
                            onChange={(e) =>
                              setDetailedForm((prev) => ({
                                ...prev,
                                location: e.target.value,
                              }))
                            }
                            className={styles.input}
                            placeholder="수영장 이름 (선택사항)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 영법 구간 정보 */}
                    <div className={styles.formSection}>
                      <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>🏊‍♀️ 영법별 구간</h4>
                        <button
                          type="button"
                          onClick={addSegment}
                          className={styles.addSegmentButton}
                        >
                          영법 구간 추가
                        </button>
                      </div>

                      {detailedForm.segments.length === 0 ? (
                        <div className={styles.emptySegments}>
                          <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🏊‍♂️</div>
                            <p>영법별 구간을 추가해주세요</p>
                            <p className={styles.emptyDescription}>
                              자유형, 배영, 평영, 접영 등 각 영법별로 구간을
                              나누어 기록할 수 있습니다
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.segmentsList}>
                          {detailedForm.segments.map((segment, index) => (
                            <div key={index} className={styles.segmentCard}>
                              <div className={styles.segmentHeader}>
                                <h5 className={styles.segmentTitle}>
                                  영법 구간 {index + 1}
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => removeSegment(index)}
                                  className={styles.removeSegmentButton}
                                >
                                  삭제
                                </button>
                              </div>
                              <div className={styles.segmentGrid}>
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
                                    <option value="kickboard">킥판</option>
                                    <option value="pull">풀</option>
                                  </select>
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>
                                    거리(m)
                                  </label>
                                  <input
                                    type="number"
                                    value={segment.distance}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "distance",
                                        Number(e.target.value)
                                      )
                                    }
                                    required
                                    min={0}
                                    className={styles.input}
                                  />
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>
                                    시간(분)
                                  </label>
                                  <input
                                    type="number"
                                    value={segment.duration}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "duration",
                                        Number(e.target.value)
                                      )
                                    }
                                    required
                                    min={0}
                                    step={0.1}
                                    className={styles.input}
                                  />
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>
                                    페이스(분/100m)
                                  </label>
                                  <input
                                    type="number"
                                    value={segment.pace || ""}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "pace",
                                        e.target.value
                                          ? Number(e.target.value)
                                          : undefined
                                      )
                                    }
                                    min={0}
                                    step={0.1}
                                    className={styles.input}
                                    placeholder="자동 계산"
                                  />
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>
                                    심박수(BPM)
                                  </label>
                                  <input
                                    type="number"
                                    value={segment.heartRate || ""}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "heartRate",
                                        e.target.value
                                          ? Number(e.target.value)
                                          : undefined
                                      )
                                    }
                                    min={60}
                                    max={200}
                                    className={styles.input}
                                    placeholder="선택사항"
                                  />
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>랩 수</label>
                                  <input
                                    type="number"
                                    value={segment.laps}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "laps",
                                        Number(e.target.value)
                                      )
                                    }
                                    required
                                    min={0}
                                    className={styles.input}
                                  />
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.label}>메모</label>
                                  <input
                                    type="text"
                                    value={segment.notes || ""}
                                    onChange={(e) =>
                                      updateSegment(
                                        index,
                                        "notes",
                                        e.target.value
                                      )
                                    }
                                    className={styles.input}
                                    placeholder="선택사항"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 요약 정보 */}
                    {detailedForm.segments.length > 0 && (
                      <div className={styles.summarySection}>
                        <h4 className={styles.sectionTitle}>📊 훈련 요약</h4>
                        <div className={styles.summaryGrid}>
                          <div className={styles.summaryItem}>
                            <div className={styles.summaryIcon}>📏</div>
                            <div className={styles.summaryContent}>
                              <span className={styles.summaryLabel}>
                                총 거리
                              </span>
                              <span className={styles.summaryValue}>
                                {formatDistance(totalDistance)}
                              </span>
                            </div>
                          </div>
                          <div className={styles.summaryItem}>
                            <div className={styles.summaryIcon}>⏱️</div>
                            <div className={styles.summaryContent}>
                              <span className={styles.summaryLabel}>
                                총 시간
                              </span>
                              <span className={styles.summaryValue}>
                                {formatTime(totalDuration)}
                              </span>
                            </div>
                          </div>
                          <div className={styles.summaryItem}>
                            <div className={styles.summaryIcon}>🏃‍♂️</div>
                            <div className={styles.summaryContent}>
                              <span className={styles.summaryLabel}>
                                평균 페이스
                              </span>
                              <span className={styles.summaryValue}>
                                {safeToFixed(averagePace, 1)}분/100m
                              </span>
                            </div>
                          </div>
                          <div className={styles.summaryItem}>
                            <div className={styles.summaryIcon}>🔄</div>
                            <div className={styles.summaryContent}>
                              <span className={styles.summaryLabel}>총 랩</span>
                              <span className={styles.summaryValue}>
                                {totalLaps}랩
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 메모 */}
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>전체 메모</label>
                      <textarea
                        value={detailedForm.notes}
                        onChange={(e) =>
                          setDetailedForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        className={styles.textarea}
                        placeholder="전체 훈련에 대한 메모 (선택사항)"
                        rows={3}
                      />
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
                        disabled={
                          formState.loading ||
                          detailedForm.segments.length === 0
                        }
                        className={styles.submitButton}
                      >
                        {formState.loading ? "저장 중..." : "기록 저장"}
                      </button>
                    </div>
                  </form>

                  {formState.success && (
                    <div className={styles.successMessage}>
                      {formState.success}
                    </div>
                  )}
                  {formState.error && (
                    <div className={styles.errorMessage}>{formState.error}</div>
                  )}
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
                                {safeToFixed(
                                  trainingAnalysis.improvement
                                    .distanceImprovement,
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
                                {safeToFixed(
                                  trainingAnalysis.improvement.timeImprovement,
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
                                {safeToFixed(
                                  trainingAnalysis.improvement.speedImprovement,
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

            {/* 성취 모달 */}
            {showAchievements && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>성취 목록</h3>
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
                          className={`${styles.achievementCard} ${
                            achievement.isUnlocked
                              ? styles.unlocked
                              : styles.locked
                          }`}
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
