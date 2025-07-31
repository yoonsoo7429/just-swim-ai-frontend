import React from "react";
import { useAuth } from "../../hooks/useAuth";
import styles from "./DashboardHeader.module.scss";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
}) => {
  const { handleSignOut } = useAuth();

  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <button onClick={handleSignOut} className={styles.signOutButton}>
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
