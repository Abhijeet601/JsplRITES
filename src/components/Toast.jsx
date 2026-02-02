import React from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
  if (!message) return null;
  const colors = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600'
  };

  return (
    <div className={`fixed right-6 bottom-6 z-50 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg`} role="status">
      <div className="flex items-center gap-3">
        <div className="flex-1">{message}</div>
        {onClose && (
          <button onClick={onClose} className="opacity-80 hover:opacity-100">✕</button>
        )}
      </div>
    </div>
  );
};

export default Toast;
