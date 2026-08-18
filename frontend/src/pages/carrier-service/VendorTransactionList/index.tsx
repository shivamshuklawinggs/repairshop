import React, { useState } from 'react';
import { Box, Drawer, IconButton, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CustomerTransactions from './CustomerTransactions';
import CustomersListSidebar from './CustomersList';
import { withPermission } from '@/hooks/authUtils';

const DRAWER_WIDTH = 300;

const CustomerTransactionList: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{
          width: { md: DRAWER_WIDTH },
          flexShrink: { md: 0 },
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              height: '100%',
              position: 'relative',
              zIndex: '0',
              borderRadius: 0.5,
              mt: 5.7,
            },
          }}
        >
          <CustomersListSidebar />
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 0, md: 3 },
          pt: { xs: 0, md: 0 },
          pb: { xs: 0, md: 0 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: '100%',
          overflow: 'auto',
          marginTop: { xs: '20px', md: 0 },
          position: 'relative',
        }}
      >

        {/* Mobile Drawer Toggle Button */}

        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            padding: '5px',
            position: 'absolute',
            top: 0,
            left: 15,
            border: '1px solid #383e4b80',
            zIndex: theme.zIndex.drawer + 0,
            display: { sm: 'none' },
            backgroundColor: 'background.paper',
            borderRadius: '7px',
          }}
        >
          <MenuIcon sx={{ fontSize: '21px' }} />
        </IconButton>

        <CustomerTransactions />
      </Box>
    </Box>
  );
};

export default withPermission("view", ["accounting"])(CustomerTransactionList);