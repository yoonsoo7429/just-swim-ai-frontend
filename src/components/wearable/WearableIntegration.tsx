"use client";

import React, { useState, useEffect } from "react";
import { wearableApi } from "../../utils/api";
import styles from "./WearableIntegration.module.scss";

interface WearableProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
}

interface WearableConnection {
  id: number;
  provider: string;
  status: string;
  lastSyncAt?: string;
}

interface WearableStats {
  totalActivities: number;
  totalDistance: number;
  totalDuration: number;
  totalCalories: number;
  averageHeartRate: number;
  mostUsedStyle: string;
  lastActivityDate?: string;
}

export default function WearableIntegration() {
  const [providers, setProviders] = useState<WearableProvider[]>([]);
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [stats, setStats] = useState<{ [key: string]: WearableStats }>({});

  useEffect(() => {
    loadProviders();
    loadConnections();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await wearableApi.getProviders();
      setProviders(response.providers);
    } catch (err: any) {
      setError("웨어러블 기기 목록을 불러오는데 실패했습니다.");
    }
  };

  const loadConnections = async () => {
    try {
      const response = await wearableApi.getConnections();
      setConnections(response);

      // 각 연결에 대한 통계 로드
      const statsData: { [key: string]: WearableStats } = {};
      for (const connection of response) {
        try {
          const statsResponse = await wearableApi.getStats(connection.provider);
          statsData[connection.provider] = statsResponse;
        } catch (err) {
          console.error(
            `Failed to load stats for ${connection.provider}:`,
            err
          );
        }
      }
      setStats(statsData);
    } catch (err: any) {
      setError("연결된 기기 목록을 불러오는데 실패했습니다.");
    }
  };

  const handleConnect = async (provider: string) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 실제 구현에서는 OAuth 인증 플로우를 구현해야 합니다
      // 여기서는 모의 연결을 시뮬레이션합니다
      await wearableApi.connect({
        provider,
        accessToken: "mock_token",
        externalUserId: "mock_user_id",
      });

      setSuccess(`${provider} 기기가 성공적으로 연결되었습니다!`);
      await loadConnections();
    } catch (err: any) {
      setError(`${provider} 기기 연결에 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (provider: string) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await wearableApi.disconnect(provider);
      setSuccess(`${provider} 기기 연결이 해제되었습니다.`);
      await loadConnections();
    } catch (err: any) {
      setError(`${provider} 기기 연결 해제에 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (provider: string) => {
    setSyncLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await wearableApi.sync({
        provider,
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30일 전
        endDate: new Date().toISOString(),
      });

      setSuccess(
        `${provider}에서 ${response.newActivities}개의 새로운 활동을 동기화했습니다.`
      );
      await loadConnections();
    } catch (err: any) {
      setError(`${provider} 데이터 동기화에 실패했습니다: ${err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const getConnectionStatus = (provider: string) => {
    const connection = connections.find((c) => c.provider === provider);
    return connection?.status || "disconnected";
  };

  const isConnected = (provider: string) => {
    return getConnectionStatus(provider) === "connected";
  };

  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}시간 ${minutes}분`;
  };

  return (
    <div className={styles.wearableIntegration}>
      <h2>웨어러블 기기 연동</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.providers}>
        <h3>지원하는 웨어러블 기기</h3>
        <div className={styles.providerGrid}>
          {providers.map((provider) => (
            <div key={provider.id} className={styles.providerCard}>
              <div className={styles.providerHeader}>
                <span className={styles.providerIcon}>{provider.icon}</span>
                <h4>{provider.name}</h4>
                <div
                  className={`${styles.status} ${
                    isConnected(provider.id)
                      ? styles.connected
                      : styles.disconnected
                  }`}
                >
                  {isConnected(provider.id) ? "연결됨" : "연결 안됨"}
                </div>
              </div>

              <p className={styles.description}>{provider.description}</p>

              <div className={styles.features}>
                {provider.features.map((feature, index) => (
                  <span key={index} className={styles.feature}>
                    {feature}
                  </span>
                ))}
              </div>

              {isConnected(provider.id) ? (
                <div className={styles.connectedActions}>
                  <button
                    onClick={() => handleSync(provider.id)}
                    disabled={syncLoading}
                    className={styles.syncButton}
                  >
                    {syncLoading ? "동기화 중..." : "데이터 동기화"}
                  </button>
                  <button
                    onClick={() => handleDisconnect(provider.id)}
                    disabled={loading}
                    className={styles.disconnectButton}
                  >
                    연결 해제
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect(provider.id)}
                  disabled={loading}
                  className={styles.connectButton}
                >
                  {loading ? "연결 중..." : "기기 연결"}
                </button>
              )}

              {isConnected(provider.id) && stats[provider.id] && (
                <div className={styles.stats}>
                  <h5>동기화된 데이터</h5>
                  <div className={styles.statsGrid}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>총 활동</span>
                      <span className={styles.statValue}>
                        {stats[provider.id].totalActivities}회
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>총 거리</span>
                      <span className={styles.statValue}>
                        {formatDistance(stats[provider.id].totalDistance)}
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>총 시간</span>
                      <span className={styles.statValue}>
                        {formatDuration(stats[provider.id].totalDuration)}
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>평균 심박수</span>
                      <span className={styles.statValue}>
                        {Math.round(stats[provider.id].averageHeartRate)}bpm
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>선호 영법</span>
                      <span className={styles.statValue}>
                        {stats[provider.id].mostUsedStyle}
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>총 칼로리</span>
                      <span className={styles.statValue}>
                        {Math.round(stats[provider.id].totalCalories)}kcal
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.info}>
        <h3>웨어러블 기기 연동의 장점</h3>
        <ul>
          <li>자동으로 수영 데이터를 수집하여 수동 입력이 필요 없습니다</li>
          <li>정확한 심박수, 스트로크 레이트 등 상세한 데이터를 제공합니다</li>
          <li>더 정확한 AI 추천을 받을 수 있습니다</li>
          <li>운동 패턴을 자동으로 분석하여 개인화된 훈련 계획을 제공합니다</li>
        </ul>
      </div>
    </div>
  );
}
