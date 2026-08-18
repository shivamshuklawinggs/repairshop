import { FC } from 'react';
import {
  Box,
  Typography,
  Grid,
  Rating,
  Stack,
  FormHelperText,
  Tooltip,
  Fade
} from '@mui/material';
import { Controller, FieldError, useFormContext } from 'react-hook-form';
import {
  ChatBubbleOutline,
  DirectionsCar,
  ThumbUp,
} from '@mui/icons-material';
import { getRatingColor } from '@/utils';

interface RatingFormData {
  rating?: {
    communication?: number; // 1-5 stars
    Behavior?: number; // 1-5 stars
    Performance?: number; // 1-5 stars
  };
}

const VendorRatingForm: FC = () => {
  const { control, formState: { errors } } = useFormContext<RatingFormData>();

  const ratingCategories = [
    {
      name: 'communication',
      label: 'Communication',
      icon: <ChatBubbleOutline />,
      description: 'Responsiveness and clarity of communication',
    },
    {
      name: 'Behavior',
      label: 'Behavior',
      icon: <DirectionsCar />,
      description: 'Consistency and dependability',
    },
    {
      name: 'Performance',
      label: 'Performance',
      icon: <ThumbUp />,
      description: 'Professional conduct and behavior',
    },
  ];



  return (
    <Box sx={{
      position: 'relative',
      borderRadius: 0,
      overflow: 'hidden'
    }}>
      <Grid container spacing={2}>
        {/* Rating Categories */}
        {ratingCategories.map((category, index) => (
          <Grid item xs={12} key={category.name}>
            <Box sx={{
              p: 1.5,
              borderRadius: 0.5,
              bgcolor: '#fff',
              border: '1px solid #ddd',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 3px 8px rgba(0,0,0,0.09)',
                bgcolor: '#fff'
              }
            }}>
              {/* Category header */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Tooltip
                  title={category.description}
                  placement="top"
                  TransitionComponent={Fade}
                  TransitionProps={{ timeout: 600 }}
                  arrow
                >
                  <Box
                  sx={{
                    display: 'flex',
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    p: 0.5,
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',

                    '& svg': {
                      fontSize: 16,   // icon size
                      color: 'white', // icon color
                    }
                  }}
                >
                  {category.icon}
                </Box>
                </Tooltip>
                <Typography variant="subtitle2" fontWeight={500} sx={{ color: '#333' }}>
                  {category.label}
                </Typography>
              </Stack>

              <Controller
                name={`rating.${category.name}` as any}
                control={control}
                defaultValue={5}
                render={({ field }) => {
                  const ratingColor = getRatingColor(field.value);
                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Rating
                          {...field}
                          value={field.value || 0}
                          onChange={(_, newValue) => field.onChange(newValue || 0)}
                          size="medium"
                          precision={0.1}
                          sx={{
                            '& .MuiRating-iconFilled': {
                              color: ratingColor,
                            },
                            '& .MuiRating-iconEmpty': {
                              color: '#aaaaaa',
                            },
                          }}
                        />
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: field.value ? ratingColor : 'transparent',
                            color: field.value ? 'white' : 'text.secondary',
                            px: 1.5,
                            py: 0.2,
                            borderRadius: 2,
                            fontWeight: '500',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease',
                            opacity: field.value ? 1 : 0.7
                          }}
                        >
                          {field.value ? `${field.value}/5` : 'Not rated'}
                        </Box>
                      </Box>

                      {/* Error message */}
                      <FormHelperText sx={{ color: 'error.main', mt: 1, ml: 0.5, minHeight: '1.25rem' }}>
                        {(errors.rating?.[category.name as keyof RatingFormData['rating']] as FieldError | undefined)?.message}
                      </FormHelperText>
                    </Box>
                  );
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VendorRatingForm;