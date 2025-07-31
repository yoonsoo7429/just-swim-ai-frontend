import React from "react";
import styles from "./ErrorMessage.module.scss";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = "",
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.icon}>⚠️</div>
      <div className={styles.content}>
        <h3 className={styles.title}>오류가 발생했습니다</h3>
        <p className={styles.message}>{message}</p>
        {onRetry && (
          <button onClick={onRetry} className={styles.retryButton}>
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
