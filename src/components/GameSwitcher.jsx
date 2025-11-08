import { SegmentedControl, Group, Image, Text, Box } from '@mantine/core';

export default function GameSwitcher({ value, onChange }) {
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px 0',
        marginBottom: '8px',
      }}
    >
      <SegmentedControl
        value={value}
        onChange={onChange}
        data={[
          {
            value: 'hollowknight',
            label: (
              <Group gap="xs" justify="center" wrap="nowrap" style={{ padding: '4px 8px' }}>
                <Image
                  src="./assets/hollowknight.png"
                  alt="Hollow Knight"
                  w={36}
                  h={36}
                  style={{
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 4px rgba(138, 111, 168, 0.3))',
                  }}
                />
                <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
                  Hollow Knight
                </Text>
              </Group>
            ),
          },
          {
            value: 'silksong',
            label: (
              <Group gap="xs" justify="center" wrap="nowrap" style={{ padding: '4px 8px' }}>
                <Image
                  src="./assets/silksong.png"
                  alt="Silksong"
                  w={36}
                  h={36}
                  style={{
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 4px rgba(138, 111, 168, 0.3))',
                  }}
                />
                <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
                  Silksong
                </Text>
              </Group>
            ),
          },
        ]}
        size="lg"
        radius="xl"
        fullWidth
        style={{
          maxWidth: '500px',
        }}
        styles={{
          root: {
            backgroundColor: 'rgba(10, 10, 18, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(138, 111, 168, 0.25)',
            padding: '4px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(138, 111, 168, 0.05)',
            transition: 'all 0.3s ease',
          },
          indicator: {
            background: 'linear-gradient(135deg, #8b6fa8 0%, #6a4c93 50%, #4a90e2 100%)',
            boxShadow: '0 2px 8px rgba(138, 111, 168, 0.4), inset 0 0 20px rgba(138, 111, 168, 0.2)',
            borderRadius: 'xl',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          label: {
            color: 'var(--mantine-color-dark-2)',
            transition: 'all 0.3s ease',
          },
          labelActive: {
            color: 'var(--mantine-color-dark-0)',
            fontWeight: 700,
          },
        }}
      />
    </Box>
  );
}
