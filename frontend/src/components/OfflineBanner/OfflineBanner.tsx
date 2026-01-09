import React from 'react';
import useNetworkStatus from '../../hooks/useNetworkStatus/useNetworkStatus';
import './OfflineBanner.css';

const OfflineBanner: React.FC = () => {
  const { isOnline, isReachable, lastChecked } = useNetworkStatus();

  if (isOnline && isReachable) return null;

  const title = !isOnline ? 'Ви офлайн' : (!isReachable ? 'Сервер недоступний' : '');
  const subtitle = !isOnline ? 'Працюєте офлайн — деякі функції недоступні' : 'Немає з’єднання з сервером — працюємо з кешу';

  return (
    <div className="bt-offline-banner" role="status">
      <div className="bt-offline-title">{title}</div>
      <div className="bt-offline-sub">{subtitle}</div>
    </div>
  );
};

export default OfflineBanner;
