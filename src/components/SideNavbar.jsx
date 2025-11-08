import { NavLink, Stack, Group, Text, Image, Box } from '@mantine/core';
import { IconArrowLeftRight, IconCloud, IconInfoCircle, IconHeart, IconSettings, IconEdit } from '@tabler/icons-react';

const navItems = [
  { id: 'editor', icon: IconEdit, label: 'Editor' },
  { id: 'converter', icon: IconArrowLeftRight, label: 'Converter' },
  { id: 'cloud-sync', icon: IconCloud, label: 'Cloud Sync' },
];

const bottomNavItems = [
  { id: 'about', icon: IconInfoCircle, label: 'About' },
  { id: 'credits', icon: IconHeart, label: 'Credits' },
  { id: 'settings', icon: IconSettings, label: 'Settings' },
];

export default function SideNavbar({ activeTab, onTabChange }) {
  const renderNavItem = (item, index, isBottom = false) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const animationDelay = isBottom ? (index + navItems.length) * 0.05 : index * 0.05;
    
    return (
      <NavLink
        key={item.id}
        label={item.label}
        leftSection={<Icon size={22} />}
        active={isActive}
        onClick={() => onTabChange(item.id)}
        variant="subtle"
        style={{
          borderRadius: 10,
          fontWeight: 600,
          fontSize: '15px',
          padding: '12px 16px',
          margin: '0 0 6px 0',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: isActive
            ? 'rgba(138, 111, 168, 0.2)'
            : 'transparent',
          borderLeft: isActive ? '3px solid var(--mantine-color-violet-6)' : '3px solid transparent',
          color: isActive ? 'var(--mantine-color-violet-4)' : undefined,
          boxShadow: isActive
            ? '0 2px 8px rgba(138, 111, 168, 0.3), inset 0 0 20px rgba(138, 111, 168, 0.1)'
            : undefined,
          transform: isActive ? 'translateX(4px)' : 'translateX(0)',
          animation: `fadeInNav 0.3s ease-out ${animationDelay}s both`,
        }}
        styles={{
          root: {
            padding: 0,
          },
          label: {
            fontWeight: isActive ? 700 : 600,
            color: isActive ? 'var(--mantine-color-violet-3)' : undefined,
            transition: 'all 0.3s ease',
          },
          leftSection: {
            color: isActive ? 'var(--mantine-color-violet-4)' : undefined,
            transition: 'all 0.3s ease',
          },
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'rgba(138, 111, 168, 0.1)';
            e.currentTarget.style.transform = 'translateX(2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'translateX(0)';
          }
        }}
      />
    );
  };

  return (
    <Stack
      gap={0}
      style={{
        width: 260,
        minWidth: 260,
        background: 'linear-gradient(180deg, rgba(10, 10, 18, 0.85) 0%, rgba(15, 15, 26, 0.75) 100%)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(138, 111, 168, 0.2)',
        height: '100%',
        overflowY: 'auto',
        boxShadow: '12px 0 32px rgba(0, 0, 0, 0.5), inset -1px 0 0 rgba(138, 111, 168, 0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        style={{
          padding: '28px 20px',
          borderBottom: '1px solid rgba(138, 111, 168, 0.2)',
          background: 'linear-gradient(135deg, rgba(138, 111, 168, 0.1) 0%, rgba(74, 144, 226, 0.05) 100%)',
        }}
      >
        <Group gap="md" mb="xs" wrap="nowrap">
          <Image
            src="/assets/icon.png"
            alt="Stagstation"
            w={52}
            h={52}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(138, 111, 168, 0.4))',
            }}
          />
          <div>
            <Text fw={800} size="xl" style={{ letterSpacing: '1px' }}>
              Stagstation
            </Text>
            <Text size="xs" c="dimmed" fw={500} mt={2}>
              Hollow Knight & Silksong Save Tool
            </Text>
          </div>
        </Group>
      </Box>

      {/* Main Navigation - Top */}
      <Box p="md" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
        <Stack gap={0}>
          {navItems.map((item, index) => renderNavItem(item, index, false))}
        </Stack>
      </Box>

      {/* Spacer to push bottom items down */}
      <Box style={{ flex: 1 }} />

      {/* Bottom Navigation */}
      <Box
        style={{
          borderTop: '1px solid rgba(138, 111, 168, 0.2)',
          padding: '16px',
        }}
      >
        <Stack gap={0}>
          {bottomNavItems.map((item, index) => renderNavItem(item, index, true))}
        </Stack>
      </Box>

      <style>{`
        @keyframes fadeInNav {
          from {
            opacity: 0;
            transform: translateX(-10px);
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
