// 사용자 관련 타입
export interface User {
  id: number;
  email: string;
  nickname?: string;
  createdAt: string;
  updatedAt: string;
}

// 수영 기록 관련 타입
export interface Record {
  id: number;
  userId: number;
  date: string;
  distance: number;
  style: string;
  duration: number;
  frequencyPerWeek: number;
  goal: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordRequest {
  date: string;
  distance: number;
  style: string;
  duration: number;
  frequency_per_week: number;
  goal: string;
}

// 목표 관련 타입
export interface Goal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  unit?: string;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  isCompleted: boolean;
  progress: number;
  isRecurring: boolean;
  recurringType?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum GoalType {
  DISTANCE = "distance",
  TIME = "time",
  FREQUENCY = "frequency",
  SPEED = "speed",
  STYLE_MASTERY = "style_mastery",
  STREAK = "streak",
}

export enum GoalStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  FAILED = "failed",
  PAUSED = "paused",
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  unit?: string;
  startDate: string;
  endDate: string;
  isRecurring?: boolean;
  recurringType?: string;
}

// 성취 관련 타입
export interface Achievement {
  id: number;
  userId: number;
  type: string;
  level: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 통계 관련 타입
export interface UserStats {
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

export interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  failedGoals: number;
  completionRate: number;
  goalsByType: { [key: string]: number };
}

export interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  completionRate: number;
  levelStats: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

export interface StyleStats {
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

// 훈련 분석 관련 타입
export interface TrainingAnalysis {
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

// 추천 관련 타입
export interface Recommend {
  id: string;
  userId: number;
  swim_training: string;
  dryland_training: string;
  input: CreateRecordRequest;
  createdAt: string;
  updatedAt: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

// 폼 상태 타입
export interface FormState {
  loading: boolean;
  error: string;
  success: string;
}

// 네비게이션 타입
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  requiresAuth: boolean;
}
