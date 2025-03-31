import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
} from '@mui/material';
import useInterviewStore from '../store/interviewStore';

const NewInterview = () => {
  const navigate = useNavigate();
  const setContext = useInterviewStore(state => state.setContext);
  const clearTranscript = useInterviewStore(state => state.clearTranscript);
  const [context, setLocalContext] = useState('');

  const handleStartInterview = () => {
    clearTranscript();
    setContext(context);
    navigate('/interview');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        UX Interview Assistant
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 1, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            How it works
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This AI-powered assistant helps you conduct user interviews by recording the conversation, providing real-time transcription, and suggesting relevant follow-up questions based on the context and user responses.
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          Interview Context
        </Typography>
        <Typography variant="body2" paragraph color="text.secondary">
          What is this interview about? What are you trying to learn?
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={20}
          variant="outlined"
          placeholder={`Example:
Product: Mobile banking app
User background: Regular banking customer, uses mobile banking apps frequently
Areas to explore:
- Initial setup and onboarding experience
- Daily banking tasks and user flows
- Security features and user trust
- Pain points with current banking apps`}
          value={context}
          onChange={(e) => setLocalContext(e.target.value)}
          sx={{ 
            mb: 3,
            '& .MuiInputBase-root': {
              resize: 'vertical',
              overflow: 'auto',
              alignItems: 'flex-start',
              '& textarea': {
                pt: 1,
                pb: 1,
              }
            }
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/archives')}
            size="large"
          >
            View Archive
          </Button>
          <Button
            variant="contained"
            onClick={handleStartInterview}
            size="large"
          >
            Start Interview
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NewInterview; 