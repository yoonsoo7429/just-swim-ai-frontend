// API 설정
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api",
  ENDPOINTS: {
    SIGNIN: "/auth/signin",
    SIGNUP: "/auth/signup",
    RECORDS: "/records",
    RECOMMEND: "/recommend",
    RECORDS_STATS: "/records/stats",
    RECORDS_STYLE_STATS: "/records/stats/style",
    RECORDS_PERSONAL_BESTS: "/records/personal-bests",
    RECORDS_WEEKLY_STATS: "/records/weekly-stats",
  },
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const API_URLS = {
  SIGNIN: getApiUrl(API_CONFIG.ENDPOINTS.SIGNIN),
  SIGNUP: getApiUrl(API_CONFIG.ENDPOINTS.SIGNUP),
  RECORDS: getApiUrl(API_CONFIG.ENDPOINTS.RECORDS),
  RECOMMEND: getApiUrl(API_CONFIG.ENDPOINTS.RECOMMEND),
  RECORDS_STATS: getApiUrl(API_CONFIG.ENDPOINTS.RECORDS_STATS),
  RECORDS_STYLE_STATS: getApiUrl(API_CONFIG.ENDPOINTS.RECORDS_STYLE_STATS),
  RECORDS_PERSONAL_BESTS: getApiUrl(
    API_CONFIG.ENDPOINTS.RECORDS_PERSONAL_BESTS
  ),
  RECORDS_WEEKLY_STATS: getApiUrl(API_CONFIG.ENDPOINTS.RECORDS_WEEKLY_STATS),
};
