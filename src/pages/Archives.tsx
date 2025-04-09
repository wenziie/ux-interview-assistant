import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
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
  Stack,
  Alert,
  Drawer,
  useMediaQuery,
  useTheme,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Delete,
  Download,
  Summarize,
  Article,
  Close,
} from '@mui/icons-material';
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
  aiFeaturesEnabled?: boolean;
  transcript: TranscriptEntryType[];
  audioUrl?: string;
  summary?: string;
}

const Archives = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<string | null>(null);
  const [showConfirmSummaryDialog, setConfirmSummaryDialog] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

  useEffect(() => {
    try {
      const savedInterviews = JSON.parse(localStorage.getItem('interviews') || '[]') as unknown[];
      const validInterviews = savedInterviews.filter((interview: unknown): interview is Interview => {
        if (!(typeof interview === 'object' && interview !== null &&
            'id' in interview && typeof interview.id === 'string' &&
            'date' in interview && typeof interview.date === 'string' &&
            'context' in interview && typeof interview.context === 'string' &&
            'transcript' in interview && Array.isArray(interview.transcript)))
        {
            return false;
        }
        if (('aiFeaturesEnabled' in interview) && typeof (interview as Interview).aiFeaturesEnabled !== 'boolean') return false;
        if (('audioUrl' in interview) && typeof (interview as Interview).audioUrl !== 'string') return false;
        if (('summary' in interview) && typeof (interview as Interview).summary !== 'string') return false;
        
        return interview.transcript.every((entry: unknown, index: number): boolean => {
           if (typeof entry === 'object' && entry !== null &&
               'text' in entry && 'speaker' in entry && 'timestamp' in entry) {
             if (!('id' in entry) || typeof (entry as {id?: unknown}).id !== 'string') {
               (entry as {id?: unknown}).id = `${(interview as Interview).id}-entry-${index}`;
             }
             return true;
           }
           return false;
        });
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

  const fetchSummary = async () => {
    if (!selectedInterview) return;

    setIsSummarizing(true);
    setSummary(null); 
    setError(null); 
    setShowSummary(false);
    setConfirmSummaryDialog(false);

    try {
      const payload = {
        context: selectedInterview.context,
        transcript: selectedInterview.transcript,
      };
      const response = await axios.post('http://localhost:5001/api/summarize', payload);
      console.log('Summary response:', response.data);
      
      const summaryResult = response.data.summary || response.data.message || 'Summary processed.';
      
      const updatedInterview = { ...selectedInterview, summary: summaryResult };
      const updatedInterviews = interviews.map(interview => 
        interview.id === selectedInterview.id ? updatedInterview : interview
      );
      setInterviews(updatedInterviews);
      setSelectedInterview(updatedInterview);
      localStorage.setItem('interviews', JSON.stringify(updatedInterviews));

      setSummary(summaryResult);
      setShowSummary(true);

    } catch (error) {
      console.error('Error calling summarize API:', error);
      let errorMessage = 'Failed to generate summary.';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage += ` Server responded with: ${error.response.data?.message || error.response.statusText}`;
      } else if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
      }
      setError(errorMessage);
      setShowSummary(false);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleRequestSummary = () => {
    if (!selectedInterview || isSummarizing) return;

    if (selectedInterview.summary) {
      console.log("Displaying cached summary.");
      setSummary(selectedInterview.summary);
      setShowSummary(true);
      setError(null);
    } else {
      console.log("No cached summary, showing confirmation dialog.");
      setConfirmSummaryDialog(true);
    }
  };

  const handleConfirmAndSummarize = () => {
    setConfirmSummaryDialog(false);
    fetchSummary();
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
              startIcon={isSummarizing ? <CircularProgress size={20} color="inherit" /> : <Summarize />}
              onClick={handleRequestSummary}
              disabled={isSummarizing}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
              title={"Generate Key Highlights (may incur cost)"}
            >
              {isSummarizing ? 'Generating...' : 'Key Highlights'}
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
    <Container maxWidth={isMobile || !selectedInterview ? 'md' : 'xl'} sx={{ pt: 2 }}>
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
        open={showConfirmSummaryDialog}
        onClose={() => setConfirmSummaryDialog(false)}
        aria-labelledby="confirm-summary-dialog-title"
        aria-describedby="confirm-summary-dialog-description"
      >
        <DialogTitle id="confirm-summary-dialog-title">
          Generate AI Summary?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-summary-dialog-description">
            Generating an AI summary uses the OpenAI API which may incur a small cost.
            Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSummaryDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmAndSummarize} variant="contained" autoFocus>
            Confirm & Generate
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
        <DialogTitle sx={{ pb: 3 }}>
          <Typography variant="h5">
            Key Highlights
          </Typography>
        </DialogTitle>
        <DialogContent>
          {summary ? (
            <Box sx={{
              '& p:not(:last-child)': { marginBottom: '1em' },
              '& > *:first-of-type': { marginTop: 0 }
            }}>
              <ReactMarkdown
                components={{
                  strong: ({node, ...props}) => 
                    <Box sx={{ display: 'block' }}>
                      <Typography 
                        variant="subtitle1" 
                        component="span"
                        gutterBottom
                        sx={{ fontWeight: 'bold' }} 
                        {...props} 
                      />
                    </Box>
                }}
              >
                {summary}
              </ReactMarkdown>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No highlights generated yet.
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