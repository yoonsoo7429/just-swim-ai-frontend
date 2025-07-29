"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./goals.module.scss";
import { API_URLS } from "../../config/api";

interface Goal {
  id: number;
  title: string;
  description: string;
  type: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: string;
  isCompleted: boolean;
  progress: number;
  isRecurring: boolean;
  recurringType: string;
  createdAt: string;
  updatedAt: string;
}

interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  failedGoals: number;
  completionRate: number;
  goalsByType: { [key: string]: number };
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalStats, setGoalStats] = useState<GoalStats | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "distance",
    targetValue: 0,
    unit: "km",
    startDate: "",
    endDate: "",
    isRecurring: false,
    recurringType: "weekly",
  });
  const router = useRouter();

  // 쿠키에서 토큰 읽기
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  useEffect(() => {
    const token = getCookie("access_token");
    if (!token) {
      router.push("/signin");
      return;
    }
    fetchGoals();
    fetchGoalStats();
  }, [router]);

  const fetchGoals = async () => {
    try {
      const token = getCookie("access_token");
      const response = await fetch(API_URLS.GOALS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      } else {
        setError("목표 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      setError("목표 목록을 불러오는데 실패했습니다.");
    }
  };

  const fetchGoalStats = async () => {
    try {
      const token = getCookie("access_token");
      const response = await fetch(API_URLS.GOALS_STATS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoalStats(data);
      }
    } catch (error) {
      console.error("목표 통계를 불러오는데 실패했습니다:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getCookie("access_token");
      const goalUrl = API_URLS.GOALS;
      const response = await fetch(goalUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setSuccess("목표가 성공적으로 생성되었습니다!");
        setShowCreateForm(false);
        setForm({
          title: "",
          description: "",
          type: "distance",
          targetValue: 0,
          unit: "km",
          startDate: "",
          endDate: "",
          isRecurring: false,
          recurringType: "weekly",
        });
        fetchGoals();
        fetchGoalStats();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "목표 생성에 실패했습니다.");
      }
    } catch (error) {
      setError("목표 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const deleteGoal = async (id: number) => {
    if (!confirm("정말로 이 목표를 삭제하시겠습니까?")) return;

    try {
      const token = getCookie("access_token");
      const response = await fetch(`${API_URLS.GOALS}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess("목표가 삭제되었습니다.");
        fetchGoals();
        fetchGoalStats();
      } else {
        setError("목표 삭제에 실패했습니다.");
      }
    } catch (error) {
      setError("목표 삭제에 실패했습니다.");
    }
  };

  const getTypeName = (type: string) => {
    const typeNames = {
      distance: "거리",
      time: "시간",
      frequency: "빈도",
      speed: "속도",
      style_mastery: "영법 숙련",
      streak: "연속",
    };
    return typeNames[type as keyof typeof typeNames] || type;
  };

  const getStatusName = (status: string) => {
    const statusNames = {
      active: "진행중",
      completed: "완료",
      failed: "실패",
      paused: "일시정지",
    };
    return statusNames[status as keyof typeof statusNames] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: "#4CAF50",
      completed: "#2196F3",
      failed: "#f44336",
      paused: "#FF9800",
    };
    return colors[status as keyof typeof colors] || "#666";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === "km") {
      return `${value}km`;
    } else if (unit === "minutes") {
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
    } else if (unit === "times") {
      return `${value}회`;
    } else if (unit === "m/min") {
      return `${value.toFixed(2)} m/min`;
    }
    return `${value}${unit}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>목표 설정</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className={styles.createButton}
        >
          새 목표 만들기
        </button>
      </div>

      {/* 목표 통계 */}
      {goalStats && (
        <div className={styles.statsContainer}>
          <h2>목표 현황</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{goalStats.totalGoals}</div>
              <div className={styles.statLabel}>전체 목표</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{goalStats.activeGoals}</div>
              <div className={styles.statLabel}>진행중</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {goalStats.completedGoals}
              </div>
              <div className={styles.statLabel}>완료</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {goalStats.completionRate}%
              </div>
              <div className={styles.statLabel}>달성률</div>
            </div>
          </div>
        </div>
      )}

      {/* 목표 목록 */}
      <div className={styles.goalsContainer}>
        <h2>내 목표들</h2>
        {goals.length === 0 ? (
          <div className={styles.emptyState}>
            <p>아직 설정된 목표가 없습니다.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className={styles.createButton}
            >
              첫 번째 목표 만들기
            </button>
          </div>
        ) : (
          <div className={styles.goalsGrid}>
            {goals.map((goal) => (
              <div key={goal.id} className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <h3>{goal.title}</h3>
                  <span
                    className={styles.status}
                    style={{ backgroundColor: getStatusColor(goal.status) }}
                  >
                    {getStatusName(goal.status)}
                  </span>
                </div>

                {goal.description && (
                  <p className={styles.description}>{goal.description}</p>
                )}

                <div className={styles.goalInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>유형:</span>
                    <span>{getTypeName(goal.type)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>목표:</span>
                    <span>{formatValue(goal.targetValue, goal.unit)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>현재:</span>
                    <span>{formatValue(goal.currentValue, goal.unit)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>기간:</span>
                    <span>
                      {formatDate(goal.startDate)} ~ {formatDate(goal.endDate)}
                    </span>
                  </div>
                </div>

                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>{goal.progress}%</span>
                </div>

                <div className={styles.goalActions}>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className={styles.deleteButton}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 목표 생성 모달 */}
      {showCreateForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>새 목표 만들기</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>목표 제목 *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>설명</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>목표 유형 *</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="distance">거리</option>
                  <option value="time">시간</option>
                  <option value="frequency">빈도</option>
                  <option value="speed">속도</option>
                  <option value="style_mastery">영법 숙련</option>
                  <option value="streak">연속</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>목표값 *</label>
                <input
                  type="number"
                  name="targetValue"
                  value={form.targetValue}
                  onChange={handleChange}
                  className={styles.input}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>단위</label>
                <input
                  type="text"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="km, minutes, times, etc."
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>시작일 *</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>종료일 *</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="isRecurring"
                    checked={form.isRecurring}
                    onChange={handleChange}
                    className={styles.checkbox}
                  />
                  반복 목표
                </label>
              </div>

              {form.isRecurring && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>반복 주기</label>
                  <select
                    name="recurringType"
                    value={form.recurringType}
                    onChange={handleChange}
                    className={styles.select}
                  >
                    <option value="daily">매일</option>
                    <option value="weekly">매주</option>
                    <option value="monthly">매월</option>
                  </select>
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className={styles.cancelButton}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitButton}
                >
                  {loading ? "생성 중..." : "목표 생성"}
                </button>
              </div>
            </form>

            {success && <div className={styles.successMessage}>{success}</div>}
            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
