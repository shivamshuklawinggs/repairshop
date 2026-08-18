import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  IconButton,
  Typography,
  Tooltip,
  Box,
  alpha,
  Popover,
  Skeleton,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { toggleSidebar,setSidebarOpen } from "@/redux/Slice/sidebarSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { UserLogout } from "@/redux/api";
import { getIcon, iconType } from "@/components/common/icons/getIcon";
import {  SidebarMenuItem, SideDrawerProps } from "@/types";
import { hasAccess } from "@/hooks/authUtils";
import { getMenuItems } from "@/redux/InitialData/staticMenuItems";
import { useQueryClient } from "@tanstack/react-query";

const SideDrawer: React.FC<SideDrawerProps> = ({ drawerWidth }) => {
  const qc=useQueryClient()
  const theme = useTheme();
  const isExpanded = useSelector((state: RootState) => state.sidebar.isOpen);
   const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const user = useSelector((state: RootState) => state.user);
  const {primaryColor}=user
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const [menuState, setMenuState] = React.useState<{
    key: string | null
    anchor: HTMLElement | null
  }>({
    key: null,
    anchor: null
  })

  const [nestedMenuState, setNestedMenuState] = React.useState<{
    key: string | null
    anchor: HTMLElement | null
  }>({
    key: null,
    anchor: null
  })

  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const nestedCloseTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const [openMenus, setOpenMenus] = React.useState<Set<string>>(new Set());

  const filteredMenuItems = React.useMemo(() => {
    return getMenuItems(
        user?.user?.role,
        user?.user?.menuPermission
      )
  }, [user?.user?.role]);
  // Generate unique menu key for nested items
  const getMenuKey = (item: SidebarMenuItem, parentKey: string = '') => {
    return parentKey ? `${parentKey}-${item.title}` : item.title;
  };

  const handleNavigate = () => {
  if (isMobile) {
    dispatch(setSidebarOpen(false))
  }
};
  const handleMenuClick = (menuKey: string) => {
    // If sidebar is not expanded, expand it first
    if (!isExpanded) {
      dispatch(toggleSidebar());
    }

    setOpenMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuKey)) {
        newSet.delete(menuKey);
      } else {
        newSet.add(menuKey);
      }
      return newSet;
    });
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (nestedCloseTimeoutRef.current) {
        clearTimeout(nestedCloseTimeoutRef.current);
      }
    };
  }, []);
   React.useEffect(() => {
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
  }, [isMobile]);

  // Recursive component for rendering nested menu items
