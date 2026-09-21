import React, { useEffect } from 'react';

type NoticeType = 'success' | 'error' | 'info' | 'warning';

interface NoticeProps {
  message: string;
  type?: NoticeType;
  duration?: number;
  reload?: boolean;
  onClose: () => void;
}

const Notice: React.FC<NoticeProps> = ({
  message,
  type = 'success',
  duration = 1000,
  reload = false,
  onClose,
}) => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onClose();

      if (reload) {
        window.location.reload();
      }
    }, duration);

    return () => window.clearTimeout(timer);
  }, [duration, reload, onClose]);

  const styles: Record<NoticeType, string> = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
    warning: 'bg-yellow-500 text-black',
  };

  return (
    <div
      className={`fixed right-5 top-5 z-[9999] flex min-w-[280px] max-w-sm items-center justify-between gap-4 rounded-lg px-4 py-3 shadow-lg ${styles[type]}`}
      role="alert"
    >
      <span className="text-sm font-medium">{message}</span>

      <button
        type="button"
        onClick={onClose}
        className="text-xl leading-none opacity-80 hover:opacity-100"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default Notice;