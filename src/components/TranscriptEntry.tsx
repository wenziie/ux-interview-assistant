import { Box, Typography } from '@mui/material';
import { Settings, Person, Lightbulb } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

interface TranscriptEntryProps {
  entry: {
    text: string;
    speaker: 'system' | 'user' | 'ai';
    timestamp: string;
    type?: 'silence' | 'keyword';
    triggerWords?: string[];
  }
}

const TranscriptEntry = ({ entry }: TranscriptEntryProps) => {
  const getSpeakerIcon = (speaker: 'system' | 'user' | 'ai') => {
    switch (speaker) {
      case 'system':
        return <Settings fontSize="small" sx={{ color: 'text.secondary' }} />;
      case 'user':
        return <Person fontSize="small" sx={{ color: '#4A9A8C' }} />;
      case 'ai':
        return <Lightbulb fontSize="small" sx={{ color: '#FFC107' }} />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        py: 1,
        px: 2,
        mb: 1,
        bgcolor: entry.speaker === 'ai' ? '#FFF8E1' : 
                 entry.speaker === 'system' ? '#F5F5F5' : 
                 '#F0F9F6',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        borderLeft: entry.speaker === 'ai' ? '4px solid #FFC107' : 'none',
      }}
    >
      {getSpeakerIcon(entry.speaker)}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 0.5 }}
        >
          {entry.timestamp}
        </Typography>
        
        {entry.speaker === 'ai' ? (
           (() => {
              const parts = entry.text.split('\n\n');
              const label = parts[0];
              const markdownContent = parts.slice(1).join('\n\n');
              
              return (
                <Box sx={{color: '#F57C00'}}>
                  <Typography variant="body1" sx={{ mb: 1.5 }}>
                    {label}
                  </Typography>
                  <Box sx={{
                    '& > *:first-of-type': { marginTop: 0 }, 
                    '& ul': { marginTop: 0, paddingLeft: '20px', marginBottom: '1em' },
                  }}>
                    <ReactMarkdown
                      components={{
                        strong: ({node, ...props}) => 
                          <Typography 
                            variant="subtitle2"
                            component="strong" 
                            sx={{ fontWeight: 'bold', mb: 0.5 }}
                            {...props} 
                          />,
                        li: ({node, ...props}) => 
                          <li style={{ marginTop: 0 }} {...props} />
                      }}
                    >
                      {markdownContent}
                    </ReactMarkdown>
                  </Box>
                </Box>
              );
           })()
        ) : (
          <Typography
            variant="body1"
            sx={{
              color: entry.speaker === 'system' ? 'text.secondary' :
                     '#2A6A5E',
              whiteSpace: 'pre-line',
            }}
          >
            {entry.speaker === 'user' && entry.triggerWords && entry.triggerWords.length > 0 ? (
              <>
                {entry.text.split(new RegExp(`(${entry.triggerWords.map(word => word.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`, 'i')).map((part, i) => {
                  // Check if this part matches any trigger word (case insensitive)
                  const isTrigger = entry.triggerWords?.some(
                    word => part.toLowerCase() === word.toLowerCase()
                  );
                  
                  return isTrigger ? (
                    <span key={i} style={{ backgroundColor: '#FFF59D', padding: '0 2px', borderRadius: '2px', fontWeight: 'bold' }}>
                      {part}
                    </span>
                  ) : (
                    part
                  );
                })}
              </>
            ) : (
              entry.text
            )}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default TranscriptEntry; 