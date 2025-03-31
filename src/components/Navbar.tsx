import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography
          variant="h4"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'text.primary',
            fontWeight: 700,
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          UX Interview Assistant
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Button
            component={Link}
            to="/"
            color={location.pathname === '/' ? 'primary' : 'inherit'}
            sx={{ 
              color: location.pathname === '/' ? 'primary.main' : 'text.secondary',
              fontSize: '1rem',
              minWidth: 'auto',
              px: 2
            }}
          >
            New Interview
          </Button>
          <Button
            component={Link}
            to="/archives"
            color={location.pathname === '/archives' ? 'primary' : 'inherit'}
            sx={{ 
              color: location.pathname === '/archives' ? 'primary.main' : 'text.secondary',
              fontSize: '1rem',
              minWidth: 'auto',
              px: 2
            }}
          >
            Archive
          </Button>
          <Button
            component={Link}
            to="/about"
            color={location.pathname === '/about' ? 'primary' : 'inherit'}
            sx={{ 
              color: location.pathname === '/about' ? 'primary.main' : 'text.secondary',
              fontSize: '1rem',
              minWidth: 'auto',
              px: 2
            }}
          >
            About
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 