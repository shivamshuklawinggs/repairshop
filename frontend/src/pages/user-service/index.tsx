import React, { useState } from 'react';
import { Box, Button, TableRow, TableCell, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Typography, IconButton } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Add as AddIcon } from '@mui/icons-material';
import { PageHeader, DataTable } from '@/components/ui';
import apiService from '@/service/apiService';
import api from '@/utils/axiosInterceptor';
import UserForm from './UserForm';
import { IUser } from '@/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import VerticalMenu from '@/components/VerticalMenu';
import { withPermission } from '@/hooks/authUtils';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'react-toastify';
import { getIcon } from '@/components/common/icons/getIcon';
import { formatCurrency } from '@/utils';
import { useSorting, createDataTableSortHandler, SortField } from '@/utils/sortingUtils';
import { useNavigate } from 'react-router-dom';
import AppDialog from '@/components/ui/AppDialog';

interface IsuerResponse {
  data: IUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}


const Users: React.FC = () => {
  const navigate=useNavigate()
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<IUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useSelector((state: RootState) => state.user);
  const isSuperAdmin = user?.role === 'superadmin';
   // Reusable sorting hook
      const sorting = useSorting();

const {isLoading,data,refetch} = useQuery<IsuerResponse>({
  queryKey: ['users', currentPage, limit,...sorting.sortFields],
  queryFn: () => apiService.getUsers({ page: currentPage, limit,sortFields:JSON.stringify(sorting.sortFields) }),
});

// Fetch available plans for superadmin
const { data: plansData } = useQuery({
  queryKey: ['plans'],
  queryFn: () => apiService.getPlans(),
  enabled: isSuperAdmin,
});

  const handleEdit = (user: IUser) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleFormClose = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  const handleFormSubmit = async () => {
     refetch();
    handleFormClose();
  };

  const handleDelete = (user: IUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete?._id) return;
    try {
      setIsDeleting(true);
      await apiService.deleteUser(userToDelete._id);
      refetch();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error:any) {
      toast.error(error.message || "Failed To Delte Uset")
      console.warn('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleToggleActivate = async (user: IUser) => {
    try {
    user?._id &&   await apiService.ActivateUser(user._id, !user.isActive);
      refetch();
    } catch (error) {
      console.warn('Error activating user:', error);
    }
  };

  const handleViewMarginReport = (user: IUser) => {
   navigate(`/margin-report/${user._id}`);
  };

  const handleRenewPlan = (user: IUser) => {
    setSelectedUser(user);
    setRenewDialogOpen(true);
  };

  const renewPlanMutation = useMutation({
    mutationFn: ({ userId, planId }: { userId: string; planId: string }) =>
      api.post(`/users/renew-plan/${userId}`, { planId }),
    onSuccess: () => {
      refetch();
      setRenewDialogOpen(false);
      setSelectedPlanId('');
      setSelectedUser(null);
    },
  });

  const handleRenewSubmit = () => {
    if (selectedUser?._id && selectedPlanId) {
      renewPlanMutation.mutate({ userId: selectedUser._id, planId: selectedPlanId });
    }
  };


  return (
    <Box sx={{ minHeight: "100vh" }}>
      <PageHeader
        title="User & Access"
        subtitle="Manage user accounts and permissions"
        actions={
          <Button
            className="themBtn"
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{
              borderRadius: {xs: "6px", md: "6px" },
              boxShadow: "none",
              py: { xs: 0, md: 0.5},
              pr: {xs: 1.5, md:2.5},
              pl: {xs: 1, md:2},
              fontWeight: "500",
              minHeight: { xs: "28px", md: "35px" },
              fontSize: { xs: "13px", md: "14px" },
              "& .MuiButton-startIcon": {
                marginRight: "3px",
              },
              "& .MuiButton-startIcon svg": {
                fontSize: "15px",
              },
            }}
          >
          Add
          </Button>
        }
      />

      <DataTable
        columns={[
          { key: "name", label: "Name",sortable:true },
          { key: "email", label: "Email" ,sortable:true},
          { key: "role", label: "Role",sortable:true },
          { key: "status", label: "Status", align: "center", sortable:true },
          { key: "actions", label: "Actions", align: "center" },
        ]}
        data={data?.data ?? []}
        isLoading={isLoading}
        total={data?.pagination?.total ?? 0}
        page={currentPage - 1}
        rowsPerPage={limit}
        onPageChange={(newPage) => setCurrentPage(newPage + 1)}
        onRowsPerPageChange={(rows) => setLimit(rows)}
        onRequestSort={sorting.handleSort}
        orderBy={sorting.currentSortField}
        orderDirection={sorting.currentSortOrder}
        renderRow={(user) => (
          <TableRow key={user._id} sx={{ "&:last-child td": { border: 0 } }}>
            <TableCell sx={{ whiteSpace: "nowrap" }}>{user.name}</TableCell>
            <TableCell sx={{ textTransform: "lowercase" }}>
              {user.email}
            </TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell align="center">
              <Chip
                size="small"
                label={user.isActive ? "Active" : "Inactive"}
                color={user.isActive ? "success" : "error"}
                sx={{
                  height: "auto",
                  fontSize: "0.75rem",
                }}
              />
            </TableCell>
            <TableCell align="center">
              <VerticalMenu
                actions={[
                  {
                    label: "Edit",
                    onClick: () => handleEdit(user),
                    icon: "edit",
                  },
                  {
                    label: user.isActive ? "Deactivate" : "Activate",
                    onClick: () => handleToggleActivate(user),
                    icon: user.isActive ? "cancel" : "checkCircle",
                  },
                  {
                    label: "Delete",
                    onClick: () => handleDelete(user),
                    icon: "delete",
                  },
                  {
                    label: "View Margin Report",
                    onClick: () => handleViewMarginReport(user),
                    icon: "barChart",
                  },
                  ...(isSuperAdmin && user.role === "admin"
                    ? [
                        {
                          label: "Renew Plan",
                          onClick: () => handleRenewPlan(user),
                          icon: "convert" as const,
                        },
                      ]
                    : []),
                ]}
              />
            </TableCell>
          </TableRow>
        )}
      />

      <UserForm
        open={open}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        user={selectedUser}
      />

      {/* Delete Confirmation Dialog */}
      <AppDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}
        >
          <WarningAmberRoundedIcon color="warning" />
          Delete User
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete{" "}
            <strong>{userToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </AppDialog>

      {/* Plan Renewal Dialog for Superadmin */}
      <AppDialog
        open={renewDialogOpen}
        onClose={() => setRenewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            pb: 1,
            fontWeight: "bold",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Renew Plan for {selectedUser?.name}
          <IconButton
            onClick={() => setRenewDialogOpen(false)}
            size="small"
            sx={{ color: "#101721" }}
          >
            {getIcon("CloseIcon")}
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            //size='small'
            fullWidth
            label="Select Plan"
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            sx={{ mt: 2 }}
          >
            <MenuItem value="">Select a plan...</MenuItem>
            {plansData?.data?.map((plan: any) => (
              <MenuItem key={plan._id} value={plan._id}>
                {plan.name} (${plan.price} - {plan.noOfDays} days,{" "}
                {plan.noOfUsers} users)
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setRenewDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRenewSubmit}
            variant="contained"
            disabled={!selectedPlanId || renewPlanMutation.isPending}
          >
            {renewPlanMutation.isPending ? "Renewing..." : "Renew Plan"}
          </Button>
        </DialogActions>
      </AppDialog>
    </Box>
  );
};

export default withPermission("view",["users","superadmin"])(Users);