// Recursive component for rendering nested menu items
const renderNestedMenuItems = (
  items: SidebarMenuItem[],
  parentKey: string = '',
  level: number = 0
) => {
  return items.map((item, index) => {
    const menuKey = getMenuKey(item, parentKey)
    const icon = getIcon(item.icon as iconType)

    const basePath = item.path ? normalizePath(item.path) : ""
    const isActive = basePath && location.pathname.startsWith(basePath)

    const hasChildren = item.children && item.children.length > 0

    const isHovered = menuState.key === menuKey
    const isOpen = openMenus.has(menuKey)

    return (
      <ListItem
        key={`${level}-${index}`}
        disablePadding
        sx={{ px: 1, position: "relative" }}
      >
        <ListItemButton
          className={`menu-${item.title.toLowerCase().replace(/\s+/g, '-')}-tour`}
          component={hasChildren ? "div" : Link}
          to={hasChildren ? undefined : basePath}
          onClick={hasChildren ? () => handleMenuClick(menuKey) : undefined}
          onMouseEnter={
            hasChildren
              ? (e: React.MouseEvent<HTMLElement>) =>
                  handleMenuHover(e, menuKey)
              : undefined
          }
          onMouseLeave={hasChildren ? handleMenuLeave : undefined}
          sx={{
            borderRadius: 1,
            minHeight: Math.max(32 - level * 2, 24),
            bgcolor: isActive ? alpha("#fff", 0.18) : "transparent",
            "&:hover": { bgcolor: alpha("#fff", 0.12) },
            position: "relative",
          }}
        >
          {icon && (
            <ListItemIcon
              sx={{
                color: isActive
                  ? "rgba(255,255,255,1)"
                  : "rgba(255,255,255,0.75)",
                minWidth: Math.max(32 - level * 4, 20),
                "& svg": { fontSize: Math.max(18 - level * 2, 14) }
              }}
            >
              {icon}
            </ListItemIcon>
          )}

          <ListItemText
            primary={item.title}
            primaryTypographyProps={{
              fontSize: Math.max(0.75 - level * 0.05, 0.6),
              fontWeight: isActive ? 600 : 500,
              color: isActive
                ? "rgba(255,255,255,1)"
                : "rgba(255,255,255,0.85)"
            }}
          />

          {hasChildren &&
            (isOpen ? (
              <ChevronRightIcon
                sx={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: Math.max(16 - level, 12),
                  transform: "rotate(90deg)"
                }}
              />
            ) : (
              <ChevronRightIcon
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: Math.max(16 - level, 12)
                }}
              />
            ))}
        </ListItemButton>

        {/* Recursive Popover */}
        {hasChildren && (
          <Popover
            open={isHovered || isOpen}
            anchorEl={menuState.anchor}
            onClose={handlePopoverLeave}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right"
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left"
            }}
            disableRestoreFocus
            sx={{
              "& .MuiPopover-paper": {
                ml: 0.5,
                bgcolor:theme.palette.primary.main,
                backgroundImage: theme.palette.primary.main,
                boxShadow: "4px 4px 20px rgba(0,0,0,0.3)",
                borderRadius: 2,
                minWidth: Math.max(200 - level * 20, 140),
                // ✅ Smooth open/close transition
                transition: 'opacity 200ms ease, transform 200ms ease !important',
                '&::-webkit-scrollbar': {
                  width: 0,
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'transparent',
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }
            }}
          >
            <Box
              onMouseEnter={handlePopoverEnter}
              onMouseLeave={handlePopoverLeave}
              sx={{ py: 1 }}
            >
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 0.5,
                  display: "block",
                  color: "rgba(255,255,255,0.6)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontSize: Math.max(0.65 - level * 0.05, 0.55)
                }}
              >
                {item.title}
              </Typography>

              <List disablePadding>
                {renderNestedMenuItems(
                  item.children!,
                  menuKey,
                  level + 1
                )}
              </List>
            </Box>
          </Popover>
        )}
      </ListItem>
    )
  })
}

  const stripParams = (path: string) => path.split(":")[0].replace(/\/$/, "");
  const normalizePath = (p: string) => stripParams(p);

  const renderMenuItems = (items: SidebarMenuItem[], level = 0) => {
    return items
      .filter((route) => hasAccess(route.resource, "view", user))
      .map((item, index) => {
        const icon = getIcon(item.icon as iconType);
        const basePath = item.path ? normalizePath(item.path) : "";
        const isActive = basePath && location.pathname.startsWith(basePath);
        const hasChildren = item.children && item.children.length > 0;

        if (hasChildren) {
          const isHovered = menuState.key === item.title;
          return (
            <React.Fragment key={`${level}-${index}`}>
              <ListItem disablePadding sx={{ px: 0, mb: 0 }}>
                <Tooltip title={!isExpanded ? item.title : ""} placement="right">
                  <ListItemButton
                    className={`menu-${item.title.toLowerCase().replace(/\s+/g, '-')}-tour`}
                    onMouseEnter={(e) => handleMenuHover(e, item.title)}
                    onMouseLeave={handleMenuLeave}
                    onClick={() => handleMenuClick(item.title)}
                    sx={{
                      borderRadius: 0,
                      px: isExpanded ? level * 1 + 1 : 1.3,
                      py: isExpanded ? level * 0.8 + 0.8 : 1.3,
                      justifyContent: isExpanded ? 'flex-start' : 'center',
                      bgcolor: isActive ? alpha('#fff', 0.2) : 'transparent',
                      '&:hover': { bgcolor:'rgba(0, 0, 0, 0.06)' },
                      minHeight: 30,
                    }}
                  >
                    {icon && (
                      <ListItemIcon sx={{ color: '#696981', minWidth: isExpanded ? 36 : 'unset', justifyContent: 'center', '& svg': { fontSize: { xs: 17, md: 20 } } }}>
                        {icon}
                      </ListItemIcon>
                    )}
                    {isExpanded && (
                      <>
                        <ListItemText style={{margin:'3px 0px'}}
                          primary={item.title}
                          primaryTypographyProps={{ fontSize: { xs: '13px', md: '14px' }, fontWeight: isActive ? 600 : 600, color: '#101721' }}
                        />
                        <ChevronRightIcon sx={{ color: '#696981', fontSize: 20 }} />
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
              {/* Hover Popover for children */}
              <Popover
                open={isHovered}
                anchorEl={menuState.anchor}
                onClose={handlePopoverLeave}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                sx={{
                  pointerEvents: 'none',
                  '& .MuiPopover-paper': {
                    pointerEvents: 'auto',
                    ml: 0.5,
                    bgcolor:'#fff',
                    boxShadow: '4px 4px 20px rgba(0,0,0,0.3)',
                    borderRadius: 1,
                    minWidth: 220,
                    // ✅ Smooth open/close transition
                    transition: 'opacity 200ms ease, transform 200ms ease !important',
                    '&::-webkit-scrollbar': {
                      width: 0,
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'transparent',
                    },
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }
                }}
                disableRestoreFocus
              >
                <Box
                  onMouseEnter={handlePopoverEnter}
                  onMouseLeave={handlePopoverLeave}
                  sx={{ py: 1 }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      py: 0.5,
                      display: 'block',
                      color: '#101721',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.65rem',
                    }}
                  >
                    {item.title}
                  </Typography>
                  <List disablePadding>
                    {item.children?.filter((route) =>hasAccess(route.resource, "view", user)).map((child, childIndex) => {
                      const childIcon = getIcon(child.icon as iconType);
                      const childPath = child.path ? normalizePath(child.path) : "#";
                      const isChildActive = childPath && location.pathname.startsWith(childPath);
                      const hasGrandChildren = child.children && child.children.length > 0;

                      return (
                        <ListItem key={childIndex} disablePadding sx={{ px: 0, position: 'relative' }}>
                          <ListItemButton
                          className={`menu-${child.title.toLowerCase().replace(/\s+/g, '-')}-tour`}
                            component={hasGrandChildren ? 'div' : Link}
                            to={hasGrandChildren ? undefined : childPath}
                            onMouseEnter={hasGrandChildren ? (e: React.MouseEvent<HTMLElement>) => handleNestedMenuHover(e, `${item.title}-${child.title}`) : undefined}
                            onMouseLeave={hasGrandChildren ? handleNestedMenuLeave : undefined}
                            sx={{
                              borderRadius: 0,
                              minHeight: 30,
                              py:0.4,
                              bgcolor: isChildActive ? alpha('#fff', 0.18) : 'transparent',
                              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.06)', borderRadius: 0, },
                              position: 'relative',
                            }}
                          >
                            {childIcon && (
                              <ListItemIcon sx={{ color: isChildActive ? primaryColor || '#1976d2' : '#696981', minWidth: 27, '& svg': { fontSize: { xs: 17, md: 19 } } }}>
                                {childIcon}
                              </ListItemIcon>
                            )}
                            <ListItemText style={{margin:'3px 0px'}}
                              primary={child.title}
                              primaryTypographyProps={{
                                fontSize: { xs: '13px', md: '14px' },
                                fontWeight: isChildActive ? 600 : 600,
                                color: isChildActive ? primaryColor || '#1976d2' : '#101721'
                              }}
                            />
                            {hasGrandChildren && (
                              <ChevronRightIcon sx={{ color: '#696981', fontSize: 20 }} />
                            )}
                          </ListItemButton>

                          {/* Nested Popover for grandchildren */}
                          {hasGrandChildren && (
                            <Popover
                              open={nestedMenuState.key === `${item.title}-${child.title}`}
                              anchorEl={nestedMenuState.anchor}
                              onClose={handleNestedPopoverLeave}
                              anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                              }}
                              transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                              }}
                              sx={{
                                pointerEvents: 'none',
                                '& .MuiPopover-paper': {
                                  pointerEvents: 'auto',
                                  ml: 0.5,
                                  bgcolor: '#fff',
                                  boxShadow: '4px 4px 20px rgba(0,0,0,0.3)',
                                  borderRadius: 1,
                                  minWidth: 200,
                                  // ✅ Smooth open/close transition
                                  transition: 'opacity 200ms ease, transform 200ms ease !important',
                                  '&::-webkit-scrollbar': {
                                    width: 0,
                                  },
                                  '&::-webkit-scrollbar-track': {
                                    background: 'transparent',
                                  },
                                  '&::-webkit-scrollbar-thumb': {
                                    background: 'transparent',
                                  },
                                  scrollbarWidth: 'none',
                                  msOverflowStyle: 'none',
                                }
                              }}
                              disableRestoreFocus
                            >
                              <Box
                                onMouseEnter={handleNestedPopoverEnter}
                                onMouseLeave={handleNestedPopoverLeave}
                                sx={{ py: 1 }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    px: 2,
                                    py: 0.5,
                                    display: 'block',
                                    color: '#101721',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontSize: '0.65rem',
                                  }}
                                >
                                  {child.title}
                                </Typography>
                                <List disablePadding>
                                  {child.children?.filter((route) => hasAccess(route.resource, "view", user,)).map((grandChild, grandChildIndex) => {
                                    const grandChildIcon = getIcon(grandChild.icon as iconType);
                                    const grandChildPath = grandChild.path ? normalizePath(grandChild.path) : "#";
                                    const isGrandChildActive = grandChildPath && location.pathname.startsWith(grandChildPath);

                                    return (
                                      <ListItem key={grandChildIndex} disablePadding sx={{ px: 0 }}>
                                        <ListItemButton
                                          component={Link}
                                          className={`menu-${grandChild.title.toLowerCase().replace(/\s+/g, '-')}-tour`}
                                          to={grandChildPath}
                                          sx={{
                                            borderRadius: 0,
                                            minHeight: 30,
                                            py:0.4,
                                            bgcolor: isGrandChildActive ? alpha('#fff', 0.18) : 'transparent',
                                            '&:hover': { bgcolor:'rgba(0, 0, 0, 0.06)', borderRadius: 0 },
                                            position: 'relative',
                                          }}
                                        >
                                          {grandChildIcon && (
                                            <ListItemIcon sx={{ color: isGrandChildActive ? primaryColor || '#1976d2' : '#696981', minWidth: 27, '& svg': { fontSize: { xs: 17, md: 19 } } }}>
                                              {grandChildIcon}
                                            </ListItemIcon>
                                          )}
                                          <ListItemText style={{margin:'3px 0px'}}
                                            primary={grandChild.title}
                                            primaryTypographyProps={{
                                              fontSize: { xs: '13px', md: '14px' },
                                              fontWeight: isGrandChildActive ? 600 : 600,
                                              color: isGrandChildActive ? primaryColor || '#1976d2' : '#101721'
                                            }}
                                          />
                                        </ListItemButton>
                                      </ListItem>
                                    );
                                  })}
                                </List>
                              </Box>
                            </Popover>
                          )}
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              </Popover>
            </React.Fragment>
          );
        }

        const targetPath = item.path ? normalizePath(item.path) : "#";

        return (
          <ListItem disablePadding key={`${level}-${index}`} sx={{ px: 0, mb: 0.3 }}>
            <Tooltip title={!isExpanded ? item.title : ""} placement="right">
              <ListItemButton
                className={`menu-${item.title.toLowerCase().replace(/\s+/g, '-')}-tour`}
                component={Link}
                onClick={()=>handleNavigate()}
                to={targetPath}
                sx={{
                  borderRadius: 0,
                  px: isExpanded ? level * 1 + 1 : 1.3,
                  py: isExpanded ? level * 0.8 + 0.8 : 1.3,
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  bgcolor: isActive ? alpha('#fff', 0.18) : 'transparent',
                  position: 'relative',
                  minHeight: 30,
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.06)'},
                }}
              >
                {icon && (
                  <ListItemIcon sx={{ color: isActive ? primaryColor || '#1976d2' : '#696981', minWidth: isExpanded ? 36 : 'unset', justifyContent: 'center', '& svg': { fontSize: { xs: 17, md: 20 } } }}>
                    {icon}
                  </ListItemIcon>
                )}
                {isExpanded && (
                  <ListItemText style={{margin:'3px 0px'}}
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: { xs: '13px', md: '14px' },
                      fontWeight: isActive ? 600 : 600, color: isActive ? primaryColor || '#1976d2' : '#101721',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        );
      });
  };

 const handleMenuHover = (
  event: React.MouseEvent<HTMLElement>,
  menuKey: string
) => {
  // ✅ Cancel any pending close so menu stays open when moving into it
  if (closeTimeoutRef.current) {
    clearTimeout(closeTimeoutRef.current)
  }

  setMenuState({
    key: menuKey,
    anchor: event.currentTarget
  })
}

