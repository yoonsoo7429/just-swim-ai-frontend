// 시간 포맷팅
export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
};

// 거리 포맷팅
export const formatDistance = (meters: number): string => {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
};

// 속도 포맷팅
export const formatSpeed = (speed: number): string => {
  return `${speed.toFixed(2)} m/min`;
};

// 날짜 포맷팅
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("ko-KR");
};

// 값 포맷팅 (단위 포함)
export const formatValue = (value: number, unit: string): string => {
  if (unit === "km") {
    return `${value}km`;
  } else if (unit === "minutes") {
    return formatTime(value);
  } else if (unit === "times") {
    return `${value}회`;
  } else if (unit === "m/min") {
    return formatSpeed(value);
  }
  return `${value}${unit}`;
};

// 영법 이름 변환
export const getStyleName = (style: string): string => {
  const styleNames: { [key: string]: string } = {
    freestyle: "자유형",
    backstroke: "배영",
    breaststroke: "평영",
    butterfly: "접영",
  };
  return styleNames[style] || style;
};

// 목표 이름 변환
export const getGoalName = (goal: string): string => {
  const goalNames: { [key: string]: string } = {
    endurance: "지구력",
    speed: "스피드",
    technique: "테크닉",
  };
  return goalNames[goal] || goal;
};

// 목표 유형 이름 변환
export const getGoalTypeName = (type: string): string => {
  const typeNames: { [key: string]: string } = {
    distance: "거리",
    time: "시간",
    frequency: "빈도",
    speed: "속도",
    style_mastery: "영법 숙련",
    streak: "연속",
  };
  return typeNames[type] || type;
};

// 목표 상태 이름 변환
export const getGoalStatusName = (status: string): string => {
  const statusNames: { [key: string]: string } = {
    active: "진행중",
    completed: "완료",
    failed: "실패",
    paused: "일시정지",
  };
  return statusNames[status] || status;
};

// 성취 레벨 이름 변환
export const getLevelName = (level: string): string => {
  const levelNames: { [key: string]: string } = {
    bronze: "브론즈",
    silver: "실버",
    gold: "골드",
    platinum: "플래티넘",
  };
  return levelNames[level] || level;
};

// 성취 레벨 색상
export const getLevelColor = (level: string): string => {
  const colors: { [key: string]: string } = {
    bronze: "#cd7f32",
    silver: "#c0c0c0",
    gold: "#ffd700",
    platinum: "#e5e4e2",
  };
  return colors[level] || "#666";
};

// 목표 상태 색상
export const getGoalStatusColor = (status: string): string => {
  const colors: { [key: string]: string } = {
    active: "#4CAF50",
    completed: "#2196F3",
    failed: "#f44336",
    paused: "#FF9800",
  };
  return colors[status] || "#666";
};
