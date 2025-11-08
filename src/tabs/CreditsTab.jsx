import { Stack, Title, Text, Card, Group, Anchor, Container, ThemeIcon, Box, Divider } from '@mantine/core';
import { IconStar, IconCode, IconBrush, IconDeviceGamepad, IconFileText } from '@tabler/icons-react';

export default function CreditsTab() {
  const handleExternalLink = (e, url) => {
    e.preventDefault();
    window.electronAPI?.openExternalUrl(url);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Stack gap="md" align="center" mb="xl">
          <Title
            order={1}
            size="3.5rem"
            fw={900}
            style={{
              letterSpacing: '2px',
              background: 'linear-gradient(135deg, #8b6fa8 0%, #6a4c93 50%, #4a90e2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Credits & Acknowledgments
          </Title>
          <Text size="lg" c="dimmed" ta="center" maw={700} lh={1.6}>
            This project was made possible thanks to the following contributors and resources:
          </Text>
        </Stack>

        {/* Featured Creator Card */}
        <Card
          shadow="xl"
          padding="xl"
          radius="lg"
          withBorder
          style={{
            background: 'linear-gradient(135deg, rgba(138, 111, 168, 0.15) 0%, rgba(106, 76, 147, 0.1) 50%, rgba(74, 144, 226, 0.08) 100%)',
            borderColor: 'rgba(138, 111, 168, 0.4)',
            borderWidth: '2px',
          }}
        >
          <Stack gap="lg" align="center">
            <ThemeIcon
              size={120}
              radius="xl"
              variant="gradient"
              gradient={{ from: 'violet', to: 'blue', deg: 135 }}
            >
              <IconStar size={64} />
            </ThemeIcon>
            <div style={{ textAlign: 'center' }}>
              <Title order={2} size="h2" mb="sm" c="violet">
                Created By
              </Title>
              <Anchor
                href="https://github.com/dizzyfrogs"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleExternalLink(e, 'https://github.com/dizzyfrogs')}
                size="xl"
                fw={700}
                c="violet"
                style={{
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                dizzyfrogs
              </Anchor>
            </div>
          </Stack>
        </Card>

        <Divider
          label={
            <Text size="sm" fw={600} c="dimmed" tt="uppercase">
              Resources & Inspiration
            </Text>
          }
          labelPosition="center"
          my="xl"
        />

        {/* Credits Grid - 2 columns */}
        <Group grow align="stretch">
          <Card
            shadow="md"
            padding="xl"
            radius="lg"
            withBorder
            style={{
              height: '100%',
              transition: 'all 0.3s ease',
              background: 'rgba(138, 111, 168, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(138, 111, 168, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(138, 111, 168, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            <Stack gap="md" align="center">
              <ThemeIcon size={80} radius="xl" variant="light" color="violet">
                <IconCode size={44} />
              </ThemeIcon>
              <Title order={3} size="h4" ta="center" c="violet">
                Save File Conversion
              </Title>
              <Text size="sm" c="dimmed" ta="center" lh={1.7}>
                Conversion logic based on{' '}
                <Anchor
                  href="https://github.com/bloodorca/hollow"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleExternalLink(e, 'https://github.com/bloodorca/hollow')}
                  c="violet"
                  fw={600}
                  style={{ textDecoration: 'none' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  bloodorca/hollow
                </Anchor>
              </Text>
            </Stack>
          </Card>

          <Card
            shadow="md"
            padding="xl"
            radius="lg"
            withBorder
            style={{
              height: '100%',
              transition: 'all 0.3s ease',
              background: 'rgba(74, 144, 226, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(74, 144, 226, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            <Stack gap="md" align="center">
              <ThemeIcon size={80} radius="xl" variant="light" color="blue">
                <IconBrush size={44} />
              </ThemeIcon>
              <Title order={3} size="h4" ta="center" c="blue">
                UI & Sync Features
              </Title>
              <Text size="sm" c="dimmed" ta="center" lh={1.7}>
                Influenced by{' '}
                <Anchor
                  href="https://github.com/ArixAR/hollow-sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleExternalLink(e, 'https://github.com/ArixAR/hollow-sync')}
                  c="blue"
                  fw={600}
                  style={{ textDecoration: 'none' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  ArixAR/hollow-sync
                </Anchor>
              </Text>
            </Stack>
          </Card>
        </Group>

        {/* Bottom Row - 2 columns */}
        <Group grow align="stretch">
          <Card
            shadow="md"
            padding="xl"
            radius="lg"
            withBorder
            style={{
              height: '100%',
              transition: 'all 0.3s ease',
              background: 'rgba(106, 76, 147, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(106, 76, 147, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(106, 76, 147, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            <Stack gap="md" align="center">
              <ThemeIcon size={80} radius="xl" variant="light" color="violet">
                <IconDeviceGamepad size={44} />
              </ThemeIcon>
              <Title order={3} size="h4" ta="center" c="violet">
                Special Thanks
              </Title>
              <Text size="sm" c="dimmed" ta="center" lh={1.7}>
                Thanks to{' '}
                <Text span fw={700} c="orange" style={{ fontStyle: 'italic' }}>
                  Team Cherry
                </Text>{' '}
                for creating these amazing games!
              </Text>
            </Stack>
          </Card>

          <Card
            shadow="md"
            padding="xl"
            radius="lg"
            withBorder
            style={{
              height: '100%',
              transition: 'all 0.3s ease',
              background: 'rgba(74, 144, 226, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(74, 144, 226, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            <Stack gap="md" align="center">
              <ThemeIcon size={80} radius="xl" variant="light" color="blue">
                <IconFileText size={44} />
              </ThemeIcon>
              <Title order={3} size="h4" ta="center" c="blue">
                License
              </Title>
              <Text size="sm" c="dimmed" ta="center" fw={600}>
                MIT License
              </Text>
            </Stack>
          </Card>
        </Group>
      </Stack>
    </Container>
  );
}
