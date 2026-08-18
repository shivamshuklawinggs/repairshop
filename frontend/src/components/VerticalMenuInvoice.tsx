// components/VerticalMenuInvoice.tsx
import React, { useState, MouseEvent } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress, Collapse, Box } from '@mui/material';
import { MoreVert as MoreVertIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { getIcon, iconType } from './common/icons/getIcon';

export interface MenuAction {
  label: string;
  description?: React.ReactNode;
  icon?: iconType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  subMenu?: MenuAction[];
}

interface VerticalMenuInvoiceProps {
  actions: (MenuAction | null)[];
  itemHeight?: number;
  width?: string;
}

const VerticalMenuInvoice: React.FC<VerticalMenuInvoiceProps> = ({
  actions,
  itemHeight = 48,
  width = '20ch',
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [openSubIdx, setOpenSubIdx] = useState<number>(-1);

  const open = Boolean(anchorEl);
  const subMenuOpen = Boolean(subMenuAnchorEl);

  const handleOpen = (e: MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    setOpenSubIdx(-1);
    setSubMenuAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpenSubIdx(-1);
    setSubMenuAnchorEl(null);
  };

  const handleSubMenuOpen = (e: MouseEvent<HTMLElement>, idx: number) => {
    e.stopPropagation();
    setSubMenuAnchorEl(e.currentTarget);
    setOpenSubIdx(idx);
  };

  const handleSubMenuClose = () => {
    setSubMenuAnchorEl(null);
    setOpenSubIdx(-1);
  };

  const validActions = actions.filter((action): action is MenuAction => !!action);

  if (validActions.length === 0) return null;

  return (
    <>
      <IconButton
        aria-label="row actions"
        onClick={handleOpen}
        size="small"
        sx={{
          padding: '1px',
          color: 'text.secondary',
          '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
        }}
      >
        <MoreVertIcon fontSize='small' sx={{ color: '#101721' }} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 0,
            minWidth: width,
            maxHeight: itemHeight * 10,
            borderRadius: 1,
            boxShadow: '0 6px 6px -1px rgb(0 0 0 / 25%)',
            '& .MuiMenuItem-root': { borderRadius: 0, mx: 0, my: 0 },
          },
        }}
      >
        {validActions.map((action, idx) => (
          <React.Fragment key={idx}>
            {/* Parent item */}
            <MenuItem
              onClick={(e) => {
                if (action.subMenu?.length) {
                  handleSubMenuOpen(e, idx);
                } else {
                  action.onClick();
                  handleClose();
                }
              }}
              disabled={action.disabled || action.loading}
              sx={{
                py:0.3,
                bgcolor: subMenuOpen && openSubIdx === idx ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: subMenuOpen && openSubIdx === idx ? 'action.selected' : 'action.hover',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <ListItemIcon style={{ minWidth: '23px' }} sx={{ color: '#454545', fontSize: '0.875rem' }}>
                {action.loading
                  ? <CircularProgress size={16} />
                  : getIcon(action.icon, {sx:{ fontSize: '0.875rem' }})
                }
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: subMenuOpen && openSubIdx === idx ? 400 : 400 }}>
                {action.label}
              </ListItemText>
              {action.subMenu && action.subMenu?.length>0 &&(
                <ExpandMoreIcon
                  sx={{
                    fontSize: '1.1rem',
                    ml: 0.5,
                    transition: 'transform 0.2s',
                    transform: subMenuOpen && openSubIdx === idx ? 'rotate(90deg)' : 'rotate(-90deg)',
                  }}
                />
              )}
            </MenuItem>
          </React.Fragment>
        ))}
      </Menu>

      {/* Submenu Menu - appears outside on the left side */}
      {openSubIdx >= 0 && validActions[openSubIdx]?.subMenu && (
        <Menu
          anchorEl={subMenuAnchorEl}
          open={subMenuOpen}
          onClose={handleSubMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
          PaperProps={{
            elevation: 0,
            sx: {
              minWidth: width,
              maxHeight: itemHeight * 10,
              borderRadius: 1,
              boxShadow: '0 6px 6px -1px rgb(0 0 0 / 25%)',
              '& .MuiMenuItem-root': { borderRadius: 0, mx: 0, my: 0},
              '& .MuiList-root': { py: 0.1},
            },
          }}
        >
          {validActions[openSubIdx].subMenu.map((sub, subIdx,) => (
            <MenuItem
              key={subIdx}
              onClick={() => { sub.onClick(); handleClose(); }}
              disabled={sub.disabled || sub.loading}
              sx={{
                alignItems:'flex-start',
                borderBottom:'1px solid #ddd',
                py:1,
                '&:last-child': {borderBottom: 'none'},
              }}
            >
              {/* <ListItemIcon style={{ minWidth: '24px' }} sx={{ color: '#454545', fontSize: '0.875rem', mt:0.4 }}>
                {sub.loading
                  ? <CircularProgress size={16} />
                  : getIcon(sub.icon, {sx:{ fontSize: '1rem' }})
                }
              </ListItemIcon> */}
              <ListItemText
                primary={sub.label}
                secondary={sub.description}
                primaryTypographyProps={{ fontSize: '0.8rem', fontWeight:'500'}}
                secondaryTypographyProps={{ component: 'div' } as any}
              />
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
};

export default VerticalMenuInvoice;
