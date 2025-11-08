import { useState, useEffect } from 'react';
import { Modal as MantineModal, TextInput, Button, Group, Stack, Text } from '@mantine/core';

export default function Modal({ modal, handleConfirm, handleCancel }) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (modal.isOpen) {
      setInputValue(modal.defaultValue || '');
    }
  }, [modal.isOpen, modal.defaultValue]);

  const onConfirm = () => {
    const value = modal.showInput ? inputValue.trim() : true;
    handleConfirm(value || null);
    setInputValue('');
  };

  const onCancel = () => {
    handleCancel();
    setInputValue('');
  };

  return (
    <MantineModal
      opened={modal.isOpen}
      onClose={onCancel}
      title={modal.title}
      centered
    >
      <Stack gap="md">
        <Text>{modal.message}</Text>
        {modal.showInput && (
          <TextInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onConfirm();
              } else if (e.key === 'Escape') {
                onCancel();
              }
            }}
            autoFocus
            placeholder="Enter value..."
          />
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            OK
          </Button>
        </Group>
      </Stack>
    </MantineModal>
  );
}
