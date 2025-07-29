"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URLS } from "@/config/api";
import { TrainingChart } from "@/components/charts/TrainingChart";
import { AchievementChart } from "@/components/charts/AchievementChart";
import styles from "./charts.module.scss";

interface TrainingRecord {
  id: number;
  date: string;
  distance: number;
  duration: number;
  style: string;
  goal: string;
}

interface Achievement {
  id: number;
  type: string;
  level: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export default function ChartsPage() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrainingChart, setSelectedTrainingChart] = useState<
    "distance" | "duration" | "style" | "goal"
  >("distance");
  const [selectedAchievementChart, setSelectedAchievementChart] = useState<
    "level" | "progress" | "completion"
  >("level");
  const router = useRouter();

  // 쿠키에서 토큰 읽기
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") || getCookie("access_token");
    if (!token) {
      router.push("/signin");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [recordsRes, achievementsRes] = await Promise.all([
          fetch(API_URLS.RECORDS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URLS.ACHIEVEMENTS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (recordsRes.ok) {
          const recordsData = await recordsRes.json();
          setRecords(recordsData);
        }

        if (achievementsRes.ok) {
          const achievementsData = await achievementsRes.json();
          setAchievements(achievementsData);
        }
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>차트를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>수영 통계 차트</h1>
        <p className={styles.subtitle}>
          훈련 기록과 성취 현황을 시각적으로 확인해보세요
        </p>
      </div>

      <div className={styles.chartsSection}>
        {/* 훈련 기록 차트 */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>훈련 기록 분석</h2>
            <div className={styles.chartControls}>
              <select
                value={selectedTrainingChart}
                onChange={(e) =>
                  setSelectedTrainingChart(e.target.value as any)
                }
                className={styles.chartSelect}
              >
                <option value="distance">거리 추이</option>
                <option value="duration">시간 추이</option>
                <option value="style">영법별 분포</option>
                <option value="goal">목표별 분포</option>
              </select>
            </div>
          </div>
          <div className={styles.chartContent}>
            <TrainingChart records={records} type={selectedTrainingChart} />
          </div>
        </div>

        {/* 성취 차트 */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>성취 현황</h2>
            <div className={styles.chartControls}>
              <select
                value={selectedAchievementChart}
                onChange={(e) =>
                  setSelectedAchievementChart(e.target.value as any)
                }
                className={styles.chartSelect}
              >
                <option value="level">등급별 분포</option>
                <option value="progress">진행률</option>
                <option value="completion">달성 현황</option>
              </select>
            </div>
          </div>
          <div className={styles.chartContent}>
            <AchievementChart
              achievements={achievements}
              type={selectedAchievementChart}
            />
          </div>
        </div>
      </div>

      <div className={styles.navigation}>
        <button onClick={() => router.push("/")} className={styles.backButton}>
          ← 대시보드로 돌아가기
        </button>
      </div>
    </div>
  );
}
