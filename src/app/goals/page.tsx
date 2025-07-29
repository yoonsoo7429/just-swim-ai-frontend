"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./goals.module.scss";
import { useAuth } from "../../hooks/useAuth";
import { useForm } from "../../hooks/useForm";
import { goalsApi } from "../../utils/api";
import { Goal, GoalStats, CreateGoalRequest, GoalType } from "../../types";
import {
  formatDate,
  formatValue,
  getGoalTypeName,
  getGoalStatusName,
  getGoalStatusColor,
} from "../../utils/formatters";

export default function GoalsPage() {
  const { isLoggedIn, checkAuth } = useAuth();
  const {
    form,
    formState,
    handleChange,
    setLoading,
    setError,
    setSuccess,
    resetForm,
  } = useForm<CreateGoalRequest>({
    title: "",
    description: "",
    type: GoalType.DISTANCE,
    targetValue: 0,
    unit: "km",
    startDate: "",
    endDate: "",
    isRecurring: false,
    recurringType: "weekly",
  });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalStats, setGoalStats] = useState<GoalStats | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!checkAuth()) return;
    fetchGoals();
    fetchGoalStats();
  }, [isLoggedIn]);

  const fetchGoals = async () => {
    try {
      const data = await goalsApi.getAll();
      setGoals(data);
    } catch (error) {
      setError("목표 목록을 불러오는데 실패했습니다.");
    }
  };

  const fetchGoalStats = async () => {
    try {
      const data = await goalsApi.getStats();
      setGoalStats(data);
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
      await goalsApi.create(form);
      setSuccess("목표가 성공적으로 생성되었습니다!");
      setShowCreateForm(false);
      resetForm();
      fetchGoals();
      fetchGoalStats();
    } catch (error: any) {
      setError("목표 생성 중 오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteGoal = async (id: number) => {
    if (!confirm("정말로 이 목표를 삭제하시겠습니까?")) return;

    try {
      await goalsApi.delete(id);
      setSuccess("목표가 삭제되었습니다.");
      fetchGoals();
      fetchGoalStats();
    } catch (error) {
      setError("목표 삭제에 실패했습니다.");
    }
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
              <div className={styles.statNumber}>
                {goalStats?.totalGoals || 0}
              </div>
              <div className={styles.statLabel}>전체 목표</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {goalStats?.activeGoals || 0}
              </div>
              <div className={styles.statLabel}>진행중</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {goalStats?.completedGoals || 0}
              </div>
              <div className={styles.statLabel}>완료</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {goalStats?.completionRate?.toFixed(1) || "0.0"}%
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
                    style={{ backgroundColor: getGoalStatusColor(goal.status) }}
                  >
                    {getGoalStatusName(goal.status)}
                  </span>
                </div>

                {goal.description && (
                  <p className={styles.description}>{goal.description}</p>
                )}

                <div className={styles.goalInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>유형:</span>
                    <span>{getGoalTypeName(goal.type)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>목표:</span>
                    <span>
                      {formatValue(goal.targetValue, goal.unit || "")}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>현재:</span>
                    <span>
                      {formatValue(goal.currentValue, goal.unit || "")}
                    </span>
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
                  <option value={GoalType.DISTANCE}>거리</option>
                  <option value={GoalType.TIME}>시간</option>
                  <option value={GoalType.FREQUENCY}>빈도</option>
                  <option value={GoalType.SPEED}>속도</option>
                  <option value={GoalType.STYLE_MASTERY}>영법 숙련</option>
                  <option value={GoalType.STREAK}>연속</option>
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
                  disabled={formState.loading}
                  className={styles.submitButton}
                >
                  {formState.loading ? "생성 중..." : "목표 생성"}
                </button>
              </div>
            </form>

            {formState.success && (
              <div className={styles.successMessage}>{formState.success}</div>
            )}
            {formState.error && (
              <div className={styles.errorMessage}>{formState.error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
