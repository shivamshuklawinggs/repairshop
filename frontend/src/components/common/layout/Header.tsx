import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, IconButton, Typography, Badge, Menu, MenuItem, Tooltip, Box, ListItemIcon, ListItemText, Avatar, Divider, alpha, Skeleton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Menu as MenuIcon, Notifications as NotificationsIcon, Logout as LogoutIcon, PersonOutlined as PersonOutlined, Circle as CircleIcon, DoneAll as DoneAllIcon } from "@mui/icons-material";
import { toggleSidebar } from "@/redux/Slice/sidebarSlice";
import {  ICompany, INotification, Role } from "@/types";
import apiService from "@/service/apiService";
import { paths } from "@/utils/paths";
import { AppDispatch, RootState } from '@/redux/store';
import BusinessIcon from '@mui/icons-material/Business';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SelectCoompany from "./SelectCoompany";
import { toast } from 'react-toastify';
import { logout, setcurrentCompanyDetails } from "@/redux/Slice/UserSlice";
import LoadingSpinner from "../LoadingSpinner";
import { resetAppState } from "@/redux/actions";
import GlobalSearch from "../GlobalSearch/GlobalSearch";
import { HasPermission } from "@/hooks/authUtils";
import TourGuide from "../TourGuide";

interface HeaderProps {
  drawerWidth: number;
}

