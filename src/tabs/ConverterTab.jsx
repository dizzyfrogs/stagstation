import { useState, useEffect } from 'react';
import { Button, Card, TextInput, Group, Stack, Text, Paper, Badge, Container, ThemeIcon, Divider, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFolder, IconServer, IconCalendar, IconArrowRight, IconCheck, IconDeviceDesktop, IconDeviceGamepad } from '@tabler/icons-react';
import GameSwitcher from '../components/GameSwitcher';

export default function ConverterTab() {
  const [selectedGame, setSelectedGame] = useState('hollowknight');
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [inputFilePath, setInputFilePath] = useState('');
  const [outputFilePath, setOutputFilePath] = useState('');
  const [detectedFiles, setDetectedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [settings, setSettings] = useState({ pcSavePath: '', switchJKSVPath: '' });
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (selectedGame && selectedDirection) {
      autoDetectSaveFiles();
    }
  }, [selectedGame, selectedDirection]);

  const loadSettings = async () => {
    try {
      const s = await window.electronAPI?.readSettings();
      if (s) setSettings(s);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const autoDetectSaveFiles = async () => {
    if (!selectedGame || !selectedDirection) return;

    const platform = selectedDirection === 'pc-to-switch' ? 'pc' : 'switch';
    let basePath = platform === 'pc' ? settings.pcSavePath : settings.switchJKSVPath;

    try {
      const result = await window.electronAPI?.detectSaveFiles({
        game: selectedGame,
        platform: platform,
        basePath: basePath || '',
      });

      if (result?.success && result.files.length > 0) {
        setDetectedFiles(result.files);
        notifications.show({
          title: 'Files Detected',
          message: `Found ${result.files.length} save file(s)`,
          color: 'cyan',
        });
      } else {
        setDetectedFiles([]);
        notifications.show({
          title: 'No Files Found',
          message: 'No save files detected. Please check the path in Settings or browse manually.',
          color: 'orange',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Error detecting files: ${error.message}`,
        color: 'red',
      });
    }
  };

  const handleBrowseInput = async () => {
    const filePath = await window.electronAPI?.selectFile();
    if (filePath) {
      setInputFilePath(filePath);
      suggestOutputPath(filePath);
    }
  };

  const handleBrowseOutput = async () => {
    const defaultPath = outputFilePath || suggestOutputPath(inputFilePath);
    const filePath = await window.electronAPI?.saveFile(defaultPath);
    if (filePath) {
      setOutputFilePath(filePath);
    }
  };

  const suggestOutputPath = (inputPath) => {
    if (!inputPath || !selectedDirection) return '';

    const lastSlash = Math.max(inputPath.lastIndexOf('\\'), inputPath.lastIndexOf('/'));
    const inputDir = lastSlash >= 0 ? inputPath.substring(0, lastSlash) : '';
    const inputFullName = lastSlash >= 0 ? inputPath.substring(lastSlash + 1) : inputPath;
    const lastDot = inputFullName.lastIndexOf('.');
    const inputName = lastDot >= 0 ? inputFullName.substring(0, lastDot) : inputFullName;

    let outputDir;
    let outputName;

    if (selectedDirection === 'pc-to-switch') {
      outputDir = settings.switchJKSVPath || inputDir;
      outputName = `${inputName}_switch.dat`;
    } else {
      outputDir = settings.pcSavePath || inputDir;
      outputName = `${inputName}_pc.dat`;
    }

    const separator = outputDir.includes('\\') ? '\\' : '/';
    const suggestedPath = outputDir + separator + outputName;
    setOutputFilePath(suggestedPath);
    return suggestedPath;
  };

  const handleFileSelect = (fileInfo) => {
    const fullPath = fileInfo.path || fileInfo.filename;
    setInputFilePath(fullPath);
    setSelectedFile(fileInfo);
    suggestOutputPath(fullPath);
  };

  const handleConvert = async () => {
    if (!selectedGame || !selectedDirection || !inputFilePath || !outputFilePath) {
      notifications.show({
        title: 'Missing Information',
        message: 'Please select all required options and files.',
        color: 'red',
      });
      return;
    }

    setConverting(true);
    try {
      const result = await window.electronAPI?.convertSave({
        game: selectedGame,
        direction: selectedDirection,
        inputPath: inputFilePath,
        outputPath: outputFilePath,
      });

      if (result?.success) {
        notifications.show({
          title: 'Success',
          message: `Conversion successful! Saved to: ${outputFilePath}`,
          color: 'cyan',
        });
      } else {
        notifications.show({
          title: 'Conversion Failed',
          message: result?.error || 'Unknown error',
          color: 'red',
        });
      }
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : (error.error || error.message || String(error));
      if (errorMessage.includes('\n')) {
        errorMessage = errorMessage.split('\n').join(' | ');
      }
      notifications.show({
        title: 'Conversion Failed',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setConverting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <GameSwitcher
          value={selectedGame}
          onChange={(value) => {
            setSelectedGame(value);
            setSelectedDirection(null);
            setInputFilePath('');
            setOutputFilePath('');
            setDetectedFiles([]);
          }}
        />

        {selectedGame && (
          <Stack gap="xl">
            {/* Direction Selection */}
            <Group grow>
              <Card
                shadow="md"
                padding="xl"
                radius="lg"
                withBorder
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderColor: selectedDirection === 'pc-to-switch' ? 'var(--mantine-color-violet-6)' : undefined,
                  borderWidth: selectedDirection === 'pc-to-switch' ? '2px' : undefined,
                  background: selectedDirection === 'pc-to-switch' ? 'rgba(138, 111, 168, 0.1)' : undefined,
                }}
                onClick={() => {
                  setSelectedDirection('pc-to-switch');
                  setInputFilePath('');
                  setOutputFilePath('');
                  setSelectedFile(null);
                }}
                onMouseEnter={(e) => {
                  if (selectedDirection !== 'pc-to-switch') {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Stack gap="md" align="center">
                  <Group gap="md" align="center">
                    <ThemeIcon size={64} radius="xl" variant={selectedDirection === 'pc-to-switch' ? 'gradient' : 'light'} gradient={{ from: 'violet', to: 'blue', deg: 135 }} color="violet">
                      <IconDeviceDesktop size={36} />
                    </ThemeIcon>
                    <Box
                      style={{
                        width: '32px',
                        height: '2px',
                        background: selectedDirection === 'pc-to-switch'
                          ? 'linear-gradient(90deg, rgba(138, 111, 168, 0.8) 0%, rgba(74, 144, 226, 0.8) 100%)'
                          : 'rgba(138, 111, 168, 0.3)',
                        borderRadius: '2px',
                        transition: 'all 0.3s ease',
                      }}
                    />
                    <ThemeIcon size={64} radius="xl" variant={selectedDirection === 'pc-to-switch' ? 'gradient' : 'light'} gradient={{ from: 'violet', to: 'blue', deg: 135 }} color="violet">
                      <IconDeviceGamepad size={36} />
                    </ThemeIcon>
                  </Group>
                  <Text fw={700} size="xl">
                    PC → Switch
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Decrypt PC save for Switch
                  </Text>
                </Stack>
              </Card>

              <Card
                shadow="md"
                padding="xl"
                radius="lg"
                withBorder
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderColor: selectedDirection === 'switch-to-pc' ? 'var(--mantine-color-violet-6)' : undefined,
                  borderWidth: selectedDirection === 'switch-to-pc' ? '2px' : undefined,
                  background: selectedDirection === 'switch-to-pc' ? 'rgba(138, 111, 168, 0.1)' : undefined,
                }}
                onClick={() => {
                  setSelectedDirection('switch-to-pc');
                  setInputFilePath('');
                  setOutputFilePath('');
                  setSelectedFile(null);
                }}
                onMouseEnter={(e) => {
                  if (selectedDirection !== 'switch-to-pc') {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Stack gap="md" align="center">
                  <Group gap="md" align="center">
                    <ThemeIcon size={64} radius="xl" variant={selectedDirection === 'switch-to-pc' ? 'gradient' : 'light'} gradient={{ from: 'violet', to: 'blue', deg: 135 }} color="violet">
                      <IconDeviceGamepad size={36} />
                    </ThemeIcon>
                    <Box
                      style={{
                        width: '32px',
                        height: '2px',
                        background: selectedDirection === 'switch-to-pc'
                          ? 'linear-gradient(90deg, rgba(138, 111, 168, 0.8) 0%, rgba(74, 144, 226, 0.8) 100%)'
                          : 'rgba(138, 111, 168, 0.3)',
                        borderRadius: '2px',
                        transition: 'all 0.3s ease',
                      }}
                    />
                    <ThemeIcon size={64} radius="xl" variant={selectedDirection === 'switch-to-pc' ? 'gradient' : 'light'} gradient={{ from: 'violet', to: 'blue', deg: 135 }} color="violet">
                      <IconDeviceDesktop size={36} />
                    </ThemeIcon>
                  </Group>
                  <Text fw={700} size="xl">
                    Switch → PC
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Encrypt Switch save for PC
                  </Text>
                </Stack>
              </Card>
            </Group>

            {selectedDirection && (
              <Card shadow="md" padding="xl" radius="lg" withBorder>
                <Stack gap="lg">
                  <Text
                    fw={700}
                    size="xl"
                    style={{
                      background: 'linear-gradient(135deg, #8b6fa8 0%, #4a90e2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Select Save File
                  </Text>
                  <Divider />
                  <Group gap="sm">
                    <TextInput
                      placeholder="No file selected"
                      value={inputFilePath}
                      readOnly
                      style={{ flex: 1 }}
                      size="md"
                    />
                    <Button leftSection={<IconFolder size={18} />} onClick={handleBrowseInput} size="md">
                      Browse
                    </Button>
                  </Group>
                  {detectedFiles.length > 0 && (
                    <Stack gap="md" mt="md">
                      <Text size="sm" fw={500} c="dimmed">
                        Detected Save Files:
                      </Text>
                      <Group gap="md">
                        {detectedFiles.map((fileInfo, index) => {
                          const slotNum =
                            fileInfo.slotNumber !== null && fileInfo.slotNumber !== undefined
                              ? fileInfo.slotNumber
                              : fileInfo.filename.match(/^user(\d+)\.dat$/i)
                              ? parseInt(fileInfo.filename.match(/^user(\d+)\.dat$/i)[1])
                              : null;
                          const isSelected =
                            selectedFile?.path === fileInfo.path || selectedFile?.filename === fileInfo.filename;

                          return (
                            <Card
                              key={index}
                              shadow="sm"
                              padding="md"
                              radius="md"
                              withBorder
                              style={{
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                borderColor: isSelected ? 'var(--mantine-color-violet-6)' : 'rgba(138, 111, 168, 0.2)',
                                borderWidth: isSelected ? '2px' : '1px',
                                background: isSelected
                                  ? 'linear-gradient(135deg, rgba(138, 111, 168, 0.2) 0%, rgba(74, 144, 226, 0.1) 100%)'
                                  : 'rgba(138, 111, 168, 0.05)',
                                minWidth: 200,
                                position: 'relative',
                                overflow: 'hidden',
                              }}
                              onClick={() => handleFileSelect(fileInfo)}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.transform = 'translateY(-4px)';
                                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(138, 111, 168, 0.3)';
                                  e.currentTarget.style.borderColor = 'rgba(138, 111, 168, 0.4)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '';
                                  e.currentTarget.style.borderColor = 'rgba(138, 111, 168, 0.2)';
                                }
                              }}
                            >
                              {isSelected && (
                                <Box
                                  style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    zIndex: 1,
                                  }}
                                >
                                  <ThemeIcon
                                    size={24}
                                    radius="xl"
                                    variant="filled"
                                    color="violet"
                                    style={{
                                      boxShadow: '0 2px 8px rgba(138, 111, 168, 0.5)',
                                    }}
                                  >
                                    <IconCheck size={14} />
                                  </ThemeIcon>
                                </Box>
                              )}
                              <Stack gap="sm">
                                <Group gap="xs" justify="space-between" align="flex-start">
                                  <Group gap="xs">
                                    <ThemeIcon size={32} radius="md" variant="light" color="violet">
                                      <IconServer size={18} />
                                    </ThemeIcon>
                                    <div>
                                      <Text fw={700} size="lg" c="violet">
                                        SLOT {slotNum || '?'}
                                      </Text>
                                      <Text size="xs" c="dimmed" fw={500}>
                                        Save File
                                      </Text>
                                    </div>
                                  </Group>
                                </Group>
                                <Divider size="xs" />
                                <Group gap="xs">
                                  <IconCalendar size={16} style={{ color: 'var(--mantine-color-violet-6)' }} />
                                  <Text size="sm" c="dimmed">
                                    {formatDate(fileInfo.modifiedDate)}
                                  </Text>
                                </Group>
                                <Text
                                  size="xs"
                                  ff="monospace"
                                  c="dimmed"
                                  style={{ wordBreak: 'break-all', opacity: 0.8 }}
                                >
                                  {fileInfo.filename}
                                </Text>
                              </Stack>
                            </Card>
                          );
                        })}
                      </Group>
                    </Stack>
                  )}
                </Stack>
              </Card>
            )}

            {inputFilePath && (
              <Card shadow="md" padding="xl" radius="lg" withBorder>
                <Stack gap="lg">
                  <Text
                    fw={700}
                    size="xl"
                    style={{
                      background: 'linear-gradient(135deg, #8b6fa8 0%, #4a90e2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Output Location
                  </Text>
                  <Divider />
                  <Group gap="sm">
                    <TextInput
                      placeholder="Output path will be suggested"
                      value={outputFilePath}
                      readOnly
                      style={{ flex: 1 }}
                      size="md"
                    />
                    <Button leftSection={<IconFolder size={18} />} onClick={handleBrowseOutput} size="md">
                      Browse
                    </Button>
                  </Group>
                </Stack>
              </Card>
            )}

            {inputFilePath && outputFilePath && (
              <Group justify="center" mt="xl">
                <Button
                  size="lg"
                  onClick={handleConvert}
                  loading={converting}
                  style={{ minWidth: 250, height: 56 }}
                  leftSection={!converting && <IconArrowRight size={20} />}
                >
                  {converting ? 'Converting...' : 'Convert Save File'}
                </Button>
              </Group>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
