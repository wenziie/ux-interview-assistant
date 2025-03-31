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
} from '@mui/material';
import {
  Delete,
  Download,
  Summarize,
  Settings,
  Person,
  Lightbulb,
  Article,
} from '@mui/icons-material';
import { generateSummary } from '../utils/aiUtils';
import TranscriptEntry from '../components/TranscriptEntry';

interface TranscriptEntryType {
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

  useEffect(() => {
    try {
      const savedInterviews = JSON.parse(localStorage.getItem('interviews') || '[]');
      // Validate the data structure
      const validInterviews = savedInterviews.filter((interview: any) => {
        return (
          interview &&
          typeof interview.id === 'string' &&
          typeof interview.date === 'string' &&
          typeof interview.context === 'string' &&
          Array.isArray(interview.transcript)
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

  const handleDelete = (id: string) => {
    try {
      const updatedInterviews = interviews.filter(interview => interview.id !== id);
      localStorage.setItem('interviews', JSON.stringify(updatedInterviews));
      setInterviews(updatedInterviews);
      setSelectedInterview(null);
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
      // Create a formatted transcript text
      const transcriptText = interview.transcript
        .map(entry => `[${entry.timestamp}] ${entry.speaker.toUpperCase()}: ${entry.text}`)
        .join('\n\n');

      const fullText = `Interview from ${new Date(interview.date).toLocaleString()}\n\nContext:\n${interview.context}\n\nTranscript:\n${transcriptText}`;

      // Create and trigger download
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
        // Filter out system messages and AI suggestions
        const userMessages = selectedInterview.transcript
          .filter(entry => entry.speaker === 'user')
          .map(entry => entry.text);

        // Generate key points from the transcript
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Interview Archive
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 4, height: 'calc(100vh - 120px)' }}>
        <Box sx={{ 
          width: '300px',
          overflowY: 'auto',
          pr: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#555',
            },
          },
        }}>
          {interviews.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No interviews found
            </Typography>
          ) : (
            <Stack spacing={2}>
              {interviews
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((interview) => (
                  <Paper
                    key={interview.id}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: selectedInterview?.id === interview.id ? 'primary.main' : '#ffffff',
                      color: selectedInterview?.id === interview.id ? 'primary.contrastText' : 'text.primary',
                      '&:hover': {
                        bgcolor: selectedInterview?.id === interview.id ? 'primary.dark' : 'grey.100',
                      },
                    }}
                    onClick={() => setSelectedInterview(interview)}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      {new Date(interview.date).toLocaleString()}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color={selectedInterview?.id === interview.id ? 'primary.contrastText' : 'text.primary'}
                      sx={{ 
                        mb: 1,
                        fontStyle: !interview.context ? 'italic' : 'normal'
                      }}
                    >
                      {interview.context || 'No context provided'}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color={selectedInterview?.id === interview.id ? 'primary.contrastText' : 'text.primary'}
                      sx={{ 
                        fontWeight: 500,
                        fontStyle: interview.transcript.length === 0 ? 'italic' : 'normal'
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

        <Paper sx={{ 
          flex: 1, 
          p: 3,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#555',
            },
          },
        }}>
          {selectedInterview ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<Summarize />}
                      onClick={handleShowSummary}
                    >
                      Key Highlights
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Article />}
                      onClick={() => handleDownloadTranscript(selectedInterview)}
                    >
                      Download Transcript
                    </Button>
                    {selectedInterview.audioUrl && (
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => handleDownloadAudio(selectedInterview)}
                      >
                        Download Audio
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDeleteClick(selectedInterview.id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Box>
              </Box>

              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Context
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontStyle: !selectedInterview.context ? 'italic' : 'normal' }}
                >
                  {selectedInterview.context || 'No context provided'}
                </Typography>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Transcript
                </Typography>
                {selectedInterview.transcript && selectedInterview.transcript.length > 0 ? (
                  selectedInterview.transcript.map((entry, index) => (
                    <TranscriptEntry 
                      key={index} 
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

              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Key Highlights
                </Typography>
                <Stack spacing={1}>
                  {selectedInterview.transcript
                    .filter(entry => entry.speaker === 'user')
                    .slice(0, 3)
                    .map((entry, index) => (
                      <Typography 
                        key={index} 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          '&::before': {
                            content: '"•"',
                            color: '#4A9A8C',
                            fontWeight: 'bold',
                          }
                        }}
                      >
                        {entry.text.length > 100 
                          ? `${entry.text.substring(0, 100)}...` 
                          : entry.text}
                      </Typography>
                    ))}
                  {selectedInterview.transcript.filter(entry => entry.speaker === 'user').length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No user responses recorded
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
              Select an interview from the list to view its details
            </Typography>
          )}
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
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