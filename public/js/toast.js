/**
 * Toast Notification System
 * Displays temporary toast notifications for success, error, and info messages
 */

function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  const toastId = `toast-${Date.now()}`;
  toast.id = toastId;
  
  // Determine styling based on type
  let backgroundColor;
  switch (type) {
    case 'success':
      backgroundColor = '#4caf50';
      break;
    case 'error':
      backgroundColor = '#f44336';
      break;
    case 'warning':
      backgroundColor = '#ff9800';
      break;
    case 'info':
    default:
      backgroundColor = '#2196f3';
  }

  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  const styles = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 4px;
    background-color: ${backgroundColor};
    color: white;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease-out;
  `;
  
  toast.style.cssText = styles;
  document.body.appendChild(toast);

  // Auto-remove after duration
  const removeTimer = setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
      if (document.getElementById(toastId)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, duration);

  // Return toast element and clear timer function for manual removal
  return {
    element: toast,
    remove: () => {
      clearTimeout(removeTimer);
      if (document.getElementById(toastId)) {
        document.body.removeChild(toast);
      }
    }
  };
}

// Add toast animations if they're not already defined in the page
if (!document.getElementById('toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Export for use in other scripts
window.showToast = showToast;
