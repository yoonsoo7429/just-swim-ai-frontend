// API 설정
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  ENDPOINTS: {
    SIGNIN: "/auth/signin",
    SIGNUP: "/auth/signup",
    RECORDS: "/records",
    RECOMMEND: "/recommend",
  },
};

// API URL 생성 함수
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// 전체 API URL들
export const API_URLS = {
  SIGNIN: getApiUrl(API_CONFIG.ENDPOINTS.SIGNIN),
  SIGNUP: getApiUrl(API_CONFIG.ENDPOINTS.SIGNUP),
  RECORDS: getApiUrl(API_CONFIG.ENDPOINTS.RECORDS),
  RECOMMEND: getApiUrl(API_CONFIG.ENDPOINTS.RECOMMEND),
};
