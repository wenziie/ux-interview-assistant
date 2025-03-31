import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './styles/theme';
import './styles/global.css';

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
          <main style={{ flex: 1, padding: '2rem' }}>
            <Routes>
              <Route path="/" element={<NewInterview />} />
              <Route path="/interview" element={<OngoingInterview />} />
              <Route path="/archives" element={<Archives />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