const handleMenuLeave = () => {
  // ✅ Increased from 200ms → 400ms: gives user time to move mouse into popover
  closeTimeoutRef.current = setTimeout(() => {
    setMenuState({
      key: null,
      anchor: null
    })
  }, 300)
}

const handleNestedMenuHover = (
  event: React.MouseEvent<HTMLElement>,
  menuKey: string
) => {
  // ✅ Cancel any pending close so nested menu stays open when moving into it
  if (nestedCloseTimeoutRef.current) {
    clearTimeout(nestedCloseTimeoutRef.current)
  }

  setNestedMenuState({
    key: menuKey,
    anchor: event.currentTarget
  })
}

const handleNestedMenuLeave = () => {
  // ✅ Increased from 200ms → 400ms: smoother feel for nested popovers too
  nestedCloseTimeoutRef.current = setTimeout(() => {
    setNestedMenuState({
      key: null,
      anchor: null
    })
  }, 300)
}

const handlePopoverEnter = () => {
  // ✅ Cancel close when user enters the popover itself
  if (closeTimeoutRef.current) {
    clearTimeout(closeTimeoutRef.current)
  }
}

const handleNestedPopoverEnter = () => {
  // ✅ Cancel close when user enters the nested popover
  if (nestedCloseTimeoutRef.current) {
    clearTimeout(nestedCloseTimeoutRef.current)
  }
}

