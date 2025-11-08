import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Button, Card, TextInput, Group, Stack, Text, Paper, Badge, Container, ThemeIcon, Divider, Box, Tabs, Checkbox, NumberInput, ScrollArea, Loader, Center, Collapse } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFolder, IconServer, IconCalendar, IconCheck, IconDeviceDesktop, IconDeviceGamepad, IconEdit, IconCode, IconDeviceFloppy, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import Editor from '@monaco-editor/react';
import GameSwitcher from '../components/GameSwitcher';

export default function EditorTab() {
  const [selectedGame, setSelectedGame] = useState('hollowknight');
  const [inputFilePath, setInputFilePath] = useState('');
  const [detectedFiles, setDetectedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [settings, setSettings] = useState({ pcSavePath: '', switchJKSVPath: '' });
  const [saveData, setSaveData] = useState(null);
  const [rawJson, setRawJson] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [saveType, setSaveType] = useState(null); // 'pc' or 'switch'
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [rawJsonUpdateTimeout, setRawJsonUpdateTimeout] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      autoDetectSaveFiles();
    }
  }, [selectedGame]);

  const loadSettings = async () => {
    try {
      const s = await window.electronAPI?.readSettings();
      if (s) setSettings(s);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const autoDetectSaveFiles = async () => {
    if (!selectedGame) return;

    // Try both PC and Switch paths
    const platforms = ['pc', 'switch'];
    let allFiles = [];

    for (const platform of platforms) {
      let basePath = platform === 'pc' ? settings.pcSavePath : settings.switchJKSVPath;

      try {
        const result = await window.electronAPI?.detectSaveFiles({
          game: selectedGame,
          platform: platform,
          basePath: basePath || '',
        });

        if (result?.success && result.files.length > 0) {
          allFiles = [...allFiles, ...result.files.map(f => ({ ...f, platform }))];
        }
      } catch (error) {
        console.error(`Error detecting ${platform} files:`, error);
      }
    }

    if (allFiles.length > 0) {
      setDetectedFiles(allFiles);
      notifications.show({
        title: 'Files Detected',
        message: `Found ${allFiles.length} save file(s)`,
        color: 'cyan',
      });
    } else {
      setDetectedFiles([]);
    }
  };

  const handleBrowseInput = async () => {
    const filePath = await window.electronAPI?.selectFile();
    if (filePath) {
      setInputFilePath(filePath);
      await loadSaveFile(filePath);
    }
  };

  const handleFileSelect = async (fileInfo) => {
    const fullPath = fileInfo.path || fileInfo.filename;
    setInputFilePath(fullPath);
    setSelectedFile(fileInfo);
    await loadSaveFile(fullPath);
  };

  const loadSaveFile = async (filePath) => {
    setLoading(true);
    setSaveData(null);
    setRawJson('');
    try {
      // Detect save type
      const typeResult = await window.electronAPI?.detectSaveType(filePath);
      const detectedType = typeResult?.type || 'switch'; // Default to switch if unknown

      // Read and parse the save file
      const result = await window.electronAPI?.readSaveFile(filePath);
      
      if (result?.success) {
        const jsonData = result.data;
        setSaveType(detectedType);
        setHasChanges(false);
        
        // Show rendering screen before setting saveData (which triggers heavy rendering)
        setRendering(true);
        
        // Defer setting saveData to allow loading screen to appear
        setTimeout(() => {
          setSaveData(jsonData);
          
          // Defer JSON.stringify to prevent blocking the UI
          setTimeout(() => {
            try {
              const jsonString = JSON.stringify(jsonData, null, 2);
              setRawJson(jsonString);
            } catch (error) {
              console.error('Error stringifying JSON:', error);
              setRawJson('Error formatting JSON');
            }
          }, 0);
        }, 50);
        
        notifications.show({
          title: 'File Loaded',
          message: 'Save file loaded successfully',
          color: 'cyan',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result?.error || 'Failed to load save file',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to load save file: ${error.message}`,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!inputFilePath || !saveData) {
      notifications.show({
        title: 'Error',
        message: 'No file loaded to save',
        color: 'red',
      });
      return;
    }

    setSaving(true);
    try {
      // Get settings to check for auto-backup
      const currentSettings = await window.electronAPI?.readSettings();
      const autoBackup = currentSettings?.editorAutoBackup !== false; // Default to true

      const result = await window.electronAPI?.writeSaveFile({
        filePath: inputFilePath,
        data: saveData,
        saveType: saveType,
        createBackup: autoBackup,
      });

      if (result?.success) {
        setHasChanges(false);
        notifications.show({
          title: 'Success',
          message: autoBackup && result.backupPath 
            ? `File saved! Backup created at: ${result.backupPath}`
            : 'File saved successfully!',
          color: 'cyan',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result?.error || 'Failed to save file',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to save file: ${error.message}`,
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // More efficient update that only clones the path being changed
  const updateValue = useCallback((path, value) => {
    if (!saveData) return;
    
    // Create a shallow copy of root
    const newData = { ...saveData };
    
    // Handle array indices in path ("items[0].name")
    const parts = path.split(/[\.\[\]]/).filter(p => p !== '');
    let current = newData;
    
    // Navigate to the target, cloning objects/arrays along the way
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      
      if (nextPart && !isNaN(nextPart)) {
        // Array access
        if (!current[part] || !Array.isArray(current[part])) {
          current[part] = [];
        } else {
          current[part] = [...current[part]]; // Clone array
        }
        const arrayIndex = parseInt(nextPart);
        if (current[part][arrayIndex] && typeof current[part][arrayIndex] === 'object' && !Array.isArray(current[part][arrayIndex])) {
          current[part][arrayIndex] = { ...current[part][arrayIndex] }; // Clone object in array
        } else if (current[part][arrayIndex] && Array.isArray(current[part][arrayIndex])) {
          current[part][arrayIndex] = [...current[part][arrayIndex]]; // Clone nested array
        }
        current = current[part][arrayIndex];
        i++;
      } else {
        // Object access
        if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
          current[part] = {};
        } else {
          current[part] = { ...current[part] }; // Clone object
        }
        current = current[part];
      }
    }
    
    // Set the value
    const lastKey = parts[parts.length - 1];
    if (lastKey && !isNaN(lastKey) && Array.isArray(current)) {
      current[parseInt(lastKey)] = value;
    } else {
      current[lastKey] = value;
    }
    
    setSaveData(newData);
    setHasChanges(true);
    
    // Debounce JSON.stringify updates
    if (rawJsonUpdateTimeout) {
      clearTimeout(rawJsonUpdateTimeout);
    }
    const timeout = setTimeout(() => {
      try {
        setRawJson(JSON.stringify(newData, null, 2));
      } catch (error) {
        console.error('Error stringifying JSON:', error);
      }
    }, 500); // Increased debounce for better performance
    setRawJsonUpdateTimeout(timeout);
  }, [saveData, rawJsonUpdateTimeout]);
  
  const toggleExpanded = useCallback((path) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleRawJsonChange = useCallback((value) => {
    if (value === undefined) return; // Monaco can pass undefined
    setRawJson(value);
    // Defer JSON parsing to prevent blocking
    setTimeout(() => {
      try {
        const parsed = JSON.parse(value);
        setSaveData(parsed);
        setHasChanges(true);
      } catch (error) {
        // Invalid JSON, but allow editing
      }
    }, 300); // Debounce for better performance
  }, []);

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  const renderEditorField = useCallback((key, value, path = '') => {
    const fullPath = path ? `${path}.${key}` : key;
    const fieldKey = `field-${fullPath}`;
    const isExpanded = expandedPaths.has(fullPath);

    if (value === null || value === undefined) {
      return (
        <div key={fieldKey} style={{ marginBottom: '1rem' }}>
          <Text size="sm" fw={500} mb="xs" c="dimmed">
            {key}: <Text span c="red">null</Text>
          </Text>
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <Paper key={fieldKey} p="md" withBorder style={{ marginBottom: '1rem', backgroundColor: 'rgba(138, 111, 168, 0.05)' }}>
          <Checkbox
            label={
              <Text fw={500} size="sm" c="violet">
                {key}
              </Text>
            }
            checked={value}
            onChange={(e) => updateValue(fullPath, e.target.checked)}
            size="md"
            styles={{
              label: {
                fontSize: '14px',
              },
            }}
          />
        </Paper>
      );
    }

    if (typeof value === 'number') {
      return (
        <Paper key={fieldKey} p="md" withBorder style={{ marginBottom: '1rem', backgroundColor: 'rgba(138, 111, 168, 0.05)' }}>
          <NumberInput
            label={
              <Text fw={500} size="sm" c="violet" mb="xs">
                {key}
              </Text>
            }
            value={value}
            onChange={(val) => updateValue(fullPath, val)}
            size="md"
          />
        </Paper>
      );
    }

    if (typeof value === 'string') {
      return (
        <Paper key={fieldKey} p="md" withBorder style={{ marginBottom: '1rem', backgroundColor: 'rgba(138, 111, 168, 0.05)' }}>
          <TextInput
            label={
              <Text fw={500} size="sm" c="violet" mb="xs">
                {key}
              </Text>
            }
            value={value}
            onChange={(e) => updateValue(fullPath, e.target.value)}
            size="md"
          />
        </Paper>
      );
    }

    if (Array.isArray(value)) {
      const shouldCollapse = value.length > 10; // Collapse large arrays by default
      const isExpanded = expandedPaths.has(fullPath);
      const showItems = !shouldCollapse || isExpanded;
      const displayCount = showItems ? value.length : Math.min(10, value.length);
      
      return (
        <Card 
          key={fieldKey} 
          shadow="md" 
          padding="lg" 
          radius="md" 
          withBorder 
          mb="md"
          style={{
            background: 'linear-gradient(135deg, rgba(138, 111, 168, 0.1) 0%, rgba(74, 144, 226, 0.05) 100%)',
            borderColor: 'rgba(138, 111, 168, 0.3)',
          }}
        >
          <Group gap="xs" mb="md" style={{ cursor: shouldCollapse ? 'pointer' : 'default' }} onClick={() => shouldCollapse && toggleExpanded(fullPath)}>
            {shouldCollapse && (
              <ThemeIcon size={20} radius="md" variant="light" color="violet">
                {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </ThemeIcon>
            )}
            <ThemeIcon size={24} radius="md" variant="light" color="violet">
              <IconCode size={14} />
            </ThemeIcon>
            <Text fw={600} size="md" c="violet">
              {key}
            </Text>
            <Badge size="sm" variant="light" color="violet">
              Array ({value.length})
            </Badge>
            {shouldCollapse && !isExpanded && (
              <Text size="xs" c="dimmed" style={{ marginLeft: 'auto' }}>
                Click to expand
              </Text>
            )}
          </Group>
          <Collapse in={showItems}>
            <Stack gap="md">
              {value.slice(0, displayCount).map((item, index) => {
                const arrayItemPath = fullPath ? `${fullPath}[${index}]` : `${key}[${index}]`;
                return (
                  <Card 
                    key={index} 
                    shadow="xs" 
                    padding="md" 
                    radius="sm" 
                    withBorder
                    style={{
                      backgroundColor: 'rgba(138, 111, 168, 0.05)',
                      borderColor: 'rgba(138, 111, 168, 0.2)',
                    }}
                  >
                    <Group gap="xs" mb="sm">
                      <Badge size="xs" variant="dot" color="violet">
                        Index {index}
                      </Badge>
                    </Group>
                    {typeof item === 'object' && item !== null && !Array.isArray(item)
                      ? Object.entries(item).map(([k, v]) => renderEditorField(k, v, arrayItemPath))
                      : typeof item === 'object' && item !== null && Array.isArray(item)
                      ? renderEditorField(`[${index}]`, item, fullPath)
                      : (
                          <div style={{ marginBottom: '1rem' }}>
                            {typeof item === 'boolean' ? (
                              <Checkbox
                                label={`Value`}
                                checked={item}
                                onChange={(e) => updateValue(arrayItemPath, e.target.checked)}
                                size="md"
                              />
                            ) : typeof item === 'number' ? (
                              <NumberInput
                                label={`Value`}
                                value={item}
                                onChange={(val) => updateValue(arrayItemPath, val)}
                                size="md"
                              />
                            ) : (
                              <TextInput
                                label={`Value`}
                                value={String(item)}
                                onChange={(e) => updateValue(arrayItemPath, e.target.value)}
                                size="md"
                              />
                            )}
                          </div>
                        )}
                  </Card>
                );
              })}
            </Stack>
          </Collapse>
        </Card>
      );
    }

    if (typeof value === 'object') {
      const objKeys = Object.keys(value);
      const shouldCollapse = objKeys.length > 5; // Collapse large objects by default
      const isExpanded = expandedPaths.has(fullPath);
      const showContent = !shouldCollapse || isExpanded;
      
      return (
        <Card 
          key={fieldKey} 
          shadow="md" 
          padding="lg" 
          radius="md" 
          withBorder 
          mb="md"
          style={{
            background: 'linear-gradient(135deg, rgba(138, 111, 168, 0.1) 0%, rgba(74, 144, 226, 0.05) 100%)',
            borderColor: 'rgba(138, 111, 168, 0.3)',
          }}
        >
          <Group gap="xs" mb="md" style={{ cursor: shouldCollapse ? 'pointer' : 'default' }} onClick={() => shouldCollapse && toggleExpanded(fullPath)}>
            {shouldCollapse && (
              <ThemeIcon size={20} radius="md" variant="light" color="violet">
                {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </ThemeIcon>
            )}
            <ThemeIcon size={24} radius="md" variant="light" color="violet">
              <IconEdit size={14} />
            </ThemeIcon>
            <Text fw={600} size="md" c="violet">
              {key}
            </Text>
            <Badge size="sm" variant="light" color="violet">
              Object ({objKeys.length} keys)
            </Badge>
            {shouldCollapse && !isExpanded && (
              <Text size="xs" c="dimmed" style={{ marginLeft: 'auto' }}>
                Click to expand
              </Text>
            )}
          </Group>
          <Collapse in={showContent}>
            <Stack gap="md">
              {Object.entries(value).map(([k, v]) => renderEditorField(k, v, fullPath))}
            </Stack>
          </Collapse>
        </Card>
      );
    }

    return null;
  }, [expandedPaths, updateValue, toggleExpanded]);

  // Memoize the editor fields to prevent unnecessary re-renders
  const editorFields = useMemo(() => {
    if (!saveData) return [];
    return Object.entries(saveData).map(([key, value]) => renderEditorField(key, value));
  }, [saveData, expandedPaths, renderEditorField]);

  // Hide loading screen after rendering completes
  useEffect(() => {
    if (saveData && !loading) {
      // Use requestAnimationFrame to ensure rendering has started, then hide loading
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            setRendering(false);
          }, 200);
        });
      });
    }
  }, [saveData, loading, editorFields.length]);

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <GameSwitcher
          value={selectedGame}
          onChange={(value) => {
            setSelectedGame(value);
            setInputFilePath('');
            setDetectedFiles([]);
            setSelectedFile(null);
            setSaveData(null);
            setRawJson('');
            setSaveType(null);
            setHasChanges(false);
          }}
        />

        {selectedGame && (
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
                                  {fileInfo.platform === 'pc' ? <IconDeviceDesktop size={18} /> : <IconDeviceGamepad size={18} />}
                                </ThemeIcon>
                                <div>
                                  <Text fw={700} size="lg" c="violet">
                                    SLOT {slotNum || '?'}
                                  </Text>
                                  <Text size="xs" c="dimmed" fw={500}>
                                    {fileInfo.platform === 'pc' ? 'PC Save' : 'Switch Save'}
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

        {loading && (
          <Card shadow="md" padding="xl" radius="lg" withBorder>
            <Center py="xl">
              <Stack gap="md" align="center">
                <Loader size="lg" color="violet" />
                <Text size="lg" fw={500} c="dimmed">
                  Loading save file...
                </Text>
                <Text size="sm" c="dimmed">
                  This may take a moment for large files
                </Text>
              </Stack>
            </Center>
          </Card>
        )}

        {saveData && !loading && (
          <Card 
            shadow="md" 
            padding="xl" 
            radius="lg" 
            withBorder
            style={{
              background: 'linear-gradient(135deg, rgba(138, 111, 168, 0.05) 0%, rgba(74, 144, 226, 0.02) 100%)',
            }}
          >
            <Stack gap="lg">
              <Group justify="space-between" align="center">
                <Group gap="md">
                  <ThemeIcon size={40} radius="md" variant="light" color="violet">
                    <IconEdit size={24} />
                  </ThemeIcon>
                  <div>
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
                      Edit Save Data
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      {saveType === 'pc' ? 'PC Save File' : 'Switch Save File'}
                    </Text>
                  </div>
                </Group>
                <Button
                  leftSection={<IconDeviceFloppy size={18} />}
                  onClick={handleSave}
                  loading={saving}
                  disabled={!hasChanges}
                  size="md"
                  style={{
                    background: hasChanges
                      ? 'linear-gradient(135deg, #8b6fa8 0%, #4a90e2 100%)'
                      : undefined,
                  }}
                >
                  Save Changes
                </Button>
              </Group>
              <Divider />
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                  <Tabs.Tab value="editor" leftSection={<IconEdit size={16} />}>
                    Editor
                  </Tabs.Tab>
                  <Tabs.Tab value="raw" leftSection={<IconCode size={16} />}>
                    Raw JSON
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="editor" pt="lg" style={{ position: 'relative' }}>
                  {rendering && (
                    <Box
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(10, 10, 18, 0.95)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        borderRadius: '8px',
                      }}
                    >
                      <Stack gap="md" align="center">
                        <Loader size="lg" color="violet" />
                        <Text size="lg" fw={500} c="dimmed">
                          Rendering editor...
                        </Text>
                        <Text size="sm" c="dimmed">
                          This may take a moment for large files
                        </Text>
                      </Stack>
                    </Box>
                  )}
                  <ScrollArea h={600}>
                    <Stack gap="md">
                      {editorFields}
                    </Stack>
                  </ScrollArea>
                </Tabs.Panel>

                <Tabs.Panel value="raw" pt="lg">
                  <Box
                    style={{
                      border: '1px solid rgba(138, 111, 168, 0.3)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      minHeight: '600px',
                      position: 'relative',
                    }}
                  >
                    <Editor
                      height="600px"
                      defaultLanguage="json"
                      value={rawJson}
                      onChange={handleRawJsonChange}
                      theme="vs-dark"
                      loading={
                        <Center h="600px">
                          <Loader color="violet" />
                        </Center>
                      }
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        automaticLayout: true,
                        tabSize: 2,
                        formatOnPaste: true,
                        formatOnType: true,
                        bracketPairColorization: { enabled: true },
                        suggest: { enabled: true },
                        quickSuggestions: true,
                        validate: true,
                        schemaValidation: true,
                      }}
                    />
                  </Box>
                  <Text size="xs" c="dimmed" mt="xs">
                    Edit JSON directly with full VS Code-style syntax highlighting, validation, and IntelliSense.
                  </Text>
                </Tabs.Panel>
              </Tabs>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}

