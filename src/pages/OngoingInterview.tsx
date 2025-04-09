import { useEffect, useRef, useState } from 'react';
import {
  Container,
  Box,
  Button,
  Paper,
  Typography,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material';
import {
} from '@mui/icons-material';
import useInterviewStore from '../store/interviewStore';
import { audioRecorder } from '../utils/audioUtils';
import { analyzeTranscript } from '../utils/aiUtils';
import FollowUpBanner from '../components/FollowUpBanner';
import TranscriptEntry from '../components/TranscriptEntry';

const OngoingInterview = () => {
  const {
    isRecording,
    isPaused,
    currentLanguage,
    context,
    transcript,
    startRecording: startRecordingStore,
    stopRecording: stopRecordingStore,
    pauseRecording,
    resumeRecording,
    setLanguage,
    addTranscriptEntry,
    updateTranscriptEntry,
    clearTranscript,
  } = useInterviewStore();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [showLanguageAlert, setShowLanguageAlert] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = currentLanguage === 'en' ? 'en-US' : 'sv-SE';

        recognition.onresult = (event) => {
          const lastResult = event.results[event.results.length - 1];
          const transcriptText = lastResult[0].transcript;

          // Update interim transcript for live captioning
          if (!lastResult.isFinal) {
            setInterimTranscript(transcriptText);
            return;
          }

          // Reset silence timer when speech is detected
          audioRecorder.updateLastSpeechTime();
          
          setInterimTranscript('');
          const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          });
          
          // Debug logging
          console.log("DETECTED SPEECH:", transcriptText);
          
          // Add the new utterance to transcript
          addTranscriptEntry({
            text: transcriptText,
            speaker: 'user',
            timestamp,
          });

          // Force analyze the transcript immediately with no cooldown
          const analysis = analyzeTranscript(transcriptText);
          console.log("SPEECH ANALYSIS RESULT:", analysis);
          
          if (analysis.triggerWords.length > 0) {
            console.log("FOUND TRIGGER WORDS:", analysis.triggerWords);
            setFollowUpQuestions(analysis.questions);
            setShowFollowUp(true);
            
            // Add AI suggestion to transcript
            addTranscriptEntry({
              text: `AI suggests:\n${analysis.questions.map(q => `• ${q}`).join('\n')}`,
              speaker: 'ai',
              type: 'keyword',
              timestamp,
              questions: analysis.questions,
              triggerWords: analysis.triggerWords,
            });
            
            // Get all transcript entries again to make sure we have the latest
            setTimeout(() => {
              const allEntries = useInterviewStore.getState().transcript;
              const userEntries = allEntries.filter(entry => entry.speaker === 'user');
              if (userEntries.length > 0) {
                const lastUserEntry = userEntries[userEntries.length - 1];
                console.log("UPDATING ENTRY WITH TRIGGER WORDS:", lastUserEntry);
                updateTranscriptEntry(lastUserEntry.id, {
                  triggerWords: analysis.triggerWords
                });
              }
            }, 100);
          }
        };

        recognition.onerror = (event) => {
          if (event.error === 'no-speech') return; // Ignore no-speech errors
          console.error('Speech recognition error:', event.error);
          // Only add silence message if we're still recording
          if (isRecording && !isPaused) {
            addTranscriptEntry({
              text: 'Silence detected...',
              speaker: 'system',
              timestamp: new Date().toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              }),
            });
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentLanguage, addTranscriptEntry, updateTranscriptEntry, isRecording, isPaused]);

  // Add a new useEffect to monitor transcript for AI silence suggestions
  useEffect(() => {
    // Check if the latest transcript entry is an AI silence suggestion
    if (transcript.length > 0) {
      const latestEntry = transcript[transcript.length - 1];
      if (latestEntry.speaker === 'ai' && latestEntry.type === 'silence' && latestEntry.questions) {
        // Show the AI questions in the bottom right corner
        setFollowUpQuestions(latestEntry.questions);
        setShowFollowUp(true);
      }
    }
  }, [transcript]);

  const handleStartRecording = async () => {
    clearTranscript(); // Clear previous transcript
    const success = await audioRecorder.startRecording();
    if (success) {
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      startRecordingStore();
      recognitionRef.current?.start();
      addTranscriptEntry({
        text: 'Recording started',
        speaker: 'system',
        timestamp,
      });
    }
  };

  const handleStopRecording = async () => {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    recognitionRef.current?.stop();
    const blob = await audioRecorder.stopRecording();
    if (blob) {
      // setAudioBlob(blob);
    }
    stopRecordingStore();
    
    // Add the "recording stopped" message first
    addTranscriptEntry({
      text: 'Recording stopped',
      speaker: 'system',
      timestamp,
    });

    // Wait a brief moment to ensure the last message is added
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get the latest transcript after adding the "recording stopped" message
    const latestTranscript = useInterviewStore.getState().transcript;

    // Auto-save the interview with proper transcript formatting
    const formattedTranscript = latestTranscript.map(entry => ({
      text: entry.text,
      speaker: entry.speaker,
      timestamp: entry.timestamp,
      type: entry.type,
      triggerWords: entry.triggerWords,
      questions: entry.questions
    }));

    const interview = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      context,
      transcript: formattedTranscript,
      audioUrl: blob ? URL.createObjectURL(blob) : undefined,
    };

    try {
      // Get existing interviews or initialize empty array
      const existingInterviews = JSON.parse(localStorage.getItem('interviews') || '[]');
      
      // Add new interview
      existingInterviews.push(interview);
      
      // Save back to localStorage
      localStorage.setItem('interviews', JSON.stringify(existingInterviews));
      
      console.log('Interview saved successfully:', interview.id);
    } catch (error) {
      console.error('Error saving interview:', error);
    }
  };

  const handlePauseResume = () => {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    if (isPaused) {
      resumeRecording();
      recognitionRef.current?.start();
      addTranscriptEntry({
        text: 'Recording resumed',
        speaker: 'system',
        timestamp,
      });
    } else {
      pauseRecording();
      recognitionRef.current?.stop();
      addTranscriptEntry({
        text: 'Recording paused',
        speaker: 'system',
        timestamp,
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0, sm: 2 } }}>
      {/* Header Section with Responsive Layout */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'center', sm: 'center' }}
        spacing={{ xs: 2, sm: 2 }}
        mb={4}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontSize: { xs: '1.8rem', sm: '2.125rem' },
            textAlign: { xs: 'center', sm: 'left'}
           }}
        >
          Ongoing Interview
        </Typography>
        <Box sx={{ display: 'flex' }}>
          <Button
            variant={currentLanguage === 'en' ? 'contained' : 'outlined'}
            onClick={() => {
              setLanguage('en');
              setShowLanguageAlert(true);
            }}
            disabled={isRecording}
            sx={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRight: currentLanguage === 'en' ? 'none' : '1px solid',
              borderColor: 'primary.main',
              minWidth: '100px',
              bgcolor: currentLanguage === 'en' ? 'primary.main' : 'transparent',
              color: currentLanguage === 'en' ? 'primary.contrastText' : 'primary.main',
              '&:hover': {
                bgcolor: currentLanguage === 'en' ? 'primary.dark' : 'action.hover',
              },
              '&.Mui-disabled': {
                bgcolor: currentLanguage === 'en' ? 'primary.main' : 'transparent',
                color: currentLanguage === 'en' ? 'action.disabled' : 'action.disabled',
                borderColor: 'action.disabledBackground',
                opacity: 0.5
              },
            }}
          >
            English
          </Button>
          <Button
            variant={currentLanguage === 'sv' ? 'contained' : 'outlined'}
            onClick={() => {
              setLanguage('sv');
              setShowLanguageAlert(true);
            }}
            disabled={isRecording}
            sx={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              minWidth: '100px',
              borderColor: 'primary.main',
              bgcolor: currentLanguage === 'sv' ? 'primary.main' : 'transparent',
              color: currentLanguage === 'sv' ? 'primary.contrastText' : 'primary.main',
              '&:hover': {
                bgcolor: currentLanguage === 'sv' ? 'primary.dark' : 'action.hover',
              },
              '&.Mui-disabled': {
                bgcolor: currentLanguage === 'sv' ? 'primary.main' : 'transparent',
                color: currentLanguage === 'sv' ? 'action.disabled' : 'action.disabled',
                borderColor: 'action.disabledBackground',
                opacity: 0.5
              },
            }}
          >
            Swedish
          </Button>
        </Box>
      </Stack>

      <Paper sx={{ p: 3, mb: 3, bgcolor: '#ffffff' }}>
        <Typography variant="h6" gutterBottom>
          Interview Context
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontStyle: !context ? 'italic' : 'normal' }}
        >
          {context || 'No context provided'}
        </Typography>
      </Paper>

      {/* Recording controls */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        {!isRecording ? (
          <Button
            variant="contained"
            onClick={handleStartRecording}
            size="large"
          >
            Start Recording
          </Button>
        ) : (
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handlePauseResume}
            >
              {isPaused ? 'Resume Recording' : 'Pause Recording'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleStopRecording}
            >
              End Interview
            </Button>
          </Stack>
        )}
      </Box>

      <Paper sx={{ p: 3, minHeight: 400, bgcolor: '#ffffff' }}>
        <Typography variant="h6" gutterBottom>
          Transcript
        </Typography>

        {/* Empty state */}
        {transcript.length === 0 && !interimTranscript && (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
            Your transcript will appear here when you start recording
          </Typography>
        )}

        {/* Live caption */}
        {isRecording && interimTranscript && (
          <>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Live Caption:
            </Typography>
            <Box
              sx={{
                py: 1,
                px: 2,
                mb: 2,
                bgcolor: '#F5F5F5',
                borderRadius: 1,
                opacity: 0.9,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                {interimTranscript}
              </Typography>
            </Box>
          </>
        )}

        {/* Transcript entries */}
        {transcript.map((entry, index) => (
          <TranscriptEntry key={index} entry={entry} />
        ))}
      </Paper>

      {showFollowUp && (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
          <FollowUpBanner
            questions={followUpQuestions}
            onClose={() => setShowFollowUp(false)}
          />
        </Box>
      )}

      <Snackbar
        open={showLanguageAlert}
        autoHideDuration={6000}
        onClose={() => setShowLanguageAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowLanguageAlert(false)} severity="info">
          AI features are only available in English
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default OngoingInterview; 