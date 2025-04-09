import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './styles/theme';
import './styles/global.css';
import { Box } from '@mui/material';

// Pages
import NewInterview from './pages/NewInterview';
import OngoingInterview from './pages/OngoingInterview';
import Archives from './pages/Archives';
import About from './pages/About';

// Components
import Navbar from './components/Navbar';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Navbar />
          <Box 
            component="main" 
            sx={{ 
              flex: 1, 
              padding: { 
                xs: '1rem 0.5rem',
                sm: '2rem' 
              }
            }}
          >
            <Routes>
              <Route path="/" element={<NewInterview />} />
              <Route path="/interview" element={<OngoingInterview />} />
              <Route path="/archives" element={<Archives />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
