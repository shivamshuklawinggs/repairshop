import React, { useRef, useEffect } from "react";
import { TableContainer, Table, TableHead, TableRow, TableCell, Typography } from "@mui/material";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export interface IPaginatedTableProps<T> {
  data: T[];
  totalLoaded: number;
  totalRecords: number;
  isLoading?: boolean;
  isFetching?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  columns: { key: string; label: string }[];
  renderRow: (item: T, index: number) => React.ReactNode;
  paginationType?: "infinite" | "normal"; // infinite by default
  itemsPerPage?: number;
}

const PaginatedTable = <T,>({
  data,
  totalLoaded,
  totalRecords,
  isLoading,
  isFetching,
  hasNextPage,
  fetchNextPage,
  columns,
  renderRow,
  paginationType = "infinite",
  itemsPerPage = 10,
}: IPaginatedTableProps<T>) => {
  const sentinelRef = useRef<HTMLTableRowElement>(null);
  const shouldObserve = paginationType === "infinite" && hasNextPage;

  useEffect(() => {
    if (!shouldObserve || !fetchNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [shouldObserve, isFetching, fetchNextPage]);

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow >
            {columns.map((col) => (
              <TableCell key={col.key} >
                <Typography title={col.label} className='tellipsis' variant="subtitle2" fontWeight="600" align="center">
                  {col.label}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {data.map((item, index) => renderRow(item, index))}

        {/* Invisible sentinel — triggers fetchNextPage when scrolled into view */}
        {shouldObserve && (
          <TableRow ref={sentinelRef}>
            <TableCell colSpan={columns.length} sx={{ border: 0, py: 0.5 }} />
          </TableRow>
        )}

        {(isLoading || isFetching) && (
          <TableRow>
            <TableCell colSpan={columns.length} align="center">
              <LoadingSpinner />
            </TableCell>
          </TableRow>
        )}

        {!isLoading && totalRecords> 0 &&  (
          <TableRow>
            <TableCell colSpan={columns.length} align="center">
              <Typography variant="body2" color="text.secondary" sx={{ py: 0.7 }}>
                Showing {totalLoaded} of {totalRecords} records
              </Typography>
            </TableCell>
          </TableRow>
        )}
        {!isLoading && totalRecords==0 && (
          <TableCell colSpan={columns.length} align="center" >
            <Typography variant="subtitle2" color="text.secondary" fontWeight="500" align="center" py={1.5}>
              No Records Found
            </Typography>
          </TableCell>
        )}
      </Table>
    </TableContainer>
  );
};

export default PaginatedTable;
