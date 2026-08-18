import { Box, TextField, InputAdornment, List, ListItemButton, ListItemText, Typography, Divider, CircularProgress, Fade, Skeleton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

interface TransactionSidebarListProps {
  queryKey: string;
  fetchData: (params: { search: string; limit: number }) => Promise<any[]>;
  navigatePath: string;
  searchPlaceholder: string;
  emptyText: string;
  emptySearchText: string;
}

const TransactionSidebarList: React.FC<TransactionSidebarListProps> = ({
  queryKey,
  fetchData,
  navigatePath,
  searchPlaceholder,
  emptyText,
  emptySearchText,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  const { data: items, isLoading, isFetching } = useQuery({
    queryKey: [queryKey, searchTerm],
    queryFn: () => fetchData({ search: searchTerm, limit: 100 }),
  });

  useEffect(() => {
    if (id && selectedItemRef.current && scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      const selectedItem = selectedItemRef.current;
      const containerHeight = scrollContainer.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemHeight = selectedItem.offsetHeight;
      scrollContainer.scrollTo({ top: itemTop - (containerHeight / 2) + (itemHeight / 2), behavior: 'smooth' });
    }
  }, [id, items]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', maxHeight: '100vh' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)', backgroundColor: 'background.paper', flexShrink: 0 }}>
        <TextField
          size="small"
          fullWidth
          variant="outlined"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box
        ref={scrollContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          height: 0,
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: 'rgba(0, 0, 0, 0.05)', borderRadius: '3px' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(0, 0, 0, 0.2)', borderRadius: '3px', '&:hover': { background: 'rgba(0, 0, 0, 0.3)' } },
        }}
      >
        {isLoading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(8)].map((_, index) => (
              <Skeleton key={index} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1 }} />
            ))}
          </Box>
        ) : items?.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? emptySearchText : emptyText}
            </Typography>
          </Box>
        ) : (
          <Fade in={!isLoading} timeout={300}>
            <List style={{ paddingTop: '0px' }}>
              {items?.map((item: any, index: number) => (
                <React.Fragment key={item._id}>
                  <ListItemButton
                    ref={id === item._id ? selectedItemRef : null}
                    onClick={() => navigate(`${navigatePath}/${item._id}`)}
                    sx={{
                      transition: 'all 0.2s ease-in-out',
                      borderRadius: 0,
                      mx: 0, my: 0, py: 0.2,
                      minHeight: 'auto',
                      ...(id === item._id && { backgroundColor: '#ebebeb', boxShadow: 'none' }),
                      '&:hover': { backgroundColor: id === item._id ? '#ebebeb' : 'action.hover' },
                    }}
                  >
                    <ListItemText
                      primary={item.company}
                      secondary={`${item?.company || ''} • ${item?.email || ''}`}
                      primaryTypographyProps={{ fontWeight: id === item._id ? '600' : '500', noWrap: true, color: id === item._id ? 'primary.dark' : 'text.primary', fontSize: '14px', textTransform: 'uppercase' }}
                      secondaryTypographyProps={{ noWrap: true, color: id === item._id ? 'primary.main' : 'text.secondary', fontSize: '12px' }}
                    />
                  </ListItemButton>
                  {index < (items?.length || 0) - 1 && <Divider variant="inset" component="li" sx={{ ml: 0 }} />}
                </React.Fragment>
              ))}
            </List>
          </Fade>
        )}
        {isFetching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={20} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TransactionSidebarList;
