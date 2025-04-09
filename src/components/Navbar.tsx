import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, useMediaQuery, useTheme } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';

const navItems = [
  { label: 'New Interview', path: '/' },
  { label: 'Archive', path: '/archives' },
  { label: 'About', path: '/about' },
];

const Navbar = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', width: 250 }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Navigation
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton 
              component={Link} 
              to={item.path} 
              selected={location.pathname === item.path}
              sx={{ 
                textAlign: 'center', 
                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                '&.Mui-selected': { 
                  backgroundColor: 'action.selected',
                  color: 'primary.main'
                }
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar position="static" color="default" elevation={1} component="nav">
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
            fontSize: { xs: '1.5rem', sm: '2.125rem' }, // Adjust font size for mobile
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          UX Interview Assistant
        </Typography>

        {/* Show Menu Icon on Mobile */}
        {isMobile ? (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          // Show Buttons on Desktop
          <Box sx={{ display: 'flex', gap: 3 }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                component={Link}
                to={item.path}
                color={location.pathname === item.path ? 'primary' : 'inherit'}
                sx={{
                  color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                  fontSize: '1rem',
                  minWidth: 'auto',
                  px: 2,
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{ 
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Navbar; 