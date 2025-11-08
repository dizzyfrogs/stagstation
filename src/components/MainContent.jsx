import { useState, useEffect } from 'react';
import { Stack, Title, Text, Paper, Box } from '@mantine/core';
import ConverterTab from '../tabs/ConverterTab';
import EditorTab from '../tabs/EditorTab';
import CloudSyncTab from '../tabs/CloudSyncTab';
import AboutTab from '../tabs/AboutTab';
import CreditsTab from '../tabs/CreditsTab';
import SettingsTab from '../tabs/SettingsTab';

const tabInfo = {
  converter: { title: 'Converter', subtitle: 'Convert save files between PC and Switch' },
  editor: { title: 'Editor', subtitle: 'Edit save file data' },
  'cloud-sync': { title: 'Cloud Sync', subtitle: 'Sync save files with Google Drive' },
  about: { title: 'About', subtitle: 'Learn about Stagstation' },
  credits: { title: 'Credits', subtitle: 'Acknowledgments and thanks' },
  settings: { title: 'Settings', subtitle: 'Configure save file paths and preferences' },
};

export default function MainContent({ activeTab, showModal }) {
  const [pageInfo, setPageInfo] = useState(tabInfo.editor);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (tabInfo[activeTab]) {
      setIsTransitioning(true);
      // update after fade
      const timer = setTimeout(() => {
        setPageInfo(tabInfo[activeTab]);
        setIsTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const renderTab = () => {
    switch (activeTab) {
      case 'converter':
        return <ConverterTab />;
      case 'editor':
        return <EditorTab />;
      case 'cloud-sync':
        return <CloudSyncTab showModal={showModal} />;
      case 'about':
        return <AboutTab />;
      case 'credits':
        return <CreditsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  return (
    <Stack gap={0} style={{ flex: 1, overflow: 'hidden' }}>
      <Paper
        p="xl"
        withBorder
        style={{
          borderBottom: '1px solid rgba(138, 111, 168, 0.2)',
        }}
      >
        <Title
          order={1}
          size="2.5rem"
          fw={700}
          mb="xs"
          style={{
            background: 'linear-gradient(135deg, #8b6fa8 0%, #4a90e2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: isTransitioning ? 0.3 : 1,
            transform: isTransitioning ? 'translateY(-5px)' : 'translateY(0)',
          }}
        >
          {pageInfo.title}
        </Title>
        <Text
          c="dimmed"
          size="sm"
          style={{
            transition: 'opacity 0.3s ease',
            opacity: isTransitioning ? 0.3 : 1,
          }}
        >
          {pageInfo.subtitle}
        </Text>
      </Paper>

      <Box
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          position: 'relative',
        }}
      >
        <Box
          key={activeTab}
          style={{
            animation: 'fadeInSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {renderTab()}
        </Box>
      </Box>

      <style>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateX(15px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </Stack>
  );
}

export { MainContent };
