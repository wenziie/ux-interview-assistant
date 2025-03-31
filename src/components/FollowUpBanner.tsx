import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface FollowUpBannerProps {
  questions: string[];
  triggerWords?: string[];
  onClose: () => void;
}

const FollowUpBanner = ({ questions, triggerWords, onClose }: FollowUpBannerProps) => {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Reset timer and show new questions whenever questions prop changes
  useEffect(() => {
    setProgress(100);
    setIsVisible(true);
    startTimeRef.current = Date.now();
  }, [questions]);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const TOTAL_DURATION = 30000; // Exactly 30 seconds

    // Create a new timer
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, TOTAL_DURATION - elapsed);
      const newProgress = Math.ceil((remaining / TOTAL_DURATION) * 100);

      if (newProgress <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsVisible(false);
        onClose();
        setProgress(0);
      } else {
        setProgress(newProgress);
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 'auto',
        maxWidth: '300px',
        p: 2,
        bgcolor: '#FFF8E1',
        borderRadius: 3,
        borderLeft: '4px solid #FFC107',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#F57C00' }}>
            AI suggests
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress
              variant="determinate"
              value={progress}
              size={24}
              thickness={4}
              sx={{ color: '#F57C00' }}
            />
            <IconButton 
              size="small" 
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              sx={{ 
                width: 24, 
                height: 24,
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Box>
          {questions.map((question, index) => (
            <Typography 
              key={index} 
              variant="body2" 
              sx={{ 
                mb: 1,
                color: '#F57C00',
                '&:last-child': { mb: 0 }
              }}
            >
              • {question}
            </Typography>
          ))}
          {triggerWords && triggerWords.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              Triggered by: {triggerWords.join(', ')}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default FollowUpBanner; 