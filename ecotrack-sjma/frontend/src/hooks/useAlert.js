import { useState, useCallback } from 'react';

export function useAlert() {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  }, []);

  const showSuccess = useCallback((message) => {
    showAlert('success', message);
  }, [showAlert]);

  const showError = useCallback((message) => {
    showAlert('error', message);
  }, [showAlert]);

  const showWarning = useCallback((message) => {
    showAlert('warning', message);
  }, [showAlert]);

  const showInfo = useCallback((message) => {
    showAlert('info', message);
  }, [showAlert]);

  const clearAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return {
    alert,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAlert
  };
}
