import React from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  const colors = {
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-900'
  };

  return (
    <div
      className={`fixed right-4 bottom-4 z-50 max-w-sm rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${colors[type]}`}
      role="status"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 text-sm font-medium">{message}</div>
        {onClose && (
          <button onClick={onClose} className="opacity-60 hover:opacity-100">
            x
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
