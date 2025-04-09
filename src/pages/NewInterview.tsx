import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import useInterviewStore from '../store/interviewStore';

const NewInterview = () => {
  const navigate = useNavigate();
  const setContextAndMode = useInterviewStore(state => state.setContextAndMode);
  const clearTranscript = useInterviewStore(state => state.clearTranscript);
  const [context, setLocalContext] = useState('');
  const [mode, setMode] = useState<'hardcoded' | 'ai'>('hardcoded');

  const handleStartInterview = () => {
    clearTranscript();
    setContextAndMode(context, mode);
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
        
        <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}>
            Which assistant would you like to use?
          </FormLabel>
          <RadioGroup
            aria-label="assistant-mode"
            name="assistant-mode-radio-buttons-group"
            value={mode}
            onChange={(e) => setMode(e.target.value as 'hardcoded' | 'ai')}
          >
            <FormControlLabel 
              value="hardcoded" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>Hardcoded</Typography>
                  <Typography variant="body2" color="text.secondary">Relies on fixed rules. Simple, no context awareness.</Typography>
                </Box>
              }
              sx={{ mb: 1 }} 
            />
            <FormControlLabel 
              value="ai" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>AI (LLM)</Typography>
                  <Typography variant="body2" color="text.secondary">Powered by OpenAI (paid API). Understands context, adapts.</Typography>
                </Box>
              } 
            />
          </RadioGroup>
        </FormControl>

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