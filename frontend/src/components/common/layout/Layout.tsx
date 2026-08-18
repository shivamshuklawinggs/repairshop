import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Toolbar, Breadcrumbs, Link, Chip,IconButton } from '@mui/material';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon,ArrowBack as ArrowBackIcon  } from '@mui/icons-material';
import AppHeader from './Header';
import SideDrawer from './Sidebar/Index';
import { RootState } from '@/redux/store';
import { protectedRoutes,Route } from '@/routes';
import { useAuth } from '@/hooks/authUtils';


// Helper function to find route by path
// Returns an array of matched routes (from root -> leaf)
const findRouteChain = (routes: Route[], path: string): Route[] | null => {
  for (const route of routes) {

    // Direct match
    if (route.path === path) {
      return [route];
    }

    // Dynamic match
    if (route.path.includes(':')) {

      const routePathPattern = route.path.replace(/:\w+/g, '[^/]+');
      const regex = new RegExp(`^${routePathPattern}$`);
      if (regex.test(path)) {
        return [route];
      }
    }

    // Children recursion
    if (route.children) {
      const childChain = findRouteChain(route.children, path);
      if (childChain) {
        return [route, ...childChain];
      }
    }
  }

  return null;
};


const Layout: React.FC = () => {
  useAuth()
  const isSidebarExpanded = useSelector((state: RootState) => state.sidebar.isOpen);
  const drawerWidth = isSidebarExpanded ? 220 : 75;
  const location = useLocation();
  const navigate = useNavigate();
  const {primaryColor} = useSelector((state: RootState) => state.user);
  // get full breadcrumb chain
  const routeChain = findRouteChain(protectedRoutes, location.pathname) || [];

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <AppHeader drawerWidth={drawerWidth} />
      <SideDrawer drawerWidth={drawerWidth} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, sm: 3 },
          pt: 2,
          pb: 4,
          bgcolor: 'background.default',
          overflowY: 'auto',
          overflowX: 'hidden',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          transition: theme =>
            theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        <Toolbar />
        {/* Breadcrumb Bar */}
        <Box
          sx={{
            mb: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Back Button */}
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{ mr:{ xs: 0.5, md: 1 }, color:'text.secondary'}}
          >
            <ArrowBackIcon sx={{ fontSize: { xs: 15, md: 17 } }} />
          </IconButton>
          <Breadcrumbs
            separator={<NavigateNextIcon sx={{ fontSize: 14, color: 'text.disabled' }} />}
            aria-label="breadcrumb"
            sx={{
              fontSize: { xs: '0.8rem', md: '0.875rem' },
              '& .MuiBreadcrumbs-separator': {
                mx: { xs: 0.3, md: 0.5 },
              },
            }}
          >
            <Link
              color="inherit"
              onClick={() => navigate('/')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.4,
                textDecoration: 'none',
                cursor: 'pointer',
                color: 'text.secondary',
                fontSize: { xs: '0.8rem', md: '0.875rem' },
                fontWeight: 500,
                '&:hover': { color: 'primary.main' },
              }}
            >
              <HomeIcon sx={{ fontSize: 16, display:{ xs: 'none', md: 'block' } }} />
              Home
            </Link>
            {routeChain.map((route, idx) =>
              idx < routeChain.length - 1 ? (
                <Link
                  key={idx}
                  onClick={() =>route.element && navigate(route.path || '/')}
                  sx={{
                    height: 'auto',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    color: 'text.secondary',
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 500,
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {route.title}
                </Link>
              ) : (
                <Chip
                  key={idx}
                  label={route.title}
                  size="small"
                  sx={{
                    height: 'auto',
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 500,
                    borderRadius:0.4,
                    //bgcolor: primaryColor,
                    bgcolor: 'transparent',
                    //color: 'primary.contrastText',
                    color: 'text.secondary',
                    '& .MuiChip-label': { px: 0 },
                  }}
                />
              )
            )}
          </Breadcrumbs>
        </Box>
        <Outlet />
      </Box>
    </Box>
  );
};


export default Layout;