import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider
} from '@mui/material';
import { Info, CheckCircle, Warning } from '@mui/icons-material';

interface PlanDetailsProps {
  planDetails: {
    name: string;
    description: string;
    price: number;
    noOfDays: number;
    maxUsers: number;
    usersUsed: number;
    usersRemaining: number;
    expires: string;
    daysRemaining: number;
    isExpired: boolean;
  };
}

const PlanDetails: React.FC<PlanDetailsProps> = ({ planDetails }) => {
  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: '1px solid #e2e8f0'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Info sx={{ mr: 1, color: '#a9a9a9' }} />
          <Typography variant="h6" component="h2">
            Plan Details
          </Typography>
        </Box>

        <Grid container spacing={1}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Plan Name
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {planDetails.name}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Price
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              ${planDetails.price}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Duration
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {planDetails.noOfDays} days
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Chip
              icon={planDetails.isExpired ? <Warning /> : <CheckCircle />}
              label={planDetails.isExpired ? 'Expired' : 'Active'}
              color={planDetails.isExpired ? 'error' : 'success'}
              size="small"
              sx={{fontSize:'12px'}}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary">
              Max Users Allowed
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {planDetails.maxUsers}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary">
              Users Used
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {planDetails.usersUsed}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary">
              Users Remaining
            </Typography>
            <Typography
              variant="body2"
              fontWeight={600}
              color={planDetails.usersRemaining <= 0 ? 'error.main' : 'success.main'}
            >
              {planDetails.usersRemaining}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Expiration Date
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {planDetails.expires ? new Date(planDetails.expires).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Days Remaining
            </Typography>
            <Typography
              variant="body2"
              fontWeight={600}
              color={planDetails.daysRemaining <= 0 ? 'error.main' : planDetails.daysRemaining <= 7 ? 'warning.main' : 'success.main'}
            >
              {planDetails.daysRemaining} days
            </Typography>
          </Grid>

          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {planDetails.description}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PlanDetails;