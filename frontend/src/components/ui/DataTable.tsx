import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TableFooter,
  Typography,
  Divider,
  alpha,
  Box,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export interface ColumnDef {
  key: string;
  label: string;
  color?:string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  minWidth?: number | string;
  sortable?: boolean;
  disabled?:boolean;
  numeric?: boolean;
}

interface DataTableProps<T> {
  columns: ColumnDef[];
  data: T[];
  isLoading?: boolean;
  renderRow: (item: T, index: number) => React.ReactNode;
  total?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  rowsPerPageOptions?: number[];
  emptyMessage?: string;
  size?: 'small' | 'medium';
  stickyHeader?: boolean;
  extraRow?: React.ReactNode;
  minHeight?: number | string;
  onRequestSort?: (property: string) => void;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  showTotals?: boolean;
}

const DataTable = <T,>({
  columns,
  data,
  isLoading,
  renderRow,
  total,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50],
  emptyMessage = 'No records found',
  size = 'small',
  stickyHeader = false,
  extraRow,
  onRequestSort,
  orderBy,
  orderDirection = 'asc',
  showTotals = false,
}: DataTableProps<T>) => {
  const theme = useTheme();
  const showPagination = total !== undefined && onPageChange && onRowsPerPageChange;

  const calculateTotals = () => {
    const totals: Record<string, number> = {};
    columns.forEach(col => {
      if (col.numeric) {
        totals[col.key] = data.reduce((sum, item) => {
          const value = item[col.key as keyof T];
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);
      }
    });
    return totals;
  };

  const createSortHandler = (property: string, isSortable: boolean) => () => {
    if (isSortable) {
      onRequestSort?.(property);
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 0.5, overflow: 'hidden', mt:1.5 }}>
      <TableContainer>
        <Table size={size} stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  className='tellipsis'
                  sx={{ cursor: col.sortable ? 'pointer' : 'default' }}
                  title={col.label}
                  key={col.key}
                  align={col.align ?? 'left'}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={col.sortable}
                      direction={orderBy === col.key ? orderDirection : 'asc'}
                      onClick={createSortHandler(col.key, col.sortable || false)}
                      sx={{
                         '& svg': {
                          fontSize: 14,
                          color:'#101721 !important',
                        }
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <LoadingSpinner size={32} />
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              <>
                {data.map((item, index) => renderRow(item, index))}
                {extraRow}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <Box>
                   <img src="/empty.png" alt="empty" width={42}/>
                  </Box>
                  <Typography fontSize={15} color="text.secondary" fontWeight={500}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {showTotals && data.length > 0 && (
            <TableFooter>
              <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    align={col.align ?? 'left'}
                    sx={{ fontWeight: 'bold', borderTop: `2px solid ${theme.palette.divider}` }}
                  >
                    {col.numeric ? calculateTotals()[col.key]?.toFixed(2) || '0.00' : ''}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
      {showPagination && (
        <>
          <Divider />
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={rowsPerPageOptions}
            onPageChange={(_, newPage) => onPageChange(newPage)}
            onRowsPerPageChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          />
        </>
      )}
    </Paper>
  );
};

export default DataTable;
