import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface TrainingRecord {
  id: number;
  date: string;
  distance: number;
  duration: number;
  style: string;
  goal: string;
}

interface TrainingChartProps {
  records: TrainingRecord[];
  type: "distance" | "duration" | "style" | "goal";
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export const TrainingChart: React.FC<TrainingChartProps> = ({
  records,
  type,
}) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
  };

  const formatDistance = (meters: number) => {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
  };

  const getStyleName = (style: string) => {
    const styleNames = {
      freestyle: "자유형",
      backstroke: "배영",
      breaststroke: "평영",
      butterfly: "접영",
    };
    return styleNames[style as keyof typeof styleNames] || style;
  };

  const getGoalName = (goal: string) => {
    const goalNames = {
      endurance: "지구력",
      speed: "스피드",
      technique: "테크닉",
    };
    return goalNames[goal as keyof typeof goalNames] || goal;
  };

  const renderDistanceChart = () => {
    const data = records.map((record) => ({
      date: new Date(record.date).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      }),
      distance: record.distance,
      duration: record.duration,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => [
              name === "distance" ? formatDistance(value) : formatTime(value),
              name === "distance" ? "거리" : "시간",
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="distance"
            stroke="#8884d8"
            name="거리"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderDurationChart = () => {
    const data = records.map((record) => ({
      date: new Date(record.date).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      }),
      duration: record.duration,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value: number) => [formatTime(value), "시간"]} />
          <Bar dataKey="duration" fill="#82ca9d" name="시간" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderStyleChart = () => {
    const styleData = records.reduce((acc, record) => {
      const styleName = getStyleName(record.style);
      acc[styleName] = (acc[styleName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(styleData).map(([name, value]) => ({
      name,
      value,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderGoalChart = () => {
    const goalData = records.reduce((acc, record) => {
      const goalName = getGoalName(record.goal);
      acc[goalName] = (acc[goalName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(goalData).map(([name, value]) => ({
      name,
      value,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" name="횟수" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (type) {
      case "distance":
        return renderDistanceChart();
      case "duration":
        return renderDurationChart();
      case "style":
        return renderStyleChart();
      case "goal":
        return renderGoalChart();
      default:
        return renderDistanceChart();
    }
  };

  if (records.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 300,
          color: "#666",
          fontSize: "16px",
        }}
      >
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return <div style={{ width: "100%", height: 300 }}>{renderChart()}</div>;
};
