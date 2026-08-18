import { Pagination, TablePagination } from '@mui/material';
import React from 'react';
interface IPaginate {
  type:'table' | 'pagination',
  limit:number,
  setLimit: React.Dispatch<React.SetStateAction<number>>
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
  currentPage: number,
  count:number
}
const PaginationComponent = ({type="pagination",limit,setLimit,count,setCurrentPage,currentPage}: IPaginate) => {
  const jump = (page:number) => {
    setCurrentPage(Math.max(1, page));
  };
  const totalPages = Math.ceil(count / limit);
  return type=="table"?
    <TablePagination 
      rowsPerPageOptions={[5, 10, 25]}
      component="div"
      count={count}
      rowsPerPage={limit}
      page={currentPage - 1}
      onPageChange={(_, page) => jump(page + 1)}
      onRowsPerPageChange={(event) => {
        setLimit(parseInt(event.target.value, 10));
        setCurrentPage(1);
      }}
    />:
    (
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={(_, page) => jump(page)}
        variant="outlined"
        shape="rounded"
        color="primary"
        showFirstButton
        showLastButton
      />
    )
};

export default PaginationComponent;