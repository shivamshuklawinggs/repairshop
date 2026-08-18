import { Box, Skeleton, Grid, Container, Stack, Card } from '@mui/material';

/**
 * PageSkeleton Component
 *
 * Renders skeleton loading states for different page types.
 *
 * NOTE: This component only renders the main content area skeleton.
 * Sidebar and header skeletons are handled by the Layout component to avoid duplication.
 */

type PageType = 'dashboard' | 'table' | 'report' | 'form' | 'customer-list' | 'carrier-list' | 'load-list' | 'invoice-list' | 'transaction-list' | 'report-detail' | 'load-details' | 'create-load' | 'edit-transaction' | 'default';

interface PageSkeletonProps {
  pageType?: PageType;
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({ pageType = 'default' }) => {
  const renderPageTitleSkeleton = () => (
    <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
  );

  const renderContentSkeleton = () => {
    switch (pageType) {
      case 'dashboard':
        return (
          <>
            {/* Exact Dashboard Skeleton matching LoadStats + Charts layout */}
            {/* Load Status Cards - matching LoadStats component */}
            <Grid container spacing={1.2} sx={{ mb: 3 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={6} sm={4} md={3} lg={1.5} key={i}>
                  <Skeleton variant="rectangular" width="100%" height={95} sx={{ borderRadius: 1 }} />
                </Grid>
              ))}
            </Grid>

            {/* Charts Row 2 - Three equal charts */}
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4} key={1}>
                <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={12} md={4} key={2}>
                <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={12} md={4} key={3}>
                <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: 2 }} />
              </Grid>
            </Grid>


            {/* Charts Row 1 - ProfitAndLoss */}
            <Grid container spacing={2.5} sx={{ mb: 2.5, mt: 2.5 }}>
              <Grid item xs={12} md={12}>
                <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
              </Grid>
            </Grid>

