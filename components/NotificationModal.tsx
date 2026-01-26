import React from 'react';

interface NotificationModalProps {
  show: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  onConfirm: () => void;
  onClose?: () => void;
  showCancel?: boolean;
  cancelText?: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  show,
  title,
  message,
  type = 'info',
  confirmText = '确定',
  onConfirm,
  onClose,
  showCancel = false,
  cancelText = '取消',
}) => {
  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="fas fa-check-circle text-5xl text-green-500"></i>;
      case 'error':
        return <i className="fas fa-times-circle text-5xl text-red-500"></i>;
      case 'warning':
        return <i className="fas fa-exclamation-triangle text-5xl text-yellow-500"></i>;
      default:
        return <i className="fas fa-info-circle text-5xl text-blue-500"></i>;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          button: 'bg-green-600 hover:bg-green-700 shadow-green-200',
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          button: 'bg-red-600 hover:bg-red-700 shadow-red-200',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          button: 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-200',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
        };
    }
  };

  const colors = getColors();

  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onConfirm();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon & Title */}
        <div className={`${colors.bg} ${colors.border} border-b px-8 py-8 text-center`}>
          <div className="mb-4 flex justify-center">
            {getIcon()}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>

        {/* Message */}
        <div className="px-8 py-6">
          <p className="text-gray-600 text-center leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="px-8 py-6 bg-gray-50 flex gap-3">
          {showCancel && (
            <button 
              onClick={handleClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={handleConfirm}
            className={`flex-1 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg ${colors.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
