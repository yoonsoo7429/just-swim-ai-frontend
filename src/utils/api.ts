import { API_URLS } from "../config/api";

// 쿠키에서 토큰 읽기
export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

// 토큰 가져오기 (localStorage 또는 쿠키에서)
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token") || getCookie("access_token");
};

// 로그아웃 처리
export const signout = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
};

// API 요청 헤더 생성
export const createAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// API 에러 클래스
export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

// 기본 API 요청 함수
export const apiRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const headers = createAuthHeaders();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorCode: string | undefined;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorCode = errorData.code;
      } catch {
        // JSON 파싱 실패 시 기본 메시지 사용
      }

      throw new ApiError(errorMessage, response.status, errorCode);
    }

    // 빈 응답 처리
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return {} as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`API request failed for ${url}:`, error);
    throw new ApiError(
      error instanceof Error ? error.message : "네트워크 오류가 발생했습니다.",
      0
    );
  }
};

// GET 요청
export const apiGet = <T>(url: string): Promise<T> => {
  return apiRequest<T>(url, { method: "GET" });
};

// POST 요청
export const apiPost = <T>(url: string, data: any): Promise<T> => {
  return apiRequest<T>(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// PUT 요청
export const apiPut = <T>(url: string, data: any): Promise<T> => {
  return apiRequest<T>(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// PATCH 요청
export const apiPatch = <T>(url: string, data: any): Promise<T> => {
  return apiRequest<T>(url, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// DELETE 요청
export const apiDelete = <T>(url: string): Promise<T> => {
  return apiRequest<T>(url, { method: "DELETE" });
};

// 수영 기록 관련 API 함수들
export const recordsApi = {
  // 수영 기록 생성 (통합)
  create: (data: any) => apiPost<any>(API_URLS.RECORDS, data),

  // 수영 기록 목록 조회
  getAll: () => apiGet<any[]>(API_URLS.RECORDS),

  // 상세 분석 데이터 조회
  getAnalysis: () => apiGet<any>(`${API_URLS.RECORDS}/analysis`),

  // 사용자 통계 조회
  getStats: () => apiGet<any>(API_URLS.RECORDS_STATS),

  // 영법별 통계 조회
  getStyleStats: () => apiGet<any>(API_URLS.RECORDS_STYLE_STATS),

  // 개인 최고 기록 조회
  getPersonalBests: () => apiGet<any>(API_URLS.RECORDS_PERSONAL_BESTS),

  // 주간 통계 조회
  getWeeklyStats: () => apiGet<any>(API_URLS.RECORDS_WEEKLY_STATS),
};

// 목표 관련 API 함수들
export const goalsApi = {
  // 목표 생성
  create: (data: any) => apiPost<any>(API_URLS.GOALS, data),

  // 목표 목록 조회
  getAll: () => apiGet<any[]>(API_URLS.GOALS),

  // 목표 통계 조회
  getStats: () => apiGet<any>(API_URLS.GOALS_STATS),

  // 목표 상세 조회
  getById: (id: number) => apiGet<any>(`${API_URLS.GOALS}/${id}`),

  // 목표 수정
  update: (id: number, data: any) =>
    apiPatch<any>(`${API_URLS.GOALS}/${id}`, data),

  // 목표 삭제
  delete: (id: number) => apiDelete<any>(`${API_URLS.GOALS}/${id}`),

  // 목표 진행률 업데이트
  updateProgress: () => apiPost<any>(`${API_URLS.GOALS}/update-progress`, {}),
};

// 성취 관련 API 함수들
export const achievementsApi = {
  // 성취 목록 조회
  getAll: () => apiGet<any[]>(API_URLS.ACHIEVEMENTS),

  // 잠금 해제된 성취 조회
  getUnlocked: () => apiGet<any[]>(API_URLS.ACHIEVEMENTS_UNLOCKED),

  // 성취 통계 조회
  getStats: () => apiGet<any>(API_URLS.ACHIEVEMENTS_STATS),

  // 성취 확인
  check: () => apiGet<any>(API_URLS.ACHIEVEMENTS_CHECK),
};

// 추천 관련 API 함수들
export const recommendApi = {
  // 추천 생성
  create: (data: any) => apiPost<any>(API_URLS.RECOMMEND, data),

  // 사용자별 추천 목록 조회
  getByUserId: () => apiGet<any[]>(API_URLS.RECOMMEND),

  // 사용자 프로필 분석 조회
  getUserProfile: () => apiGet<any>(`${API_URLS.RECOMMEND}/profile`),

  // 추천 통계 조회
  getStats: () => apiGet<any>(`${API_URLS.RECOMMEND}/stats`),
};

// 웨어러블 기기 관련 API 함수들
export const wearableApi = {
  // 지원하는 웨어러블 기기 목록 조회
  getProviders: () => apiGet<any>(API_URLS.WEARABLE_PROVIDERS),

  // 웨어러블 기기 연결
  connect: (data: any) => apiPost<any>(API_URLS.WEARABLE_CONNECT, data),

  // 웨어러블 기기 연결 해제
  disconnect: (provider: string) =>
    apiDelete<any>(`${API_URLS.WEARABLE_DISCONNECT}/${provider}`),

  // 사용자의 웨어러블 기기 연결 목록 조회
  getConnections: () => apiGet<any[]>(API_URLS.WEARABLE_CONNECTIONS),

  // 웨어러블 데이터 동기화
  sync: (data: any) => apiPost<any>(API_URLS.WEARABLE_SYNC, data),

  // 웨어러블 통계 조회
  getStats: (provider: string) =>
    apiGet<any>(`${API_URLS.WEARABLE_STATS}/${provider}`),
};

// 사용자 관련 API 함수들
export const userApi = {
  // 사용자 정보 조회
  getProfile: () => apiGet<any>(API_URLS.USER_PROFILE),

  // 사용자 정보 수정
  updateProfile: (data: any) => apiPut<any>(API_URLS.USER_PROFILE, data),

  // 사용자 통계 조회
  getStats: () => apiGet<any>(API_URLS.USER_STATS),
};
