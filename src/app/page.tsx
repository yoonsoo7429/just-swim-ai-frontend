"use client";
import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    date: "",
    distance: 0,
    style: "freestyle",
    duration: 0,
    frequency_per_week: 1,
    goal: "endurance",
  });
  const [loading, setLoading] = useState(false);
  const [recommend, setRecommend] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setRecommend(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("로그인이 필요합니다.");
      // 기록 저장
      const recordRes = await fetch("http://localhost:3000/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!recordRes.ok) {
        const data = await recordRes.json();
        throw new Error(data.message || "기록 저장 실패");
      }
      setSuccess("기록이 저장되었습니다.");
      // 추천 요청
      const recommendRes = await fetch("http://localhost:3000/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!recommendRes.ok) {
        const data = await recommendRes.json();
        throw new Error(data.message || "추천 실패");
      }
      const recommendData = await recommendRes.json();
      setRecommend(recommendData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "40px auto",
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 8,
      }}
    >
      <h2>수영 기록 입력 및 맞춤 추천</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>날짜</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>거리(m)</label>
          <input
            type="number"
            name="distance"
            value={form.distance}
            onChange={handleChange}
            required
            min={0}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>영법</label>
          <select
            name="style"
            value={form.style}
            onChange={handleChange}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          >
            <option value="freestyle">자유형</option>
            <option value="backstroke">배영</option>
            <option value="breaststroke">평영</option>
            <option value="butterfly">접영</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>시간(분)</label>
          <input
            type="number"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            required
            min={0}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>주간 빈도(회)</label>
          <input
            type="number"
            name="frequency_per_week"
            value={form.frequency_per_week}
            onChange={handleChange}
            required
            min={1}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>목표</label>
          <select
            name="goal"
            value={form.goal}
            onChange={handleChange}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          >
            <option value="endurance">지구력</option>
            <option value="speed">스피드</option>
            <option value="technique">테크닉</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10 }}
        >
          {loading ? "처리 중..." : "기록 저장 및 추천 받기"}
        </button>
        {success && (
          <div style={{ color: "green", marginTop: 12 }}>{success}</div>
        )}
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      </form>
      {recommend && (
        <div
          style={{
            marginTop: 32,
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h3>맞춤 추천 결과</h3>
          <div>
            <b>수영 훈련:</b> {recommend.swim_training}
          </div>
          <div>
            <b>지상 운동:</b> {recommend.dryland_training}
          </div>
        </div>
      )}
    </div>
  );
}
