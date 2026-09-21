import { useCallback, useState } from 'react';

type NoticeType = 'success' | 'error' | 'info' | 'warning';

interface NoticeState {
  message: string;
  type: NoticeType;
}

export function useNotice() {
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const showNotice = useCallback(
    (message: string, type: NoticeType = 'success') => {
      setNotice({
        message,
        type,
      });
    },
    []
  );

  const hideNotice = useCallback(() => {
    setNotice(null);
  }, []);

  return {
    notice,
    showNotice,
    hideNotice,
  };
}