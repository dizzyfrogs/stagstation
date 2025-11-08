import { useState, useEffect } from 'react';
import { Button, Card, Group, Stack, Text, Badge, Paper, Container, ThemeIcon, Divider, Loader, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCloud, IconServer, IconUpload, IconDownload, IconPlugConnected, IconPlugConnectedX } from '@tabler/icons-react';
import GameSwitcher from '../components/GameSwitcher';

export default function CloudSyncTab({ showModal }) {
  const [selectedGame, setSelectedGame] = useState('hollowknight');
  const [cloudConnected, setCloudConnected] = useState(false);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ cloudSync: {}, pcSavePath: '' });
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (cloudConnected) {
      // pass game explicitly to avoid race conditions
      refreshCloudSlots(selectedGame);
    } else {
      setSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGame, cloudConnected]);

  const loadSettings = async () => {
    try {
      const s = await window.electronAPI?.readSettings();
      if (s) setSettings(s);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const connectToCloud = async () => {
    const credentialsPath = settings.cloudSync?.googleDrive?.credentialsPath;
    if (!credentialsPath) {
      notifications.show({
        title: 'Missing Credentials',
        message: 'Please set Google Drive credentials path in Settings',
        color: 'red',
      });
      return;
    }

    setConnecting(true);
    try {
      const result = await window.electronAPI?.cloudConnect(credentialsPath);

      if (result?.needsAuth && result.userCode) {
        const confirmed = await showModal(
          'Google Drive Authorization',
          `Please visit:\n\n${result.verificationUrl}\n\nAnd enter this code:\n\n${result.userCode}\n\nClick OK to start waiting for authorization...`,
          false
        );

        if (confirmed) {
          notifications.show({
            title: 'Waiting for Authorization',
            message: `Visit ${result.verificationUrl} and enter code: ${result.userCode}`,
            color: 'cyan',
          });

          const authResult = await window.electronAPI?.cloudCompleteAuth(credentialsPath);

          if (authResult?.success) {
            setCloudConnected(true);
            notifications.show({
              title: 'Connected',
              message: 'Successfully connected to Google Drive!',
              color: 'cyan',
            });
          } else {
            setCloudConnected(false);
            notifications.show({
              title: 'Authentication Failed',
              message: authResult?.error || 'Unknown error',
              color: 'red',
            });
          }
        } else {
          setCloudConnected(false);
        }
      } else if (result?.success) {
        setCloudConnected(true);
        notifications.show({
          title: 'Connected',
          message: 'Successfully connected to Google Drive!',
          color: 'cyan',
        });
      } else {
        setCloudConnected(false);
        notifications.show({
          title: 'Connection Failed',
          message: result?.error || 'Unknown error',
          color: 'red',
        });
      }
    } catch (error) {
      setCloudConnected(false);
      notifications.show({
        title: 'Connection Error',
        message: error.message,
        color: 'red',
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnectFromCloud = () => {
    setCloudConnected(false);
    setSlots([]);
    notifications.show({
      title: 'Disconnected',
      message: 'Disconnected from Google Drive',
      color: 'cyan',
    });
  };

  const getPcSavePath = async () => {
    if (settings.pcSavePath) {
      return settings.pcSavePath;
    }
    const defaultPathResult = await window.electronAPI?.getDefaultSavePath(selectedGame);
    if (defaultPathResult?.success) {
      return defaultPathResult.path;
    }
    return '';
  };

  const refreshCloudSlots = async (gameOverride = null) => {
    if (!cloudConnected) {
      setSlots([]);
      return;
    }

    // use game override to avoid race conditions
    const gameToUse = gameOverride || selectedGame;
    
    setLoading(true);
    try {
      const pcPath = await getPcSavePath(gameToUse);
      const fetchedSlots = [];

      for (let slot = 1; slot <= 4; slot++) {
        const separator = pcPath.includes('\\') ? '\\' : '/';
        const localPath = pcPath ? `${pcPath}${separator}user${slot}.dat` : '';
        // use captured game value
        const comparison = await window.electronAPI?.cloudCompareSlot(gameToUse, slot, localPath);

        if (comparison?.success) {
          // check if no save exists
          const isNoSave = !comparison.comparison.localTime && !comparison.comparison.cloudTime;
          fetchedSlots.push({
            slot: slot,
            ...comparison.comparison,
            status: isNoSave ? 'no-save' : comparison.comparison.status,
          });
        }
      }
      
      // only update if still on same game
      if (gameToUse === selectedGame) {
        setSlots(fetchedSlots);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Error refreshing cloud slots: ${error.message}`,
        color: 'red',
      });
      if (gameToUse === selectedGame) {
        setSlots([]);
      }
    } finally {
      if (gameToUse === selectedGame) {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'in-sync': { color: 'green', label: 'In sync' },
      'local-newer': { color: 'yellow', label: 'Local newer' },
      'cloud-newer': { color: 'red', label: 'Cloud newer' },
      'local-only': { color: 'gray', label: 'Local only' },
      'cloud-only': { color: 'dark', label: 'Cloud only' },
      'no-save': { color: 'gray', label: 'No save' },
    };
    return badges[status] || { color: 'gray', label: 'Unknown' };
  };

  const formatDate = (date) => {
    if (!date || isNaN(new Date(date).getTime())) return 'N/A';
    const now = new Date();
    const d = new Date(date);
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  };

  const uploadSlot = async (slotNumber) => {
    const pcPath = await getPcSavePath(selectedGame);
    if (!pcPath) {
      notifications.show({
        title: 'Error',
        message: 'Could not find PC save path. Please set it in Settings or ensure the game is installed.',
        color: 'red',
      });
      return;
    }

    const separator = pcPath.includes('\\') ? '\\' : '/';
    const localPath = `${pcPath}${separator}user${slotNumber}.dat`;

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const defaultName = `PC - ${timestamp}`;

    const saveName = await showModal('Upload Save', 'Enter a name for this save backup:', true, defaultName);
    if (!saveName) return;

    const createBackup = settings.cloudSync?.createBackups !== false;

    try {
      notifications.show({
        title: 'Info',
        message: `Uploading slot ${slotNumber}...`,
        color: 'blue',
      });
      const result = await window.electronAPI?.cloudUploadSlot(
        selectedGame,
        slotNumber,
        localPath,
        saveName,
        createBackup
      );

      if (result?.success) {
        notifications.show({
          title: 'Success',
          message: `Successfully uploaded slot ${slotNumber} to cloud!`,
          color: 'green',
        });
        refreshCloudSlots();
      } else {
        notifications.show({
          title: 'Error',
          message: `Upload failed: ${result?.error}`,
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Upload error: ${error.message}`,
        color: 'red',
      });
    }
  };

  const downloadSlot = async (slotNumber, cloudFile) => {
    if (!cloudFile || !cloudFile.id) {
      notifications.show({
        title: 'Error',
        message: 'No cloud save found for this slot',
        color: 'red',
      });
      return;
    }

    const pcPath = await getPcSavePath(selectedGame);
    if (!pcPath) {
      notifications.show({
        title: 'Error',
        message: 'Could not find PC save path. Please set it in Settings or ensure the game is installed.',
        color: 'red',
      });
      return;
    }

    const separator = pcPath.includes('\\') ? '\\' : '/';
    const localPath = `${pcPath}${separator}user${slotNumber}.dat`;
    const createBackup = settings.cloudSync?.createBackups !== false;

    try {
      notifications.show({
        title: 'Info',
        message: `Downloading slot ${slotNumber}...`,
        color: 'blue',
      });
      const result = await window.electronAPI?.cloudDownloadSlot(
        selectedGame,
        slotNumber,
        localPath,
        cloudFile.saveId || '',
        cloudFile.id,
        cloudFile.entryName || `user${slotNumber}.dat`,
        createBackup
      );

      if (result?.success) {
        notifications.show({
          title: 'Success',
          message: `Successfully downloaded slot ${slotNumber} from cloud!`,
          color: 'green',
        });
        refreshCloudSlots();
      } else {
        notifications.show({
          title: 'Error',
          message: `Download failed: ${result?.error}`,
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Download error: ${error.message}`,
        color: 'red',
      });
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <GameSwitcher
          value={selectedGame}
          onChange={(value) => {
            setSelectedGame(value);
            if (cloudConnected) {
              refreshCloudSlots(value);
            }
          }}
        />

        {/* Connection Card */}
        <Card shadow="md" padding="xl" radius="lg" withBorder style={{ maxWidth: 500, margin: '0 auto' }}>
          <Stack gap="lg" align="center">
            <Box
              key={cloudConnected ? 'connected' : 'disconnected'}
              style={{
                animation: 'fadeInScale 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <ThemeIcon
                size={80}
                radius="xl"
                variant={cloudConnected ? 'gradient' : 'light'}
                gradient={cloudConnected ? { from: 'violet', to: 'blue', deg: 135 } : undefined}
                color={cloudConnected ? undefined : 'gray'}
                style={{
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {cloudConnected ? <IconPlugConnected size={44} /> : <IconPlugConnectedX size={44} />}
              </ThemeIcon>
            </Box>
            <Box
              key={`text-${cloudConnected}`}
              style={{
                animation: 'fadeIn 0.3s ease-out',
                minHeight: cloudConnected ? 0 : 'auto',
                overflow: 'hidden',
              }}
            >
              {!cloudConnected && (
                <Text size="sm" c="dimmed" ta="center">
                  Connect to Google Drive to sync your save files
                </Text>
              )}
            </Box>
            <Badge
              key={`badge-${cloudConnected}-${connecting}`}
              variant="dot"
              color={connecting ? 'yellow' : cloudConnected ? 'green' : 'gray'}
              size="lg"
              style={{
                animation: 'fadeInSlide 0.3s ease-out',
                transition: 'all 0.3s ease',
              }}
            >
              {connecting ? 'Connecting...' : cloudConnected ? 'Connected' : 'Not connected'}
            </Badge>
            <Button
              key={`button-${cloudConnected}`}
              leftSection={cloudConnected ? <IconPlugConnectedX size={18} /> : <IconPlugConnected size={18} />}
              onClick={cloudConnected ? disconnectFromCloud : connectToCloud}
              loading={connecting}
              size="lg"
              style={{
                minWidth: 250,
                animation: 'fadeInSlide 0.3s ease-out',
                transition: 'all 0.3s ease',
              }}
            >
              {cloudConnected ? 'Disconnect' : 'Connect to Google Drive'}
            </Button>
          </Stack>
          <style>{`
            @keyframes fadeInScale {
              from {
                opacity: 0;
                transform: scale(0.8);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes fadeInSlide {
              from {
                opacity: 0;
                transform: translateY(-5px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </Card>

        {/* Slots Grid */}
        {loading ? (
          <Stack align="center" py="xl">
            <Loader size="lg" />
            <Text c="dimmed" mt="md">
              Loading save slots...
            </Text>
          </Stack>
        ) : slots.length === 0 && cloudConnected ? (
          <Card shadow="md" padding="xl" radius="lg" withBorder>
            <Text ta="center" c="dimmed" size="lg">
              No saves found
            </Text>
          </Card>
        ) : (
          <Group gap="lg" justify="center" mt="lg">
            {slots.map((slotData) => {
              const statusBadge = getStatusBadge(slotData.status);
              return (
                <Card
                  key={slotData.slot}
                  shadow="md"
                  padding="xl"
                  radius="lg"
                  withBorder
                  style={{
                    minWidth: 320,
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Stack gap="lg">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={700} size="xl" mb={4}>
                          Slot {slotData.slot}
                        </Text>
                        <Badge color={statusBadge.color} size="lg" variant="light">
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </Group>
                    <Divider />
                    <Stack gap="sm">
                      <Group gap="xs">
                        <IconServer size={18} style={{ color: 'var(--mantine-color-violet-6)' }} />
                        <div>
                          <Text size="xs" c="dimmed" fw={500}>
                            Local
                          </Text>
                          <Text size="sm">{formatDate(slotData.localTime)}</Text>
                        </div>
                      </Group>
                      <Group gap="xs">
                        <IconCloud size={18} style={{ color: 'var(--mantine-color-violet-6)' }} />
                        <div>
                          <Text size="xs" c="dimmed" fw={500}>
                            Cloud
                          </Text>
                          <Text size="sm">{formatDate(slotData.cloudTime)}</Text>
                        </div>
                      </Group>
                    </Stack>
                    <Group grow mt="md">
                      <Button
                        leftSection={<IconUpload size={18} />}
                        onClick={() => uploadSlot(slotData.slot)}
                        disabled={!cloudConnected || !slotData.localTime || slotData.status === 'no-save' || slotData.status === 'cloud-only'}
                        variant="light"
                        size="sm"
                        style={{ fontSize: '13px' }}
                      >
                        Upload
                      </Button>
                      <Button
                        leftSection={<IconDownload size={18} />}
                        onClick={() => downloadSlot(slotData.slot, slotData.cloudFile)}
                        disabled={!cloudConnected || !slotData.cloudFile?.id}
                        variant="light"
                        size="sm"
                        style={{ fontSize: '13px' }}
                      >
                        Download
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              );
            })}
          </Group>
        )}
      </Stack>
    </Container>
  );
}
