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
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0, sm: 2 } }}>
      <Typography 
        variant="h2" 
        component="h1" 
        gutterBottom 
        align="center" 
        sx={{ 
          mb: { xs: 3, sm: 4 }, 
          fontSize: { xs: '2.5rem', sm: '3rem' }
        }}
      >
        UX Interview Assistant
      </Typography>
      
      {/* AI Robot Image */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 3, sm: 4 } }}>
        <img 
          src={`./images/interview_assistant.png?v=${new Date().getTime()}`}
          alt="AI Assistant Robot" 
          style={{ 
            maxWidth: '100%',
            height: 'auto',
            width: '200px'
          }} 
          sx={{ 
            width: { xs: '150px', sm: '250px', md: '300px' }
          }} 
        />
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <Box sx={{ bgcolor: 'grey.50', p: { xs: 2, sm: 3 }, borderRadius: 1, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            How it works
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This AI assistant supports user interviews by providing real-time transcriptions and suggesting context-aware follow-up questions based on users' responses.
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Interview Context
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={20}
          variant="outlined"
          placeholder="What is the focus of this interview? What insights are you hoping to gather, and how can the assistant support you?"
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
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', gap: 2, mt: 3 }}>
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