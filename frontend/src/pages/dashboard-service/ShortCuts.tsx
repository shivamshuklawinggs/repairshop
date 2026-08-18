import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Typography, List, ListItemButton, ListItemIcon, ListItemText, Box, Button, Divider } from '@mui/material';
import { paths } from '@/utils/paths';
import { getIcon } from '@/components/common/icons/getIcon';
import { ArrowForward as ArrowIcon } from '@mui/icons-material';

const shortcutItems = [
  { icon: 'receiptLong', label: 'Create Invoice', path: paths.generateInvoice },
  { icon: 'truck',       label: 'Create Load',    path: paths.createload },
  { icon: 'creditCard',  label: 'Take Payment',   path: paths.paymentterms },
  { icon: 'AttachMoneyIcon', label: 'Pay Bills',  path: paths.billpay },
];

const ShortCuts: React.FC = () => {
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
      <CardContent sx={{ p: '16px 16px 0 !important' }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.06em', mb: 1 }}>
          SHORTCUTS
        </Typography>
      </CardContent>
      <List dense sx={{ flex: 1, px: 1 }}>
        {shortcutItems.map((item, idx) => (
          <React.Fragment key={item.label}>
            <ListItemButton
              component={Link}
              to={item.path}
              sx={{
                borderRadius: 1.5,
                py: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                  '& .shortcut-icon': { color: 'primary.main' },
                },
              }}
            >
              <ListItemIcon
                className="shortcut-icon"
                sx={{ minWidth: 36, color: 'text.secondary', transition: 'color 0.2s', '& svg': { fontSize: 18 } }}
              >
                {getIcon(item.icon as any)}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
              />
            </ListItemButton>
            {idx < shortcutItems.length - 1 && (
              <Divider sx={{ my: 0.25, borderColor: 'divider', mx: 1 }} />
            )}
          </React.Fragment>
        ))}
      </List>
      <Box sx={{ p: 1.5, pt: 0.5 }}>
        <Button
          component={Link}
          to={paths.shortcuts}
          size="small"
          endIcon={<ArrowIcon sx={{ fontSize: '14px !important' }} />}
          sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'primary.main', p: 0 }}
        >
          Show all shortcuts
        </Button>
      </Box>
    </Card>
  );
};

export default ShortCuts;