"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import WearableIntegration from "../../components/wearable/WearableIntegration";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import styles from "./mypage.module.scss";

export default function MyPage() {
  const { isSignedIn, isLoading, user, error, handleSignOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "profile" | "wearable" | "settings"
  >("profile");

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.push("/signin");
    }
  }, [isSignedIn, isLoading, router]);

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner size="large" text="사용자 정보를 불러오는 중..." />
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!isSignedIn) {
    return null;
  }

  // 에러가 있는 경우
  if (error) {
    return (
      <div className={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const ProfileTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>👤 프로필 정보</h2>
        <div className={styles.profileCard}>
          <div className={styles.profileInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>이름:</span>
              <span className={styles.value}>{user?.nickname || "사용자"}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>이메일:</span>
              <span className={styles.value}>
                {user?.email || "이메일 없음"}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>가입일:</span>
              <span className={styles.value}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "알 수 없음"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📊 계정 통계</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏊‍♂️</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>0</div>
              <div className={styles.statLabel}>총 수영 기록</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>0</div>
              <div className={styles.statLabel}>달성한 목표</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>0</div>
              <div className={styles.statLabel}>획득한 업적</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⌚</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>0</div>
              <div className={styles.statLabel}>연결된 기기</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>⚙️ 계정 설정</h2>
        <div className={styles.settingsCard}>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingTitle}>프로필 수정</h3>
              <p className={styles.settingDescription}>
                이름, 이메일 등 기본 정보를 수정할 수 있습니다.
              </p>
            </div>
            <button className={styles.settingButton}>수정</button>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingTitle}>비밀번호 변경</h3>
              <p className={styles.settingDescription}>
                계정 보안을 위해 비밀번호를 변경할 수 있습니다.
              </p>
            </div>
            <button className={styles.settingButton}>변경</button>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingTitle}>알림 설정</h3>
              <p className={styles.settingDescription}>
                훈련 알림, 업적 달성 알림 등을 설정할 수 있습니다.
              </p>
            </div>
            <button className={styles.settingButton}>설정</button>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingTitle}>데이터 내보내기</h3>
              <p className={styles.settingDescription}>
                수영 기록과 통계 데이터를 파일로 내보낼 수 있습니다.
              </p>
            </div>
            <button className={styles.settingButton}>내보내기</button>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>🚨 계정 관리</h2>
        <div className={styles.dangerZone}>
          <div className={styles.dangerItem}>
            <div className={styles.dangerInfo}>
              <h3 className={styles.dangerTitle}>계정 삭제</h3>
              <p className={styles.dangerDescription}>
                모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
              </p>
            </div>
            <button className={styles.dangerButton}>삭제</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button
            onClick={() => router.push("/")}
            className={styles.backButton}
          >
            ← 대시보드로 돌아가기
          </button>
          <h1 className={styles.title}>마이페이지</h1>
          <button onClick={handleSignOut} className={styles.signOutButton}>
            로그아웃
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "profile" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("profile")}
          >
            👤 프로필
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "wearable" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("wearable")}
          >
            ⌚ 웨어러블
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "settings" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ 설정
          </button>
        </div>

        <div className={styles.tabContainer}>
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "wearable" && <WearableIntegration />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
