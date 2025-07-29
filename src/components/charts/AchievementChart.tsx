import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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

interface AchievementChartProps {
  achievements: Achievement[];
  type: "level" | "progress" | "completion";
}

const COLORS = ["#cd7f32", "#c0c0c0", "#ffd700", "#e5e4e2"];

export const AchievementChart: React.FC<AchievementChartProps> = ({
  achievements,
  type,
}) => {
  const getLevelName = (level: string) => {
    const levelNames = {
      bronze: "브론즈",
      silver: "실버",
      gold: "골드",
      platinum: "플래티넘",
    };
    return levelNames[level as keyof typeof levelNames] || level;
  };

  const renderLevelChart = () => {
    const levelData = achievements.reduce((acc, achievement) => {
      const levelName = getLevelName(achievement.level);
      if (achievement.isUnlocked) {
        acc[levelName] = (acc[levelName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(levelData).map(([name, value]) => ({
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
              `${name} ${((percent || 0) * 100).toFixed(0)}%`
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
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderProgressChart = () => {
    const progressData = achievements
      .filter((achievement) => !achievement.isUnlocked)
      .map((achievement) => ({
        title: achievement.title,
        progress: Math.round((achievement.progress / achievement.target) * 100),
        current: achievement.progress,
        target: achievement.target,
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 10); // 상위 10개만 표시

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={progressData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="title" width={120} />
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value}% (${props.payload.current}/${props.payload.target})`,
              "진행률",
            ]}
          />
          <Bar dataKey="progress" fill="#82ca9d" name="진행률" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderCompletionChart = () => {
    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
    const totalCount = achievements.length;
    const lockedCount = totalCount - unlockedCount;

    const data = [
      { name: "달성", value: unlockedCount, fill: "#82ca9d" },
      { name: "미달성", value: lockedCount, fill: "#ffc658" },
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) =>
              `${name} ${value}개 (${((percent || 0) * 100).toFixed(0)}%)`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (type) {
      case "level":
        return renderLevelChart();
      case "progress":
        return renderProgressChart();
      case "completion":
        return renderCompletionChart();
      default:
        return renderLevelChart();
    }
  };

  if (achievements.length === 0) {
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
