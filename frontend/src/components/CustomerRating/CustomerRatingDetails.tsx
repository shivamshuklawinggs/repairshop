import React from 'react';
import { Box, Paper, Typography, Grid, Rating as MuiRating, Card, CardContent, Avatar, Chip } from '@mui/material';
import { useParams } from 'react-router-dom';
import apiService from '@/service/apiService';
import { getRatingColor, getRatingLabel } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { ICustomer } from '@/types';



const CustomerRatingDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { data: doc, isLoading } = useQuery<ICustomer | null>({
    queryKey: ['customerRatingDetails', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const res = await apiService.getCustomer(customerId)
      return res?.success ? (res.data as ICustomer) : null;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2,
  });
 
  const overallScore = Number(doc?.stars ?? 0);
  const overallColor = getRatingColor(overallScore);
  const overallLabel = getRatingLabel(overallScore);

  if (isLoading) {
    return (
      <Box sx={{ p: 3, minHeight: '100vh' }} />
    );
  }
  return (
    <Box sx={{ p: 0, minHeight: '100vh' }}>
      {/* Info Header */}
      <Paper elevation={0}
      sx={{
      p: 3,
      mb: 3,
      borderRadius: 0.5,
      bgcolor: '#fff',
      border:'1px solid #ddd',
      position: 'relative',
      overflow: 'hidden'
      }}>

      {/* Decorative accent */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: overallColor }} />
        <Grid container>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: overallColor, mr: 1.5 }}>{doc?.company?.charAt(0) || 'C'}</Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{doc?.company || 'Customer'}</Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Chip label={(doc as any)?.status === 'active' ? 'Active' : 'Inactive'} color={(doc as any)?.status === 'active' ? 'success' : 'default'} size="small"
                  sx={{
                    mr: 1.5,
                    height:'auto',
                    fontSize:'12px',
                  }}
                  />
                  <Typography fontSize={13} color="text.secondary" fontWeight={600}>ID: {doc?.id}</Typography>
                </Box>

              </Box>
            </Box>
            <Grid container spacing={0.5} sx={{ mt: 1 }}>
             
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">MC Number</Typography>
                  <Typography variant="body1" fontWeight={500}>{doc?.mcNumber || 'N/A'}</Typography>
                </Grid>
              
           
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">USDOT</Typography>
                  <Typography variant="body1" fontWeight={500}>{doc?.usdot || 'N/A'}</Typography>
                </Grid>
              {doc?.phone && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1" fontWeight={500}>{doc?.phone || 'N/A'}</Typography>
                </Grid>
              )}
              {doc?.email && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1" fontWeight={500}>{doc?.email || 'N/A'}</Typography>
                </Grid>
              )}
            
            </Grid>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={0}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 1,
              position: 'relative',
              overflow: 'hidden',
              border:'1px solid #ddd',
              }}>

              <CardContent sx={{ textAlign: 'center', width: '100%'}}>
                <Typography variant="subtitle1" color="text.primary">Overall Rating</Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb:1, mt:1 }}>
                  <MuiRating value={overallScore} precision={0.1} readOnly size="medium" sx={{ '& .MuiRating-iconFilled': { color: overallColor } }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: '600', color: overallColor, mb: 1 }}>
                  {overallScore.toFixed(1)}
                </Typography>
                <Chip label={overallLabel} sx={{ bgcolor: overallColor, color: 'white', fontWeight: '500', px: 1, py:0.3, borderRadius:2, height:'auto' }} />
              </CardContent>

            </Card>
          </Grid>
        </Grid>
      </Paper>
     
    </Box>
  );
};


export default CustomerRatingDetails;
