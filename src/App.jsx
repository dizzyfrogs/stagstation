import { useState } from 'react';
import { MantineProvider, createTheme, Box, Group, Button } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { IconMinus, IconX, IconMaximize } from '@tabler/icons-react';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import SideNavbar from './components/SideNavbar';
import MainContent from './components/MainContent';
import DustCanvas from './components/DustCanvas';
import Modal from './components/Modal';
import { useModal } from './hooks/useModal';
import './index.css';

// hollow knight vibes, dark blues and purples. I like this theme.
const theme = createTheme({
  primaryColor: 'violet',
  defaultRadius: 'md',
  fontFamily: 'Trajan Pro, system-ui, sans-serif',
  colors: {
    violet: [
      '#e8d5f2', // 0 - lightest
      '#d4b5e8', // 1
      '#b88fd4', // 2
      '#9d7bb8', // 3
      '#8b6fa8', // 4 - primary accent
      '#6a4c93', // 5
      '#533483', // 6
      '#3d2569', // 7
      '#2a1a4a', // 8
      '#1a0f2e', // 9 - darkest
    ],
    blue: [
      '#d0e5f5', // 0 - lightest
      '#a8c9e8', // 1
      '#7ba8d4', // 2
      '#5a9fd4', // 3
      '#4a90e2', // 4 - primary accent
      '#3a7bc8', // 5
      '#2a5fa8', // 6
      '#1a4388', // 7
      '#0f2a68', // 8
      '#0a1a48', // 9 - darkest
    ],
    dark: [
      '#d0d5e0', // 0 - text primary
      '#b8c5d6', // 1 - text secondary
      '#9aa5b8', // 2 - text muted
      '#6b7280', // 3
      '#4a4f5a', // 4
      '#2a2d35', // 5
      '#1a1d26', // 6
      '#141420', // 7 - background
      '#0f0f1a', // 8 - background darker
      '#0a0a12', // 9 - background darkest
    ],
  },
  primaryShade: 4,
  defaultGradient: {
    from: 'violet',
    to: 'blue',
    deg: 135,
  },
});

function App() {
  const [activeTab, setActiveTab] = useState('converter');
  const { modal, showModal, handleConfirm, handleCancel } = useModal();

  const handleMinimize = () => {
    window.electronAPI?.windowMinimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.windowMaximize();
  };

  const handleClose = () => {
    window.electronAPI?.windowClose();
  };

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Box
        style={{
          minHeight: '100vh',
          position: 'relative',
          backgroundColor: '#0a0a12',
        }}
      >
        <Notifications position="top-right" />
        <DustCanvas />
        
        {/* window buttons in top right */}
        <Box
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            zIndex: 1000,
            WebkitAppRegion: 'no-drag',
            pointerEvents: 'auto',
          }}
        >
          <Group gap={0}>
            <Button
              variant="subtle"
              size="xs"
              onClick={handleMinimize}
              style={{
                width: '46px',
                height: '40px',
                color: '#9aa5b8',
                borderRadius: 0,
              }}
              title="Minimize"
            >
              <IconMinus size={16} />
            </Button>
            <Button
              variant="subtle"
              size="xs"
              onClick={handleMaximize}
              style={{
                width: '46px',
                height: '40px',
                color: '#9aa5b8',
                borderRadius: 0,
              }}
              title="Maximize"
            >
              <IconMaximize size={16} />
            </Button>
            <Button
              variant="subtle"
              size="xs"
              onClick={handleClose}
              style={{
                width: '46px',
                height: '40px',
                color: '#9aa5b8',
                borderRadius: 0,
              }}
              title="Close"
            >
              <IconX size={16} />
            </Button>
          </Group>
        </Box>

        {/* draggable area at top, but not where the buttons are */}
        <Box
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: '138px', // 3 buttons * 46px
            height: '40px',
            WebkitAppRegion: 'drag',
            pointerEvents: 'auto',
            zIndex: 999,
          }}
        />

        <Box
          style={{
            display: 'flex',
            height: '100vh',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <SideNavbar activeTab={activeTab} onTabChange={setActiveTab} />
          <MainContent activeTab={activeTab} showModal={showModal} />
        </Box>
        <Modal modal={modal} handleConfirm={handleConfirm} handleCancel={handleCancel} />
      </Box>
    </MantineProvider>
  );
}

export default App;
