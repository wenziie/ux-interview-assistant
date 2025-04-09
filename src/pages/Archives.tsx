import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Stack,
  Alert,
  Drawer,
  useMediaQuery,
  useTheme,
  IconButton
} from '@mui/material';
import {
  Delete,
  Download,
  Summarize,
  Settings,
  Person,
  Lightbulb,
  Article,
  Close,
} from '@mui/icons-material';
import { generateSummary } from '../utils/aiUtils';
import TranscriptEntry from '../components/TranscriptEntry';

interface TranscriptEntryType {
  id: string;
  text: string;
  speaker: 'system' | 'user' | 'ai';
  timestamp: string;
  type?: 'silence' | 'keyword';
  triggerWords?: string[];
  questions?: string[];
}

interface Interview {
  id: string;
  date: string;
  context: string;
  transcript: TranscriptEntryType[];
  audioUrl?: string;
}

const Archives = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

  useEffect(() => {
    try {
      const savedInterviews = JSON.parse(localStorage.getItem('interviews') || '[]');
      const validInterviews = savedInterviews.filter((interview: any) => {
        return (
          interview &&
          typeof interview.id === 'string' &&
          typeof interview.date === 'string' &&
          typeof interview.context === 'string' &&
          Array.isArray(interview.transcript) &&
          interview.transcript.every((entry: any, index: number) => {
            if (!entry.id) entry.id = `${interview.id}-entry-${index}`;
            return true;
          })
        );
      });
      
      setInterviews(validInterviews);
      setError(null);
    } catch (err) {
      console.error('Error loading interviews:', err);
      setError('Failed to load interviews. Please try refreshing the page.');
      setInterviews([]);
    }
  }, []);

  const handleInterviewSelect = (interview: Interview) => {
    setSelectedInterview(interview);
    if (isMobile) {
      setIsDetailsSheetOpen(true);
    }
  };

  const handleCloseSheet = () => {
    setIsDetailsSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    try {
      const updatedInterviews = interviews.filter(interview => interview.id !== id);
      localStorage.setItem('interviews', JSON.stringify(updatedInterviews));
      setInterviews(updatedInterviews);
      setSelectedInterview(null);
      setIsDetailsSheetOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error deleting interview:', err);
      setError('Failed to delete interview. Please try again.');
    }
  };

  const handleDownloadAudio = (interview: Interview) => {
    if (interview.audioUrl) {
      try {
        const link = document.createElement('a');
        link.href = interview.audioUrl;
        link.download = `interview-${interview.id}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setError(null);
      } catch (err) {
        console.error('Error downloading audio:', err);
        setError('Failed to download audio. Please try again.');
      }
    }
  };

  const handleDownloadTranscript = (interview: Interview) => {
    try {
      const transcriptText = interview.transcript
        .map(entry => `[${entry.timestamp}] ${entry.speaker.toUpperCase()}: ${entry.text}`)
        .join('\n\n');

      const fullText = `Interview from ${new Date(interview.date).toLocaleString()}\n\nContext:\n${interview.context}\n\nTranscript:\n${transcriptText}`;

      const blob = new Blob([fullText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-${interview.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setError(null);
    } catch (err) {
      console.error('Error downloading transcript:', err);
      setError('Failed to download transcript. Please try again.');
    }
  };

  const handleShowSummary = () => {
    if (selectedInterview) {
      try {
        const userMessages = selectedInterview.transcript
          .filter(entry => entry.speaker === 'user')
          .map(entry => entry.text);

        const keyPoints = generateSummary(userMessages.join('\n'), selectedInterview.context)
          .split('\n')
          .filter(point => point.trim().length > 0);

        setSummary(keyPoints);
        setShowSummary(true);
        setError(null);
      } catch (err) {
        console.error('Error generating summary:', err);
        setError('Failed to generate summary. Please try again.');
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setInterviewToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (interviewToDelete) {
      handleDelete(interviewToDelete);
      setShowDeleteDialog(false);
      setInterviewToDelete(null);
    }
  };

  const getFirstUserSpeech = (transcript: TranscriptEntryType[]) => {
    return transcript.find(entry => entry.speaker === 'user')?.text || 'No speech recorded';
  };

  const renderDetailsContent = (interview: Interview | null) => {
    if (!interview) return null;

    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 5, sm: 3 }, height: '100%', overflowY: 'auto' }}>
        {isMobile && (
          <IconButton 
            aria-label="close sheet" 
            onClick={handleCloseSheet}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
          >
            <Close />
          </IconButton>
        )}

        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: 1, 
          mb: 3
        }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Summarize />}
              onClick={handleShowSummary}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              Key Highlights
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Article />}
              onClick={() => handleDownloadTranscript(interview)}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              Download Transcript
            </Button>
            {interview.audioUrl && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download />}
                onClick={() => handleDownloadAudio(interview)}
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Download Audio
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<Delete />}
              onClick={() => handleDeleteClick(interview.id)}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              Delete
            </Button>
        </Box>

        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
            Context
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontStyle: !interview.context ? 'italic' : 'normal' }}
          >
            {interview.context || 'No context provided'}
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
            Transcript
          </Typography>
          {interview.transcript && interview.transcript.length > 0 ? (
            interview.transcript.map((entry) => (
              <TranscriptEntry 
                key={entry.id}
                entry={{
                  ...entry,
                  triggerWords: entry.triggerWords || []
                }} 
              />
            ))
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              No transcript entries found
            </Typography>
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 0, sm: 2 } }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ textAlign: { xs: 'center', sm: 'left' } }}
      >
        Interview Archive
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 4 }, 
        height: { xs: 'calc(100vh - 150px)', md: 'calc(100vh - 120px)' } 
      }}>
        <Box sx={{ 
          width: { xs: '100%', md: '300px' }, 
          flex: { xs: 1, md: 'none' },
          height: { md: 'auto' },
          overflowY: 'auto',
          pr: { md: 1 },
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '4px', '&:hover': { background: '#555' } },
        }}>
          {interviews.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No interviews found
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ p: { xs: 1, md: 0} }}> 
              {interviews
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((interview) => (
                  <Paper
                    key={interview.id}
                    elevation={selectedInterview?.id === interview.id ? 4 : 1}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: selectedInterview?.id === interview.id ? 'primary.main' : '#ffffff',
                      color: selectedInterview?.id === interview.id ? 'primary.contrastText' : 'text.primary',
                      transition: 'box-shadow 0.2s, background-color 0.2s, color 0.2s',
                      '&:hover': {
                        bgcolor: 'grey.100',
                        boxShadow: 3,
                      },
                      ...(selectedInterview?.id === interview.id && {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.dark'
                        }
                      })
                    }}
                    onClick={() => handleInterviewSelect(interview)}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      {new Date(interview.date).toLocaleString()}
                    </Typography>
                    <Typography 
                      variant="body2"
                      noWrap
                      color={selectedInterview?.id === interview.id ? 'rgba(255,255,255,0.8)' : 'text.secondary'}
                      sx={{ 
                        fontStyle: !interview.context ? 'italic' : 'normal'
                      }}
                    >
                      {interview.context || 'No context provided'}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      noWrap
                      color={selectedInterview?.id === interview.id ? 'primary.contrastText' : 'text.primary'}
                      sx={{ 
                        mb: 1,
                        fontStyle: !interview.context ? 'italic' : 'normal',
                        fontWeight: 500
                      }}
                    >
                      {interview.transcript.length > 0 ? (
                        interview.transcript
                          .filter(entry => entry.speaker === 'user')
                          .map(entry => entry.text)
                          .join(' ')
                      ) : (
                        'No speech recorded'
                      )}
                    </Typography>
                  </Paper>
                ))}
            </Stack>
          )}
        </Box>

        {!isMobile && (
          <Paper sx={{ 
            flex: 1, 
            p: 3,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '4px', '&:hover': { background: '#555' } },
          }}>
            {selectedInterview ? (
              renderDetailsContent(selectedInterview)
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
                Select an interview from the list to view its details
              </Typography>
            )}
          </Paper>
        )}
      </Box>

      {isMobile && (
        <Drawer
          anchor="bottom"
          open={isDetailsSheetOpen}
          onClose={handleCloseSheet}
          ModalProps={{
            keepMounted: true,
          }}
          PaperProps={{ 
            sx: { 
              height: '85vh',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }
          }}
        >
          {renderDetailsContent(selectedInterview)}
        </Drawer>
      )}

      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Interview?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this interview? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={showSummary} 
        onClose={() => setShowSummary(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Typography variant="h6">
            Key Highlights
          </Typography>
        </DialogTitle>
        <DialogContent>
          {summary.length > 0 ? (
            <List>
              {summary.map((point, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        • {point}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No highlights available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSummary(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Archives; 