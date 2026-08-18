import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Typography, List, ListItem, Box, Stack, Button, Chip, Divider } from '@mui/material';
import { ArrowForward as ArrowIcon } from '@mui/icons-material';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'unpaid' | 'overdue' | 'pending';
  amount?: string;
}

const Tasks: React.FC = () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Remind your customers about 4 unpaid invoices',
      description: 'Next time, you can get paid right from an invoice by connecting to',
      status: 'unpaid'
    },
    {
      id: '2',
      title: 'Remind your customers about 4 unpaid invoices',
      description: 'Next time, you can get paid right from an invoice by connecting to',
      status: 'unpaid'
    },
    {
      id: '3',
      title: 'Pay 6 overdue bills',
      description: 'They amount to $5,670.00.',
      status: 'overdue',
      amount: '$5,670.00'
    },
    {
      id: '4',
      title: 'Categorise 20 transactions',
      description: 'They\'re worth up to $7,365.19',
      status: 'pending',
      amount: '$7,365.19'
    }
  ];

  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'unpaid':  return { color: '#f59e0b', bg: '#fff7ed', label: 'Unpaid' };
      case 'overdue': return { color: '#ef4444', bg: '#fff1f2', label: 'Overdue' };
      case 'pending': return { color: '#3b82f6', bg: '#eff6ff', label: 'Pending' };
      default:        return { color: '#6b7280', bg: '#f9fafb', label: status };
    }
  };

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
      <CardContent sx={{ p: '16px 16px 0 !important' }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.06em' }}>
          TASKS
        </Typography>
      </CardContent>
      <List disablePadding sx={{ flex: 1, px: 1, pt: 0.5 }}>
        {tasks.map((task, idx) => {
          const cfg = getStatusConfig(task.status);
          return (
            <React.Fragment key={task.id}>
              <ListItem
                sx={{
                  py: 1.25,
                  px: 0.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }} noWrap>
                    {task.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {task.description}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
                  <Chip
                    label={cfg.label}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.color}30`,
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                  <Button
                    component={Link}
                    to={`/tasks/${task.id}`}
                    size="small"
                    endIcon={<ArrowIcon sx={{ fontSize: '12px !important' }} />}
                    sx={{ minWidth: 'auto', px: 1, py: 0.25, fontSize: '0.7rem', fontWeight: 600 }}
                  >
                    Go
                  </Button>
                </Stack>
              </ListItem>
              {idx < tasks.length - 1 && <Divider sx={{ borderColor: 'divider', mx: 0.5 }} />}
            </React.Fragment>
          );
        })}
      </List>
    </Card>
  );
};

export default Tasks;
