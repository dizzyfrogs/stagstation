import { useState, useCallback, useRef } from 'react';

export function useModal() {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    showInput: false,
    defaultValue: '',
  });
  const resolveRef = useRef(null);

  const showModal = useCallback((title, message, showInput = false, defaultValue = '') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModal({
        isOpen: true,
        title,
        message,
        showInput,
        defaultValue: defaultValue || '',
      });
    });
  }, []);

  const handleConfirm = useCallback((value) => {
    if (resolveRef.current) {
      resolveRef.current(value || null);
      resolveRef.current = null;
    }
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(null);
      resolveRef.current = null;
    }
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  return { modal, showModal, handleConfirm, handleCancel };
}

