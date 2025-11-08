import { Stack, Title, Text, Card, Group, Image, Box, ThemeIcon, Container, Anchor, Divider } from '@mantine/core';
import { IconStar, IconArrowLeftRight, IconCloud, IconTools, IconBrandGithub } from '@tabler/icons-react';

export default function AboutTab() {
  const handleExternalLink = (e, url) => {
    e.preventDefault();
    window.electronAPI?.openExternalUrl(url);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Hero Section */}
        <Stack gap="md" align="center" py="xl">
          <Box
            style={{
              position: 'relative',
              marginBottom: '1rem',
            }}
          >
            <Image
              src="/assets/icon.png"
              alt="Stagstation"
              w={160}
              h={160}
              style={{
                filter: 'drop-shadow(0 0 30px rgba(138, 111, 168, 0.6)) drop-shadow(0 0 60px rgba(74, 144, 226, 0.4))',
              }}
            />
          </Box>
          <Title
            order={1}
            size="4rem"
            fw={900}
            style={{
              letterSpacing: '3px',
              background: 'linear-gradient(135deg, #8b6fa8 0%, #6a4c93 50%, #4a90e2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Stagstation
          </Title>
          <Text size="xl" c="dimmed" fw={500} mt="xs">
            Your all-in-one save tool for Hollow Knight & Silksong
          </Text>
        </Stack>

        {/* Main Feature Card */}
        <Card
          shadow="xl"
          padding="xl"
          radius="lg"
          withBorder
          style={{
              background: 'linear-gradient(135deg, rgba(138, 111, 168, 0.15) 0%, rgba(74, 144, 226, 0.08) 100%)',
              borderColor: 'rgba(138, 111, 168, 0.3)',
            borderWidth: '2px',
          }}
        >
          <Group gap="lg" mb="lg" wrap="nowrap">
            <ThemeIcon
              size={80}
              radius="xl"
              variant="gradient"
              gradient={{ from: 'violet', to: 'blue', deg: 135 }}
            >
              <IconStar size={48} />
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Title
                order={2}
                mb="sm"
                style={{
                  background: 'linear-gradient(135deg, #8b6fa8 0%, #4a90e2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                What is Stagstation?
              </Title>
              <Text size="md" lh={1.8} c="dimmed">
                Stagstation is a comprehensive desktop application built for the Hollow Knight community. It's your complete toolkit for managing save files across platforms, with powerful features to help you get the most out of your playthroughs.
              </Text>
            </div>
          </Group>
        </Card>

        {/* Feature Cards Grid */}
        <Group grow align="stretch">
          <Card
            shadow="md"
            padding="xl"
            radius="lg"
            withBorder
            style={{
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(138, 111, 168, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <Stack gap="md" style={{ flex: 1 }}>
              <ThemeIcon size={64} radius="xl" variant="light" color="violet">
                <IconArrowLeftRight size={36} />
              </ThemeIcon>
              <Title order={3} size="h4">
                Save Conversion
              </Title>
              <Text size="sm" c="dimmed" lh={1.7} style={{ flex: 1 }}>
                Seamlessly convert saves between PC and Switch formats. Play on your PC, continue on your Switch or vice versa. Stagstation handles all the technical complexity behind the scenes.
              </Text>
            </Stack>
          </Card>

          <Card
            shadow="md"
            padding="xl"
            radius="lg"
            withBorder
            style={{
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(138, 111, 168, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <Stack gap="md" style={{ flex: 1 }}>
              <ThemeIcon size={64} radius="xl" variant="light" color="violet">
                <IconCloud size={36} />
              </ThemeIcon>
              <Title order={3} size="h4">
                Cloud Sync
              </Title>
              <Text size="sm" c="dimmed" lh={1.7} style={{ flex: 1 }}>
                Keep your saves backed up and synchronized with Google Drive. Never lose your progress, and easily access your saves from anywhere.
              </Text>
            </Stack>
          </Card>

          <Card
            shadow="md"
            padding="xl"
            radius="lg"
            withBorder
            style={{
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(138, 111, 168, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <Stack gap="md" style={{ flex: 1 }}>
              <ThemeIcon size={64} radius="xl" variant="light" color="violet">
                <IconTools size={36} />
              </ThemeIcon>
              <Title order={3} size="h4">
                Save Editing
              </Title>
              <Text size="sm" c="dimmed" lh={1.7} style={{ flex: 1 }}>
                Coming soon! Save editing capabilities to customize your playthrough.
              </Text>
            </Stack>
          </Card>
        </Group>

        {/* Story Section */}
        <Card
          shadow="xl"
          padding="xl"
          radius="lg"
          withBorder
          style={{
            borderLeft: '4px solid var(--mantine-color-violet-6)',
            background: 'linear-gradient(135deg, rgba(10, 10, 18, 0.6) 0%, rgba(15, 15, 26, 0.5) 100%)',
          }}
        >
          <Stack gap="lg">
            <Title
              order={2}
              size="h2"
              fw={700}
              style={{
                background: 'linear-gradient(135deg, #8b6fa8 0%, #4a90e2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Why I Built This
            </Title>
            <Stack gap="md">
              <Text size="md" lh={1.8}>
                This project originally started as a tool to streamline transferring my save files between my Switch and PC. I quickly realized that tools for this already exist, but I decided to combine and streamline them anyway as a way to learn about using certain technologies.
              </Text>
              <Text size="md" lh={1.8}>
                This project has been a great learning experience, and now I have a tool that makes managing saves for these amazing games seamless and enjoyable.
              </Text>
            </Stack>
            <Box
              mt="lg"
              pt="lg"
              style={{
                borderTop: '1px solid rgba(138, 111, 168, 0.2)',
              }}
            >
              <Text size="md" c="dimmed" style={{ fontStyle: 'italic' }} lh={1.8}>
                Built with passion for the{' '}
                <Text
                  span
                  fw={700}
                  style={{
                    fontStyle: 'normal',
                    background: 'linear-gradient(135deg, #8b6fa8 0%, #4a90e2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Hollow Knight community
                </Text>
                .
              </Text>
            </Box>
          </Stack>
        </Card>

        {/* Source Code Link */}
        <Box
          style={{
            textAlign: 'center',
            paddingTop: '2rem',
          }}
        >
          <Divider mb="lg" />
          <Group gap="xs" justify="center" align="center">
            <IconBrandGithub size={20} style={{ color: 'var(--mantine-color-violet-6)' }} />
            <Text size="md" c="dimmed">
              View source code on{' '}
              <Anchor
                href="https://github.com/dizzyfrogs/stagstation"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleExternalLink(e, 'https://github.com/dizzyfrogs/stagstation')}
                c="violet"
                fw={600}
                style={{
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                GitHub
              </Anchor>
            </Text>
          </Group>
        </Box>
      </Stack>
    </Container>
  );
}