const handlePopoverLeave = () => {
  // ✅ Small grace delay so menu doesn't snap shut on slight mouse movement
  closeTimeoutRef.current = setTimeout(() => {
    setMenuState({
      key: null,
      anchor: null
    })
  }, 300)
}

const handleNestedPopoverLeave = () => {
  // ✅ Small grace delay for nested popover too
  nestedCloseTimeoutRef.current = setTimeout(() => {
    setNestedMenuState({
      key: null,
      anchor: null
    })
  }, 300)
}

  return (
    <Drawer
      variant="permanent"
      sx={{
        //width: drawerWidth,
        width: {
          xs: isExpanded? 200: 0,
          sm: isExpanded? 220: 75,
        },
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          //width: drawerWidth,
          width: {
          xs: isExpanded? 200: 0,
          sm: isExpanded? 220: 75,
        },
          boxSizing: "border-box",
          bgcolor: theme.palette.primary.main,
          transition: theme.transitions.create(["width", "backgroundImage"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: "hidden",
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      open={isExpanded}
    >
      {/* Logo / Brand Header */}
      <Toolbar
        sx={{
          padding:'0px 16px !important',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          px: isExpanded ? 1.5 : 1,
          minHeight: { xs: 56, sm: 64 },
          bgcolor: '#fff',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Left side - Logo and toggle button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {isExpanded && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: {xs: 23, md: 25},
                  height: {xs: 23, md: 25},
                  borderRadius: 0.5,
                  backgroundColor: `${primaryColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}>F</Typography>
              </Box>
              <Typography
                variant="subtitle1"
                noWrap
                sx={{ color: '#101721', fontWeight: 700, letterSpacing: '0.02em', fontSize: { xs: '0.85rem', md: '0.95rem' } }}
              >
                FreightBooks
              </Typography>
            </Box>
          )}
          <Tooltip title={isExpanded ? 'Collapse' : 'Expand'} placement="right">
            <IconButton
              onClick={() => dispatch(toggleSidebar())}
              size="small"
              sx={{
                color: '#101721',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.51)', color: 'white' },
              }}
            >
              {isExpanded ? <ChevronLeftIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Menu Items */}
      <List sx={{ pt: 1.5, flex: 1, overflowY: 'auto', overflowX: 'hidden', backgroundColor:'#fff' }}>
        {user.loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <ListItem key={i} disablePadding sx={{ px: 1, mb: 0.3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: isExpanded ? 0.8 : 1.3,
                    py: 0.6,
                    width: '100%',
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                  }}
                >
                  <Skeleton variant="circular" width={20} height={20} sx={{ flexShrink: 0 }} />
                  {isExpanded && (
                    <Skeleton
                      variant="text"
                      width={`${50 + (i % 4) * 15}%`}
                      height={18}
                      sx={{ borderRadius: 0.5 }}
                    />
                  )}
                </Box>
              </ListItem>
            ))
          : renderMenuItems(filteredMenuItems as SidebarMenuItem[])}
      </List>

      {/* Logout at bottom */}
      <Box sx={{ pb: 1, backgroundColor:'#fff' }}>
        <Divider sx={{ borderColor: '#0000001a', mx: 0, mb: 0}} />
        <ListItem disablePadding sx={{ px: 0}}>
          <Tooltip title={!isExpanded ? 'Logout' : ''} placement="right">
            <ListItemButton
              onClick={async () =>{
                await qc.cancelQueries();
                qc.removeQueries();
                qc.clear();
                dispatch(UserLogout())

              }}
              sx={{
                borderRadius: 0,
                px:1.2,
                minHeight: 40,
                justifyContent: isExpanded ? 'flex-start' : 'center',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.06)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: isExpanded ? 36 : 'unset', justifyContent: 'center' }}>
                <LogoutIcon sx={{ fontSize: { xs: 17, md: 20 }, color:'#696981' }} />
              </ListItemIcon>
              {isExpanded && (
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{ fontSize: { xs: '13px', md: '14px' }, fontWeight: 600, color: '#101721' }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default SideDrawer;