            {/* Charts Row 2 - Three equal charts */}
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4} key={1}>
                <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={12} md={4} key={2}>
                <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={12} md={4} key={3}>
                <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: 2 }} />
              </Grid>
            </Grid>
          </>
        );

      case 'carrier-list':
        return (
          <>
            {/* Carrier Dashboard Skeleton */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>

            {/* Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5, p: 0, mb: 0, mt: 2.5 }}>
              <Box>
                <Skeleton variant="rectangular" width={250} height={30} sx={{ borderRadius: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Skeleton variant="circular" width={30} height={30} />
                <Skeleton variant="circular" width={30} height={30} />
                <Skeleton variant="circular" width={30} height={30} />
              </Box>
            </Box>

            {/* Table */}
            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1, mb: 1.5, mt: 2 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1, mb: 1.5, opacity: 1 - i * 0.1 }} />
            ))}

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Skeleton variant="text" width={120} height={0} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
                ))}
              </Box>
            </Box>
          </>
        );

      case 'customer-list':
        return (
          <>
            {/* CustomerDashboard Skeleton */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>

            {/* Toolbar - matching customer page exact layout */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 0.5,
                p: 0,
                mb: 0,
                mt: 2.5,
                bgcolor: 'transparent',
                border: 'none',
              }}
            >
              {/* Search Filter */}
              <Box>
                <Skeleton variant="rectangular" width={250} height={30} sx={{ borderRadius: 1 }} />
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Skeleton variant="circular" width={30} height={30} />
                <Skeleton variant="circular" width={30} height={30} />
                <Skeleton variant="circular" width={30} height={30} />
                <Skeleton variant="circular" width={30} height={30} />
              </Box>
            </Box>

            {/* Table */}
            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1, mb: 1.5, mt: 2 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width="100%"
                height={48}
                sx={{ borderRadius: 1, mb: 1.5, opacity: 1 - i * 0.1 }}
              />
            ))}

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Skeleton variant="text" width={120} height={20} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
                ))}
              </Box>
            </Box>
          </>
        );

      case 'load-list':
      case 'invoice-list':
        return (
          <>
            {/* Toolbar with filters and actions */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Skeleton variant="rectangular" width={200} height={36} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={150} height={36} sx={{ borderRadius: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
              </Box>
            </Box>

            {/* Table */}
            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1, mb: 1.5 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1, mb: 1.5, opacity: 1 - i * 0.08 }} />
            ))}

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Skeleton variant="text" width={150} height={0} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
                ))}
              </Box>
            </Box>
          </>
        );

      case 'transaction-list':
        return (
          <>
            {/* Header with customer info */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
              <Skeleton variant="text" width={200} height={28} sx={{ mb: 1 }} />
              <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                <Box>
                  <Skeleton variant="text" width={80} height={16} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width={120} height={20} />
                </Box>
                <Box>
                  <Skeleton variant="text" width={100} height={16} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width={150} height={20} />
                </Box>
                <Box>
                  <Skeleton variant="text" width={90} height={16} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width={100} height={20} />
                </Box>
              </Box>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rectangular" width="100%" height={90} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>

            {/* Transactions Table */}
            <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1, mb: 0.5 }} />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={52} sx={{ borderRadius: 1, mb: 0.5, opacity: 1 - i * 0.1 }} />
            ))}
          </>
        );

      case 'report-detail':
        return (
          <>
            {/* Report Header */}
            <Box sx={{ mb: 3 }}>
              <Skeleton variant="text" width={250} height={32} sx={{ mb: 1 }} />
              <Skeleton variant="text" width={180} height={20} />
            </Box>

            {/* Report Controls */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
              </Box>
            </Box>

            {/* Report Content */}
            <Skeleton variant="rectangular" width="100%" height={500} sx={{ borderRadius: 2, mb: 2 }} />

            {/* Summary Section */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          </>
        );

      case 'edit-transaction':
        return (
          <>
            {/* Transaction Form Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Skeleton variant="text" width={180} height={28} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
              </Box>
            </Box>

            {/* Customer/Vendor Section */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Skeleton variant="text" width={120} height={20} sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                </Grid>
              </Grid>
            </Box>

            {/* Items Table */}
            <Box sx={{ mb: 3 }}>
              <Skeleton variant="text" width={100} height={20} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 1 }} />
            </Box>

            {/* Summary Section */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Skeleton variant="text" width={80} height={20} />
                      <Skeleton variant="text" width={100} height={20} />
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </>
        );

      case 'table':
        return (
          <>
            {/* Filter bar */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
              <Skeleton variant="rectangular" width={180} height={36} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={150} height={36} sx={{ borderRadius: 1 }} />
              <Box sx={{ flexGrow: 1 }} />
              <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
            </Box>

            {/* Table */}
            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1, mb: 1.5 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width="100%"
                height={48}
                sx={{ borderRadius: 1, mb: 1.5, opacity: 1 - i * 0.1 }}
              />
            ))}

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Skeleton variant="text" width={120} height={0} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
                ))}
              </Box>
            </Box>
          </>
        );

      case 'load-details':
        return (
          <>
            {/* Dialog Header Skeleton */}
            <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'start', backgroundColor: 'rgba(0, 0, 0, 0.089)', padding: '15px 30px 8px 30px', gap: 2, mb: 2 }}>
              <Box>
                <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />
                <Skeleton variant="text" width={150} height={16} />
              </Box>
              <Skeleton variant="rectangular" width={60} height={22} sx={{ borderRadius: 1 }} />
            </Box>

            {/* Content Grid */}
            <Grid container spacing={2}>
              {/* Load Information Section */}
              <Grid item xs={12} md={6}>
                <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1, mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                      <Skeleton variant="text" width={80} height={20} />
                      <Skeleton variant="text" width={120} height={20} />
                    </Box>
                  ))}
                </Box>
                <Skeleton variant="text" width={60} height={16} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 0.5 }} />
              </Grid>

              {/* Carrier Details Section */}
              <Grid item xs={12} md={6}>
                <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1, mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                      <Skeleton variant="text" width={80} height={20} />
                      <Skeleton variant="text" width={120} height={20} />
                    </Box>
                  ))}
                </Box>
                <Skeleton variant="text" width={100} height={16} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 0.5 }} />
              </Grid>

              {/* Pickup Locations Section */}
              <Grid item xs={12} md={6}>
                <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1, mb: 2 }} />
                {Array.from({ length: 2 }).map((_, i) => (
                  <Box key={i} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Skeleton variant="text" width={60} height={16} />
                        <Skeleton variant="text" width={150} height={16} />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Skeleton variant="text" width={80} height={16} />
                        <Skeleton variant="text" width={120} height={16} />
                      </Box>
                      <Skeleton variant="text" width={100} height={16} />
                    </Box>
                  </Box>
                ))}
              </Grid>

              {/* Delivery Locations Section */}
              <Grid item xs={12} md={6}>
                <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1, mb: 2 }} />
                {Array.from({ length: 2 }).map((_, i) => (
                  <Box key={i} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Skeleton variant="text" width={60} height={16} />
                        <Skeleton variant="text" width={150} height={16} />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Skeleton variant="text" width={80} height={16} />
                        <Skeleton variant="text" width={120} height={16} />
                      </Box>
                      <Skeleton variant="text" width={100} height={16} />
                    </Box>
                  </Box>
                ))}
              </Grid>

              {/* Documents Section */}
              <Grid item xs={12}>
                <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1, mb: 2 }} />
                <Grid container spacing={1.5}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Grid item xs={6} sm={4} md={3} key={i}>
                      <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 0.5 }} />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>

            {/* Dialog Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
            </Box>
          </>
        );

      case 'create-load':
        return (
          <>
            {/* Stepper Skeleton */}
            <Box sx={{ mb: 4 }}>
              <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1 }} />
            </Box>

            {/* Form Sections */}
            <Container maxWidth="lg">
              <Stack spacing={3}>
                {/* Customer Information Section */}
                <Card sx={{ p: 3 }}>
                  <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Grid item xs={12} md={6} key={i}>
                        <Box sx={{ mb: 2 }}>
                          <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
                          <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Card>

                {/* Load Details Section */}
                <Card sx={{ p: 3 }}>
                  <Skeleton variant="text" width={120} height={24} sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Grid item xs={12} md={6} key={i}>
                        <Box sx={{ mb: 2 }}>
                          <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
                          <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Card>

                {/* Pickup Locations Section */}
                <Card sx={{ p: 3 }}>
                  <Skeleton variant="text" width={130} height={24} sx={{ mb: 2 }} />
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Box key={i} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Skeleton variant="text" width={80} height={20} sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <Grid item xs={12} md={6} key={j}>
                            <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Card>

                {/* Delivery Locations Section */}
                <Card sx={{ p: 3 }}>
                  <Skeleton variant="text" width={140} height={24} sx={{ mb: 2 }} />
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Box key={i} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Skeleton variant="text" width={80} height={20} sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <Grid item xs={12} md={6} key={j}>
                            <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Card>

                {/* Carrier Section */}
                <Card sx={{ p: 3 }}>
                  <Skeleton variant="text" width={80} height={24} sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Grid item xs={12} md={6} key={i}>
                        <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                      </Grid>
                    ))}
                  </Grid>
                </Card>

                {/* Document Upload Section */}
                <Card sx={{ p: 3 }}>
                  <Skeleton variant="text" width={130} height={24} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1, border: '2px dashed', borderColor: 'divider' }} />
                </Card>
              </Stack>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2 }}>
                <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
                </Box>
              </Box>
            </Container>
          </>
        );

      case 'report':
        return (
          <>
            {/* Report Controls */}
            <Box sx={{ display: 'flex', gap: 1, mb: 4.5, flexWrap: 'wrap' }}>
              <Skeleton variant="rectangular" width={350} height={30} sx={{ borderRadius: 1 }} />
            </Box>
            {/* Report Content */}
            <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 2, mb: 2 }} />

          </>
        );

      case 'form':
        return (
          <>
            {/* Form Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Skeleton variant="text" width={150} height={24} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
              </Box>
            </Box>

            {/* Form Fields */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Box key={i}>
                  <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                </Box>
              ))}

              {/* Multi-column fields */}
              <Grid container spacing={2}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Grid item xs={12} md={6} key={i}>
                    <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        );

      default:
        return (
          <>
            {/* Default content */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
              <Skeleton variant="rectangular" width={180} height={36} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
              <Box sx={{ flexGrow: 1 }} />
              <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
            </Box>

            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1, mb: 1.5 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width="100%"
                height={48}
                sx={{ borderRadius: 1, mb: 1.5, opacity: 1 - i * 0.1 }}
              />
            ))}
          </>
        );
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 2, sm: 3 },
        pt: 2,
        pb: 4,
      }}
    >
      {renderPageTitleSkeleton()}
      {renderContentSkeleton()}
    </Box>
  );
};

export default PageSkeleton;
