"use client";

import React, { useState, useEffect } from "react";
import { recommendApi, recordsApi } from "../../utils/api";
import styles from "./SmartRecommendation.module.scss";

interface UserProfile {
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  preferredStyles: string[];
  trainingFrequency: number;
  recentPerformance: number;
  goals: string[];
  consistency: number;
}

interface RecommendationStats {
  totalRecommendations: number;
  userProfile: UserProfile;
  difficultyStats: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  intensityStats: {
    low: number;
    medium: number;
    high: number;
  };
  focusStats: { [key: string]: number };
  averageDuration: number;
}

interface TrainingRecommendation {
  swim_training: string;
  dryland_training: string;
  intensity: string;
  focus: string;
  duration: number;
  difficulty: string;
  createdAt: string;
}

interface AnalysisData {
  styleAnalysis: any[];
  intensityAnalysis: any;
  complexTrainingRatio: number;
  averageSessionDuration: number;
  totalSessions: number;
  totalDistance: number;
  overallImprovement: number;
}

const SmartRecommendation: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<
    TrainingRecommendation[]
  >([]);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<
    "recommendations" | "analysis"
  >("recommendations");

  useEffect(() => {
    loadRecommendationData();
  }, []);

  const loadRecommendationData = async () => {
    try {
      setLoading(true);
      const [profileData, recommendationsData, statsData, analysisData] =
        await Promise.all([
          recommendApi.getUserProfile(),
          recommendApi.getByUserId(),
          recommendApi.getStats(),
          recordsApi.getAnalysis().catch(() => null),
        ]);

      setUserProfile(profileData);
      setRecommendations(recommendationsData);
      setStats(statsData);
      setAnalysisData(analysisData);
    } catch (err) {
      setError("추천 데이터를 불러오는데 실패했습니다.");
      console.error("Recommendation data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "#4CAF50";
      case "intermediate":
        return "#FF9800";
      case "advanced":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case "low":
        return "#4CAF50";
      case "medium":
        return "#FF9800";
      case "high":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const formatDistance = (distance: number) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}km`;
    }
    return `${distance}m`;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>추천 데이터를 분석 중입니다...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🤖 AI 스마트 추천 & 분석</h2>

      {/* 섹션 네비게이션 */}
      <div className={styles.sectionNavigation}>
        <button
          className={`${styles.sectionButton} ${
            activeSection === "recommendations" ? styles.active : ""
          }`}
          onClick={() => setActiveSection("recommendations")}
        >
          🎯 AI 추천
        </button>
        <button
          className={`${styles.sectionButton} ${
            activeSection === "analysis" ? styles.active : ""
          }`}
          onClick={() => setActiveSection("analysis")}
        >
          📊 상세 분석
        </button>
      </div>

      {activeSection === "recommendations" && (
        <>
          {/* 사용자 프로필 섹션 */}
          {userProfile && (
            <div className={styles.profileSection}>
              <h3>📊 사용자 프로필 분석</h3>
              <div className={styles.profileGrid}>
                <div className={styles.profileCard}>
                  <h4>총 수영 거리</h4>
                  <p className={styles.profileValue}>
                    {formatDistance(userProfile.totalDistance)}
                  </p>
                </div>
                <div className={styles.profileCard}>
                  <h4>총 훈련 시간</h4>
                  <p className={styles.profileValue}>
                    {formatTime(userProfile.totalTime)}
                  </p>
                </div>
                <div className={styles.profileCard}>
                  <h4>평균 속도</h4>
                  <p className={styles.profileValue}>
                    {userProfile.averageSpeed.toFixed(2)} m/min
                  </p>
                </div>
                <div className={styles.profileCard}>
                  <h4>선호 영법</h4>
                  <p className={styles.profileValue}>
                    {userProfile.preferredStyles.join(", ")}
                  </p>
                </div>
                <div className={styles.profileCard}>
                  <h4>월 훈련 빈도</h4>
                  <p className={styles.profileValue}>
                    {userProfile.trainingFrequency}회
                  </p>
                </div>
                <div className={styles.profileCard}>
                  <h4>일관성 점수</h4>
                  <p className={styles.profileValue}>
                    {(userProfile.consistency * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 추천 통계 섹션 */}
          {stats && (
            <div className={styles.statsSection}>
              <h3>📈 추천 통계</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statsCard}>
                  <h4>총 추천 수</h4>
                  <p className={styles.statsValue}>
                    {stats.totalRecommendations}개
                  </p>
                </div>
                <div className={styles.statsCard}>
                  <h4>평균 훈련 시간</h4>
                  <p className={styles.statsValue}>{stats.averageDuration}분</p>
                </div>
                <div className={styles.statsCard}>
                  <h4>주요 집중 영역</h4>
                  <p className={styles.statsValue}>
                    {Object.entries(stats.focusStats)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 1)
                      .map(([focus]) => focus)[0] || "전반적 향상"}
                  </p>
                </div>
              </div>

              {/* 난이도 분포 */}
              <div className={styles.distributionSection}>
                <h4>난이도 분포</h4>
                <div className={styles.distributionBars}>
                  <div className={styles.distributionBar}>
                    <span>초급</span>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.bar}
                        style={{
                          width: `${
                            (stats.difficultyStats.beginner /
                              Math.max(1, stats.totalRecommendations)) *
                            100
                          }%`,
                          backgroundColor: "#4CAF50",
                        }}
                      />
                    </div>
                    <span>{stats.difficultyStats.beginner}</span>
                  </div>
                  <div className={styles.distributionBar}>
                    <span>중급</span>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.bar}
                        style={{
                          width: `${
                            (stats.difficultyStats.intermediate /
                              Math.max(1, stats.totalRecommendations)) *
                            100
                          }%`,
                          backgroundColor: "#FF9800",
                        }}
                      />
                    </div>
                    <span>{stats.difficultyStats.intermediate}</span>
                  </div>
                  <div className={styles.distributionBar}>
                    <span>고급</span>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.bar}
                        style={{
                          width: `${
                            (stats.difficultyStats.advanced /
                              Math.max(1, stats.totalRecommendations)) *
                            100
                          }%`,
                          backgroundColor: "#F44336",
                        }}
                      />
                    </div>
                    <span>{stats.difficultyStats.advanced}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 최근 추천 목록 */}
          <div className={styles.recommendationsSection}>
            <h3>🎯 최근 개인화 추천</h3>
            {recommendations.length === 0 ? (
              <div className={styles.noRecommendations}>
                아직 추천이 없습니다. 첫 번째 훈련을 기록해보세요!
              </div>
            ) : (
              <div className={styles.recommendationsList}>
                {recommendations.slice(0, 5).map((rec, index) => (
                  <div key={index} className={styles.recommendationCard}>
                    <div className={styles.recommendationHeader}>
                      <div className={styles.recommendationMeta}>
                        <span
                          className={styles.difficultyBadge}
                          style={{
                            backgroundColor: getDifficultyColor(rec.difficulty),
                          }}
                        >
                          {rec.difficulty === "beginner"
                            ? "초급"
                            : rec.difficulty === "intermediate"
                            ? "중급"
                            : "고급"}
                        </span>
                        <span
                          className={styles.intensityBadge}
                          style={{
                            backgroundColor: getIntensityColor(rec.intensity),
                          }}
                        >
                          {rec.intensity === "low"
                            ? "낮음"
                            : rec.intensity === "medium"
                            ? "보통"
                            : "높음"}
                        </span>
                      </div>
                      <div className={styles.recommendationDate}>
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className={styles.recommendationContent}>
                      <div className={styles.trainingSection}>
                        <h4>🏊‍♂️ 수영 훈련</h4>
                        <p>{rec.swim_training}</p>
                      </div>
                      <div className={styles.trainingSection}>
                        <h4>💪 드라이랜드 훈련</h4>
                        <p>{rec.dryland_training}</p>
                      </div>
                      <div className={styles.trainingSection}>
                        <h4>🎯 집중 영역</h4>
                        <p>{rec.focus}</p>
                      </div>
                      <div className={styles.trainingSection}>
                        <h4>⏱️ 예상 시간</h4>
                        <p>{rec.duration}분</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeSection === "analysis" && (
        <div className={styles.analysisSection}>
          <h3>📊 AI 상세 분석</h3>
          {analysisData ? (
            <div className={styles.analysisGrid}>
              <div className={styles.analysisCard}>
                <h4>📈 전체 개선도</h4>
                <p className={styles.analysisValue}>
                  {analysisData.overallImprovement > 0 ? "+" : ""}
                  {analysisData.overallImprovement.toFixed(1)}%
                </p>
                <p className={styles.analysisDescription}>
                  전반적인 수영 능력 향상도
                </p>
              </div>

              <div className={styles.analysisCard}>
                <h4>🏊‍♂️ 복합 훈련 비율</h4>
                <p className={styles.analysisValue}>
                  {analysisData.complexTrainingRatio}%
                </p>
                <p className={styles.analysisDescription}>
                  여러 영법을 조합한 훈련 비율
                </p>
              </div>

              <div className={styles.analysisCard}>
                <h4>⏱️ 평균 세션 시간</h4>
                <p className={styles.analysisValue}>
                  {formatTime(analysisData.averageSessionDuration)}
                </p>
                <p className={styles.analysisDescription}>
                  한 번의 훈련 평균 시간
                </p>
              </div>

              <div className={styles.analysisCard}>
                <h4>📊 총 훈련 세션</h4>
                <p className={styles.analysisValue}>
                  {analysisData.totalSessions}회
                </p>
                <p className={styles.analysisDescription}>
                  기록된 총 훈련 횟수
                </p>
              </div>

              {analysisData.styleAnalysis &&
                analysisData.styleAnalysis.length > 0 && (
                  <div className={styles.analysisCard}>
                    <h4>🎯 영법별 분석</h4>
                    <div className={styles.styleAnalysis}>
                      {analysisData.styleAnalysis.map((style, index) => (
                        <div key={index} className={styles.styleItem}>
                          <span className={styles.styleName}>
                            {style.style}
                          </span>
                          <span className={styles.styleStats}>
                            {formatDistance(style.totalDistance)} /{" "}
                            {formatTime(style.totalDuration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {analysisData.intensityAnalysis && (
                <div className={styles.analysisCard}>
                  <h4>💓 강도 분석</h4>
                  <div className={styles.intensityAnalysis}>
                    <div className={styles.intensityItem}>
                      <span>저강도</span>
                      <span>
                        {analysisData.intensityAnalysis.lowIntensity}%
                      </span>
                    </div>
                    <div className={styles.intensityItem}>
                      <span>중강도</span>
                      <span>
                        {analysisData.intensityAnalysis.mediumIntensity}%
                      </span>
                    </div>
                    <div className={styles.intensityItem}>
                      <span>고강도</span>
                      <span>
                        {analysisData.intensityAnalysis.highIntensity}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.noAnalysis}>
              <p>아직 충분한 데이터가 없어 분석을 제공할 수 없습니다.</p>
              <p>더 많은 수영 기록을 입력해보세요!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartRecommendation;
