import { useState, useEffect } from 'react';
import { Card, TextInput, Button, Group, Stack, Text, Checkbox, Radio, Container, Divider, Paper, Badge, Title, Alert, Box, Transition } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFolder, IconDeviceDesktop, IconCloud, IconAlertTriangle } from '@tabler/icons-react';

export default function SettingsTab() {
  const [settings, setSettings] = useState({
    pcSavePath: '',
    switchJKSVPath: '',
    cloudSync: {
      enabled: false,
      provider: 'google',
      createBackups: true,
      backupPath: '',
      metaFile: {
        enabled: true,
        mode: 'auto',
        customPath: '',
      },
      googleDrive: {
        credentialsPath: '',
        folderId: '',
      },
    },
  });
  const [originalSettings, setOriginalSettings] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [defaultBackupPath, setDefaultBackupPath] = useState('');
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    loadSettings();
    loadDefaultBackupPath();
  }, []);

  const loadDefaultBackupPath = async () => {
    try {
      const result = await window.electronAPI?.getUserDataPath();
      if (result?.success) {
        setDefaultBackupPath(result.path);
      }
    } catch (error) {
      console.error('Error loading default backup path:', error);
    }
  };

  useEffect(() => {
    if (originalSettings) {
      const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasUnsavedChanges(hasChanges);
      // reset alert when settings change
      if (hasChanges) {
        setAlertDismissed(false);
      }
    }
  }, [settings, originalSettings]);

  const loadSettings = async () => {
    try {
      const s = await window.electronAPI?.readSettings();
      if (s) {
        setSettings(s);
        setOriginalSettings(JSON.parse(JSON.stringify(s)));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const result = await window.electronAPI?.writeSettings(settings);
      if (result?.success) {
        setOriginalSettings(JSON.parse(JSON.stringify(settings)));
        setHasUnsavedChanges(false);
        setAlertDismissed(false);
        notifications.show({
          title: 'Success',
          message: 'Settings saved successfully!',
          color: 'cyan',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result?.error || 'Unknown error',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Unknown error',
        color: 'red',
      });
    }
  };

  const restoreOriginalSettings = () => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      setHasUnsavedChanges(false);
      setAlertDismissed(false);
      notifications.show({
        title: 'Restored',
        message: 'Settings restored to original values',
        color: 'cyan',
      });
    }
  };

  const handleBrowse = async (field, isDirectory = true) => {
    const path = isDirectory
      ? await window.electronAPI?.selectDirectory()
      : await window.electronAPI?.selectFile();
    if (path) {
      if (field.includes('.')) {
        const parts = field.split('.');
        setSettings((prev) => {
          const newSettings = { ...prev };
          let current = newSettings;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = path;
          return newSettings;
        });
      } else {
        setSettings((prev) => ({ ...prev, [field]: path }));
      }
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* Save Paths Section */}
        <Card shadow="md" padding="xl" radius="lg" withBorder>
          <Stack gap="lg">
            <Group gap="md" mb="xs">
              <IconDeviceDesktop size={32} style={{ color: 'var(--mantine-color-violet-6)' }} />
              <Title order={3} size="h3" fw={700}>
                Save File Paths
              </Title>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
              Configure the default paths where Stagstation will look for save files.
            </Text>

            <Divider />

            <Stack gap="lg">
              <div>
                <Text
                  fw={600}
                  size="md"
                  mb="xs"
                  style={{
                    background: 'linear-gradient(135deg, #8b6fa8 0%, #4a90e2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  PC Save Path
                </Text>
                <Group gap="sm" mb="xs">
                  <TextInput
                    placeholder="C:\Users\...\AppData\LocalLow\Team Cherry\Hollow Knight"
                    value={settings.pcSavePath}
                    onChange={(e) => setSettings((prev) => ({ ...prev, pcSavePath: e.target.value }))}
                    style={{ flex: 1 }}
                    size="md"
                  />
                  <Button
                    leftSection={<IconFolder size={18} />}
                    onClick={() => handleBrowse('pcSavePath', true)}
                    size="md"
                  >
                    Browse
                  </Button>
                </Group>
                <Text size="xs" c="dimmed" ml={4}>
                  Path to PC save directory (contains user1.dat, user2.dat, etc.)
                </Text>
              </div>

              <div>
                <Text
                  fw={600}
                  size="md"
                  mb="xs"
                  style={{
                    background: 'linear-gradient(135deg, #8b6fa8 0%, #4a90e2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Switch JKSV Path
                </Text>
                <Group gap="sm" mb="xs">
                  <TextInput
                    placeholder="D:\JKSV\Hollow Knight Silksong"
                    value={settings.switchJKSVPath}
                    onChange={(e) => setSettings((prev) => ({ ...prev, switchJKSVPath: e.target.value }))}
                    style={{ flex: 1 }}
                    size="md"
                  />
                  <Button
                    leftSection={<IconFolder size={18} />}
                    onClick={() => handleBrowse('switchJKSVPath', true)}
                    size="md"
                  >
                    Browse
                  </Button>
                </Group>
                <Text size="xs" c="dimmed" ml={4}>
                  Path to Switch JKSV directory (SD card mount point)
                </Text>
              </div>
            </Stack>
          </Stack>
        </Card>

        {/* Cloud Sync Section */}
        <Card shadow="md" padding="xl" radius="lg" withBorder>
          <Stack gap="lg">
            <Group gap="md" mb="xs">
              <IconCloud size={32} style={{ color: 'var(--mantine-color-violet-6)' }} />
              <Title order={3} size="h3" fw={700}>
                Cloud Sync Settings
              </Title>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
              Configure Google Drive integration and backup options.
            </Text>

            <Divider />

            <Stack gap="lg">
              <div>
                <Text
                  fw={600}
                  size="md"
                  mb="xs"
                  style={{
                    background: 'linear-gradient(135deg, #8b6fa8 0%, #4a90e2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Google Drive Credentials
                </Text>
                <Group gap="sm" mb="xs">
                  <TextInput
                    placeholder="Path to client_secret.json"
                    value={settings.cloudSync?.googleDrive?.credentialsPath || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        cloudSync: {
                          ...prev.cloudSync,
                          googleDrive: {
                            ...prev.cloudSync.googleDrive,
                            credentialsPath: e.target.value,
                          },
                        },
                      }))
                    }
                    style={{ flex: 1 }}
                    size="md"
                  />
                  <Button
                    leftSection={<IconFolder size={18} />}
                    onClick={() => handleBrowse('cloudSync.googleDrive.credentialsPath', false)}
                    size="md"
                  >
                    Browse
                  </Button>
                </Group>
                <Text size="xs" c="dimmed" ml={4}>
                  Path to your Google Drive OAuth credentials file (client_secret.json)
                </Text>
              </div>

              <Divider />

              <div>
                <Checkbox
                  label={
                    <Text fw={600} size="md">
                      Include .nx_save_meta.bin in uploads
                    </Text>
                  }
                  checked={settings.cloudSync?.metaFile?.enabled !== false}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      cloudSync: {
                        ...prev.cloudSync,
                        metaFile: {
                          ...prev.cloudSync.metaFile,
                          enabled: e.target.checked,
                        },
                      },
                    }))
                  }
                  mb="xs"
                />
                <Text size="xs" c="dimmed" mb="md" ml={28}>
                  Automatically include meta file to prevent "Backup contains no meta file!" errors in JKSV
                </Text>
                {settings.cloudSync?.metaFile?.enabled !== false && (
                  <Stack gap="md" ml={28}>
                    <Text size="sm" fw={500} c="dimmed">
                      Meta File Source:
                    </Text>
                    <Radio.Group
                      value={settings.cloudSync?.metaFile?.mode || 'auto'}
                      onChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          cloudSync: {
                            ...prev.cloudSync,
                            metaFile: {
                              ...prev.cloudSync.metaFile,
                              mode: value,
                            },
                          },
                        }))
                      }
                    >
                      <Stack gap="sm">
                        <Radio value="auto" label="Auto-pull from most recent cloud save" />
                        <Radio value="custom" label="Use custom file" />
                      </Stack>
                    </Radio.Group>
                    {settings.cloudSync?.metaFile?.mode === 'custom' && (
                      <Group gap="sm" mt="sm">
                        <TextInput
                          placeholder="Path to .nx_save_meta.bin file"
                          value={settings.cloudSync?.metaFile?.customPath || ''}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              cloudSync: {
                                ...prev.cloudSync,
                                metaFile: {
                                  ...prev.cloudSync.metaFile,
                                  customPath: e.target.value,
                                },
                              },
                            }))
                          }
                          style={{ flex: 1 }}
                          size="md"
                        />
                        <Button
                          leftSection={<IconFolder size={18} />}
                          onClick={() => handleBrowse('cloudSync.metaFile.customPath', false)}
                          size="md"
                        >
                          Browse
                        </Button>
                      </Group>
                    )}
                  </Stack>
                )}
              </div>

              <Divider />

              <div>
                <Checkbox
                  label={
                    <Text fw={600} size="md">
                      Create backups before cloud sync
                    </Text>
                  }
                  checked={settings.cloudSync?.createBackups !== false}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      cloudSync: {
                        ...prev.cloudSync,
                        createBackups: e.target.checked,
                      },
                    }))
                  }
                  mb="xs"
                />
                <Text size="xs" c="dimmed" mb="md" ml={28}>
                  Automatically backup local saves before overwriting with cloud versions
                </Text>
                {settings.cloudSync?.createBackups !== false && (
                  <Stack gap="sm" ml={28}>
                    <Text size="sm" fw={500} c="dimmed">
                      Backup Directory:
                    </Text>
                    <Group gap="sm">
                      <TextInput
                        placeholder="Leave empty for default location"
                        value={settings.cloudSync?.backupPath || ''}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            cloudSync: {
                              ...prev.cloudSync,
                              backupPath: e.target.value,
                            },
                          }))
                        }
                        style={{ flex: 1 }}
                        size="md"
                      />
                      <Button
                        leftSection={<IconFolder size={18} />}
                        onClick={() => handleBrowse('cloudSync.backupPath', true)}
                        size="md"
                      >
                        Browse
                      </Button>
                    </Group>
                    <Text size="xs" c="dimmed">
                      Directory where backups will be saved{defaultBackupPath ? ` (default: ${defaultBackupPath}/backups/<game>)` : ' (default: AppData/Stagstation/backups)'}
                    </Text>
                  </Stack>
                )}
              </div>
            </Stack>
          </Stack>
        </Card>

        {/* Unsaved Changes Floating Alert */}
        <Transition mounted={hasUnsavedChanges && !alertDismissed} transition="slide-left" duration={300} timingFunction="ease">
          {(styles) => (
            <Box
              style={{
                position: 'fixed',
                top: 60,
                right: 20,
                zIndex: 1000,
                maxWidth: 380,
                ...styles,
              }}
            >
              <Alert
                icon={<IconAlertTriangle size={20} />}
                title="Unsaved Changes"
                color="orange"
                variant="light"
                radius="md"
                withCloseButton
                onClose={() => setAlertDismissed(true)}
                styles={{
                  root: {
                    backgroundColor: 'rgba(10, 10, 18, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 165, 0, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 165, 0, 0.1)',
                  },
                  title: {
                    fontWeight: 700,
                    color: 'var(--mantine-color-orange-6)',
                  },
                  message: {
                    color: 'var(--mantine-color-dark-2)',
                  },
                }}
              >
                <Stack gap="sm" mt="xs">
                  <Text size="sm" c="dimmed">
                    Your settings have been modified. Don't forget to save!
                  </Text>
                  <Group gap="xs" mt="xs">
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={restoreOriginalSettings}
                      style={{
                        color: 'var(--mantine-color-dark-2)',
                      }}
                    >
                      Discard
                    </Button>
                    <Button
                      size="xs"
                      onClick={saveSettings}
                      style={{
                        background: 'linear-gradient(135deg, #8b6fa8 0%, #4a90e2 100%)',
                        border: 'none',
                      }}
                    >
                      Save Settings
                    </Button>
                  </Group>
                </Stack>
              </Alert>
            </Box>
          )}
        </Transition>
      </Stack>
    </Container>
  );
}