const Header: React.FC<HeaderProps> = ({ drawerWidth }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const qc=useQueryClient()
  const { user, token,currentCompany} = useSelector((state: RootState) => state.user);
  // Fetch notifications using React Query
  const { data: notifications = [], refetch: refetchNotifications } = useQuery<INotification[]>({
    queryKey: ['notifications', user?._id],
    queryFn: () => apiService.getNotifications().then(res => res.data),
    enabled: !!user?._id && Boolean(token)
  });
  // Fetch notifications using React Query
  const { data: companyDetails ,isLoading:IscCompanyLoading } = useQuery<ICompany>({
    queryKey: ['currentCompany', currentCompany],
    queryFn: () => apiService.getCompany(currentCompany as string).then(res => res.data),
    enabled: !!currentCompany  && Boolean(token)
  });

  // Menu anchors
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const { mutate: updateAllNotification } = useMutation({
    mutationFn: (payload:string) =>
      apiService.updateNotifications(payload,{
        isRead:true
      }),
    onSuccess: () => {
      refetchNotifications();
    }
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiService.logout(),
    onSuccess:async () => {
      dispatch(logout());
      await qc.cancelQueries();
      qc.removeQueries();
      qc.clear();
      dispatch(resetAppState())
      navigate(paths.login, { replace: true });
      toast.success('Logged out successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Logout failed');
    }
  });

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);

  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };
  const handleNotificationItemClick = async (notification: INotification) => {
    const currentclickednotificationIds = notification._id;
    await updateAllNotification(currentclickednotificationIds);
    switch (notification.type) {
      case "ProductServiceReminer":
        navigate(`${paths.accounting+paths.productservices}`);
        break
      default:
        break;
    }
    handleNotificationClose();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    handleUserMenuClose();
  };
  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  useEffect(()=>{
   companyDetails && dispatch(setcurrentCompanyDetails(companyDetails))
  },[companyDetails])
  return (<>
    <TourGuide/>
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        zIndex: theme.zIndex.drawer + 0,
        bgcolor: 'background.paper',
        //borderBottom: `2px solid ${primaryColor}`,
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        color: 'text.primary',
        transition: theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 48, sm: 63 }, gap: 1, justifyContent:'space-between' }}>
        {/* Left side - Mobile menu toggle and Company label */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Mobile menu toggle */}
          <IconButton
            edge="start"
            onClick={() => dispatch(toggleSidebar())}
            sx={{ mr: 1, display: { sm: 'none' }, color: 'text.secondary' }}
          >
            <MenuIcon />
          </IconButton>

          {/* Company label */}
          <Box sx={{ display:{xs:'none', sm:'none', md:'flex'}, alignItems: 'center', gap: 1.5 }}>
              {IscCompanyLoading?(
               <Box
                sx={{
                  width: 160,
                  height: 28,
                  borderRadius: '6px',
                  background: 'linear-gradient(90deg, #eeeeee 25%, #f8f8f8 50%, #eeeeee 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.8s infinite',
                  '@keyframes shimmer': {
                    '0%': {
                      backgroundPosition: '-200% 0',
                    },
                    '100%': {
                      backgroundPosition: '200% 0',
                    },
                  },
                }}
              />
              ):
               companyDetails?.label && (
              <Typography
                fontWeight={600}
                noWrap
                sx={{
                  display:'flex',
                  gap:0.7,
                  color: '#101721', // ✅ use variable
                  maxWidth: 350,
                  padding: '5px 10px',
                  border: `1px solid #ddd`,
                  //border: `1px solid ${companyDetails.color}30`, // ✅ template string
                  //backgroundColor: `${companyDetails.color}10`, // 👈 50% opacity
                  //backgroundColor: alpha(companyDetails.color, 0.10),
                  borderRadius: '6px',
                  fontSize: '13px',
                  textTransform: 'capitalize',
                  fontWeight:'600',
                  letterSpacing:'0.5px',
                }}
              >
                  <BusinessIcon
                    sx={{
                      fontSize: 15,
                      color: alpha(companyDetails.color, 1),
                    }}
                  />{companyDetails.label}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Center - Global Search */}
        <HasPermission action="view" resource={["advancedSearch"]} component={
          <Box sx={{ display: 'flex', justifyContent: 'center', flex: 1, maxWidth: 500 }}>
            <GlobalSearch />
          </Box>
        } />
        {/* Right side - SelectCompany, Notifications, User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap:{ xs: 0.7, md: 2 }}}>
          {user?.role !== Role.SUPERADMIN && <SelectCoompany />}

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              onClick={handleNotificationClick}
              sx={{
                color: 'text.primary',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' },
              }}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}
                sx={{ '& .MuiBadge-badge': { fontSize: '12px', minWidth: 16, height: 16, scale:{ xs: '0.8', md: '1'}, }}}
              >
                <NotificationsIcon sx={{fontSize:{ xs: '18px', md: '21px' }}}/>
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 4,
              sx: {
                mt: 1,
                width: {xs:300, md:300},
                borderRadius: 1,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
                '& .MuiList-root': {
                  py:0.4,
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography fontSize={13} fontWeight={600}>Notifications</Typography>
              {unreadCount > 0 && (
                <Tooltip title="Mark all read">
                  <IconButton size="small" onClick={() => notifications.forEach(n => !n.isRead && updateAllNotification(n._id))}>
                    <DoneAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box sx={{ overflowY: 'auto', maxHeight: 200 }}>
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <MenuItem
                    key={index}
                    onClick={() => handleNotificationItemClick(notification)}
                    sx={{
                      py: 1,
                      px: 1,
                      gap: 1,
                      alignItems: 'flex-start',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      bgcolor: !notification.isRead ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <CircleIcon
                      sx={{
                        fontSize: 5,
                        mt: 0.8,
                        color: !notification.isRead ? 'primary.main' : 'transparent',
                        flexShrink: 0,
                      }}
                    />
                    <Typography sx={{ lineHeight: 1.5, whiteSpace: 'normal', fontSize:'0.8rem', color:'#475363', fontWeight:'300'}}>
                      {notification.message}
                    </Typography>
                  </MenuItem>
                ))
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <NotificationsIcon sx={{ fontSize:{xs:24, md:27}, color: 'text.disabled', mb:0 }} />
                  <Typography variant="body2" color="text.secondary">No notifications</Typography>
                </Box>
              )}
            </Box>
          </Menu>

          {/* User Avatar */}
          <Tooltip title="Account settings">
            <IconButton onClick={handleUserMenuClick} sx={{ p: 0.5, ml:{xs: '0.8', md:'1'}, scale:{xs: '0.8', md:'1'} }}>
              <Avatar
                sx={{
                  width: 30,
                  height: 29,
                  fontSize: '13px',
                  fontWeight: 500,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  cursor: 'pointer',
                }}
              >
                {userInitials}
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Menu
            anchorEl={userMenuAnchorEl}
            open={Boolean(userMenuAnchorEl)}
            onClose={handleUserMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 4,
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            {/* User info header */}
            <Box sx={{ px: 2, py: 0.7, display: 'flex', alignItems: 'start', gap: 1.5 }}>
              <Avatar sx={{ width: 27, height: 27, fontSize: '0.875rem', fontWeight: 600, bgcolor: 'primary.main' }}>
                {userInitials}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize', lineHeight: 1 }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {user?.role}
                </Typography>
              </Box>
            </Box>
            <Divider />
            <MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }} sx={{ pt: 1.5 }}>
              <ListItemIcon style={{ minWidth: '26px' }}>
                <PersonOutlined sx={{ color:'#696981', fontSize:'18px' }} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '13.6px', fontWeight:'500' }}>My Profile</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleLogout} sx={{ pt: 0.5 }}>
              <ListItemIcon style={{ minWidth: '26px' }}>
                <LogoutIcon sx={{ color:'#696981', fontSize:'17px' }} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '13.6px', fontWeight:'500' }}>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
    </>
  );
};

export default Header;