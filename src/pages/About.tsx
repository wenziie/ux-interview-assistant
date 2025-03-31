import { Container, Typography, Box, Paper, Stack, Link } from '@mui/material';
import { Lightbulb, Psychology, Code, EmojiObjects, AutoAwesome } from '@mui/icons-material';

const About = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        About This Project
      </Typography>

      <Stack spacing={4}>
        {/* Personal Story Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology sx={{ color: '#4A9A8C' }} />
            A Personal Journey
          </Typography>
          <Typography variant="body1" paragraph>
            As a UX designer, I often find myself conducting user interviews. While there are many AI tools for creating UIs and visual designs, I noticed that the empathize phase of the design process remains largely manual and mentally demanding.
          </Typography>
          <Typography variant="body1" paragraph>
            This project started as an experiment to solve one of my everyday challenges: making user interviews more manageable. It's a personal tool I built to help me focus on what matters most during interviews - connecting with users and gathering meaningful insights.
          </Typography>
        </Paper>

        {/* The Challenge Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiObjects sx={{ color: '#4A9A8C' }} />
            The Daily Challenge
          </Typography>
          <Typography variant="body1" paragraph>
            During interviews, I found myself juggling multiple tasks:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              Keeping track of time while maintaining a natural conversation flow
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              Processing unfamiliar accents and domain-specific vocabulary
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              Taking notes while staying engaged with the user
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              Thinking of relevant follow-up questions in real-time
            </Typography>
          </Box>
        </Paper>

        {/* The AI Experiment Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome sx={{ color: '#4A9A8C' }} />
            The AI Experiment
          </Typography>
          <Typography variant="body1" paragraph>
            This project is not just about solving an interview challenge - it's also an experiment in AI-assisted development. Built entirely with AI assistance using Cursor, I wanted to explore how far we could push the boundaries of building a functional application without traditional programming knowledge. The result? A working application with frontend, backend, and various API integrations, all created without writing a single line of code myself.
          </Typography>
          <Typography variant="body1" paragraph>
            This experience has been eye-opening. It's shown me the incredible power of AI in software development and how it's changing the way we think about building applications. The ability to create complex, functional applications through natural language conversations with AI is not just a novelty - it's a glimpse into how we'll work in the future.
          </Typography>
        </Paper>

        {/* The Interview Tool Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Code sx={{ color: '#4A9A8C' }} />
            The Interview Tool
          </Typography>
          <Typography variant="body1" paragraph>
            While it's still a work in progress, the app is already helping me focus more on the conversation and less on the mechanics of note-taking and question formulation. It's not meant to replace human interaction but to enhance it by handling some of the logistical challenges.
          </Typography>
        </Paper>

        {/* Future Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lightbulb sx={{ color: '#4A9A8C' }} />
            What's Next?
          </Typography>
          <Typography variant="body1" paragraph>
            This project has been a fascinating journey in both UX research and AI capabilities. It's shown me that the future of work isn't about AI replacing humans, but about AI augmenting our capabilities in ways we're just beginning to understand. As I continue to improve this tool based on my experiences, I'm also exploring how AI can further transform the way we work in UX research and beyond.
          </Typography>
        </Paper>

        {/* Signature Section */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'flex-end',
          mt: 2,
          pt: 2
        }}>
          <Typography variant="body1" color="text.secondary">
            Made by{' '}
            <Link 
              href="https://noreasandgren.com" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ 
                color: '#4A9A8C',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Norea Sandgren
            </Link>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visit my portfolio at{' '}
            <Link 
              href="https://noreasandgren.com" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ 
                color: '#4A9A8C',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              noreasandgren.com
            </Link>
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
};

export default About; 