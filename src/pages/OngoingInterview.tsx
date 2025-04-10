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
  CircularProgress,
  Collapse,
} from '@mui/material';
import {
  QueryStats,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import axios from 'axios';
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
    assistantMode,
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
  const [bannerQuestions, setBannerQuestions] = useState<string[]>([]);
  const [showBanner, setShowBanner] = useState(false);
  const [showLanguageAlert, setShowLanguageAlert] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [llmAnalysisError, setLlmAnalysisError] = useState<string | null>(null);
  const [isContextExpanded, setIsContextExpanded] = useState(false);

  useEffect(() => {
    console.log(`Setting up SpeechRecognition for language: ${currentLanguage}`);
    let recognition: SpeechRecognition | null = null;
    
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = currentLanguage === 'en' ? 'en-US' : 'sv-SE';

        recognition.onresult = (event) => {
          const lastResult = event.results[event.results.length - 1];
          const transcriptText = lastResult[0].transcript;

          if (!lastResult.isFinal) {
            setInterimTranscript(transcriptText);
            return;
          }

          audioRecorder.updateLastSpeechTime();
          
          setInterimTranscript('');
          const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          });
          
          console.log("DETECTED SPEECH:", transcriptText);
          
          addTranscriptEntry({
            text: transcriptText,
            speaker: 'user',
            timestamp,
          });

          if (assistantMode === 'hardcoded' && currentLanguage === 'en') {
            const analysis = analyzeTranscript(transcriptText);
            console.log("SPEECH ANALYSIS RESULT (Hardcoded logic):", analysis);
            
            if (analysis.triggerWords.length > 0) {
              console.log("FOUND TRIGGER WORDS (Hardcoded logic):", analysis.triggerWords);
              setBannerQuestions(analysis.questions);
              setShowBanner(true);
              
              addTranscriptEntry({
                text: `Assistant suggests:\n${analysis.questions.map(q => `• ${q}`).join('\n')}`,
                speaker: 'ai',
                type: 'keyword',
                timestamp,
                questions: analysis.questions,
                triggerWords: analysis.triggerWords,
              });
              
              setTimeout(() => {
                const allEntries = useInterviewStore.getState().transcript;
                const userEntries = allEntries.filter(entry => entry.speaker === 'user');
                if (userEntries.length > 0) {
                  const lastUserEntry = userEntries[userEntries.length - 1];
                  console.log("UPDATING ENTRY WITH TRIGGER WORDS (Hardcoded logic):", lastUserEntry);
                  updateTranscriptEntry(lastUserEntry.id, {
                    triggerWords: analysis.triggerWords
                  });
                }
              }, 100);
            }
          }
        };

        recognition.onerror = (event) => {
          if (event.error === 'no-speech') { 
              console.log('Speech recognition: no-speech error.');
              return; 
          }
          if (event.error === 'audio-capture') { 
              console.warn('Speech recognition: audio-capture error.');
              return; 
          }
          console.error('Speech recognition error:', event.error, event.message);
        };
        
        recognitionRef.current = recognition;
        
        if (isRecording && !isPaused) {
            console.log('Restarting recognition due to language change while recording.');
            recognitionRef.current?.start();
        }

      } else {
         console.error("Speech Recognition API not supported in this browser.");
      }
    }

    return () => {
      console.log("Cleaning up SpeechRecognition instance.");
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current = null;
      }
      setInterimTranscript(''); 
    };
  }, [currentLanguage, addTranscriptEntry, updateTranscriptEntry, isRecording, isPaused, assistantMode]);

  useEffect(() => {
    if (assistantMode === 'hardcoded' && currentLanguage === 'en') {
      if (transcript.length > 0) {
        const latestEntry = transcript[transcript.length - 1];
        if (latestEntry.speaker === 'ai' && latestEntry.type === 'silence' && latestEntry.questions) {
          console.log("Silence detected (Hardcoded logic), showing banner.");
          setBannerQuestions(latestEntry.questions);
          setShowBanner(true);
        }
      }
    }
  }, [transcript, assistantMode, currentLanguage]);

  const handleStartRecording = async () => {
    clearTranscript();
    const success = await audioRecorder.startRecording(currentLanguage, assistantMode);
    if (success) {
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      startRecordingStore();
      if (recognitionRef.current) {
        console.log("Starting speech recognition...");
        recognitionRef.current.start();
      } else {
        console.error("Cannot start recording: SpeechRecognition not initialized.");
        return;
      }
      addTranscriptEntry({
        text: 'Recording started',
        speaker: 'system',
        timestamp,
      });
    }
  };

  const handleStopRecording = async () => {
    console.log("Stopping speech recognition...");
    recognitionRef.current?.stop();
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    const blob = await audioRecorder.stopRecording();
    if (blob) {
      // setAudioBlob(blob);
    }
    stopRecordingStore();
    
    addTranscriptEntry({
      text: 'Recording stopped',
      speaker: 'system',
      timestamp,
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const latestTranscript = useInterviewStore.getState().transcript;

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
      assistantMode: assistantMode,
      transcript: formattedTranscript,
      audioUrl: blob ? URL.createObjectURL(blob) : undefined,
    };

    try {
      const existingInterviews = JSON.parse(localStorage.getItem('interviews') || '[]');
      
      existingInterviews.push(interview);
      
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
      console.log("Resuming speech recognition...");
      recognitionRef.current?.start();
      addTranscriptEntry({
        text: 'Recording resumed',
        speaker: 'system',
        timestamp,
      });
    } else {
      pauseRecording();
      console.log("Pausing speech recognition...");
      recognitionRef.current?.stop();
      addTranscriptEntry({
        text: 'Recording paused',
        speaker: 'system',
        timestamp,
      });
    }
  };

  const handleAnalyzeNow = async () => {
    if (assistantMode !== 'ai' || isAnalyzing || isPaused) return;

    setIsAnalyzing(true);
    setLlmAnalysisError(null);
    setShowBanner(false);
    console.log('Sending data for LLM analysis:', { context, transcript });

    try {
      const currentTranscript = useInterviewStore.getState().transcript;
      const payload = { context, transcript: currentTranscript };
      const response = await axios.post('http://localhost:5001/api/analyze', payload);
      console.log('LLM Backend response:', response.data);
      
      const analysisText = response.data.analysis || response.data.message || 'Analysis complete.';
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      addTranscriptEntry({
        text: analysisText,
        speaker: 'ai',
        timestamp,
      });
      
      setBannerQuestions([analysisText]);
      setShowBanner(true);

    } catch (error) {
      console.error('Error calling LLM analyze API:', error);
      let errorMessage = 'Failed to get analysis from AI Assistant.';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage += ` Server responded with: ${error.response.data?.message || error.response.statusText}`;
      } else if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
      }
      setLlmAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Container 
      maxWidth="lg" 
      sx={{
         display: 'flex', 
         flexDirection: 'column',
         height: 'calc(100vh - 64px - 16px)',
         py: { xs: 1, sm: 2 },
         px: { xs: 0, sm: 2 },
         gap: 2
      }}
    >
      <Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'center', sm: 'center' }}
          spacing={{ xs: 2, sm: 2 }}
          mb={2}
        >
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ 
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
                if (assistantMode === 'hardcoded') { 
                  setShowLanguageAlert(true);
                }
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
        <Paper sx={{ p: 3, bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1}}>
            <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
              Interview Context
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Assistant Mode Used:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {assistantMode === 'ai' ? 'AI (LLM)' : 'Hardcoded'}
              </Typography>
            </Box>
          </Box>
          {context ? (
            <>
              {!isContextExpanded && (
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  noWrap
                  sx={{ mb: 1 }}
                >
                  {context.split('\n')[0]}
                </Typography>
              )}
              <Collapse in={isContextExpanded} timeout="auto" unmountOnExit>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    mb: 1,
                  }}
                >
                  {context}
                </Typography>
              </Collapse>
              {context && (context.split('\n').length > 2 || context.length > 150) && (
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => setIsContextExpanded(!isContextExpanded)}
                  startIcon={
                    <ExpandMoreIcon 
                      sx={{
                        transform: isContextExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s',
                      }}
                    />
                  }
                  sx={{ 
                    textAlign: 'left', 
                    p: 0,
                    textTransform: 'none',
                    mt: 0.5
                  }}
                >
                  {isContextExpanded ? 'Show Less' : 'Show More'}
                </Button>
              )}
            </>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No context provided
            </Typography>
          )}
        </Paper>
      </Box>

      <Paper sx={{
          p: 3, 
          bgcolor: '#ffffff', 
          flexGrow: 1,
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column'
      }}>
        <Typography variant="h6" gutterBottom>
          Transcript
        </Typography>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pt: 2 }}>
          {transcript.length === 0 && !interimTranscript && (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
              Your transcript will appear here when you start recording
            </Typography>
          )}

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

          {transcript.map((entry, index) => (
            <TranscriptEntry key={entry.id || index} entry={entry} />
          ))}
        </Box>
      </Paper>

      <Box 
        sx={{
          p: 0.5,
          pb: 2,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center' }}> 
          {!isRecording ? (
            <Button
              variant="contained"
              onClick={handleStartRecording}
              size="large"
            >
              Start Recording
            </Button>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                color="primary"
                onClick={handlePauseResume}
              >
                {isPaused ? 'Resume Recording' : 'Pause Recording'}
              </Button>
              
              {assistantMode === 'ai' && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleAnalyzeNow}
                  disabled={isAnalyzing || isPaused}
                  startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : <QueryStats />}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                </Button>
              )}
              
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
      </Box>

      {llmAnalysisError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLlmAnalysisError(null)}>{llmAnalysisError}</Alert>
      )}

      {showBanner && (
        <Box sx={{ position: 'absolute', bottom: 80, right: 24, zIndex: 1300 }}>
          <FollowUpBanner
            questions={bannerQuestions}
            onClose={() => setShowBanner(false)}
          />
        </Box>
      )}

      <Snackbar
        open={showLanguageAlert}
        autoHideDuration={6000}
        onClose={() => setShowLanguageAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowLanguageAlert(false)} severity="info" sx={{ width: '100%' }}>
          Hardcoded assistance is only available in English.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default OngoingInterview; 