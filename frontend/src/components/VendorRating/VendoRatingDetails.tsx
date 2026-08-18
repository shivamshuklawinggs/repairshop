import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Rating,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Chip
} from '@mui/material';
import { useParams } from 'react-router-dom';
import apiService from '@/service/apiService';
import { ICarrier } from '@/types';
import { getRatingColor, getRatingLabel } from '@/utils';


const VendoRatingDetails: React.FC = () => {
  const { carrierId } = useParams<{ carrierId: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [carrier, setCarrier] = useState<ICarrier | null>(null);
  useEffect(() => {
    const fetchCarrierDetails = async () => {
      if (!carrierId) return;

      try {
        setLoading(true);
        const response = await apiService.getCarrier(carrierId);

        if (response.success && response.data) {
          setCarrier(response.data);
        }
      } catch (error) {
        console.error('Error fetching carrier details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarrierDetails();
  }, [carrierId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center',p: 3, height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const overallScore = carrier?.stars || 0;
  const overallColor = getRatingColor(overallScore);
  const overallLabel = getRatingLabel(overallScore);

  return (
    <Box sx={{ p: 0, minHeight: '100vh' }}>

      {/* Carrier Info Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 0.5,
          bgcolor: '#fff',
          border:'1px solid #ddd',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative accent */}
        <Box
        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: overallColor }}
        />

        <Grid container>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{ width: 36, height: 36, bgcolor: overallColor, mr: 1.5 }}
              >
                {carrier?.company?.charAt(0) || 'C'}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {carrier?.company}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Chip
                    label={carrier?.status ? 'Active' : 'Inactive'}
                    color={carrier?.status==="active" ? 'success' : 'default'}
                    size="small"
                     sx={{
                    mr: 1.5,
                    height:'auto',
                    fontSize:'12px',
                  }}
                  />
                  <Typography fontSize={13} color="text.secondary" fontWeight={600}>
                    ID: {carrier?.id}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Grid container spacing={0.5} sx={{ mt: 1 }}>
              {/* <>
                 <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">MC Number</Typography>
                <Typography variant="body1" fontWeight={500}>{carrier?.mcNumber || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">USDOT</Typography>
                <Typography variant="body1" fontWeight={500}>{carrier?.usdot || 'N/A'}</Typography>
              </Grid>
              </> */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1" fontWeight={500}>{carrier?.phone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1" fontWeight={500}>{carrier?.email || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
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
              }}
            >
              {/* <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  bgcolor: overallColor
                }}
              /> */}

              <CardContent sx={{ textAlign: 'center', width: '100%'}}>
                <Typography variant="subtitle1" color="text.primary">
                  Overall Rating
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb:1, mt:1 }}>
                  <Rating
                    value={overallScore}
                    precision={0.1}
                    readOnly
                    size="medium"
                    sx={{
                      '& .MuiRating-iconFilled': {
                        color: overallColor,
                      }
                    }}
                  />
                </Box>

                <Typography
                  variant="h4" sx={{ fontWeight: '600', color: overallColor, mb: 1 }}
                >
                  {overallScore.toFixed(1)}
                </Typography>

                <Chip
                  label={overallLabel}
                  sx={{ bgcolor: overallColor, color: 'white', fontWeight: '500', px: 1, py:0.3, borderRadius:2, height:'auto' }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

    </Box>
  );
};

export default VendoRatingDetails;
