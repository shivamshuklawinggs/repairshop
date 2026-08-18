import React, { useEffect } from "react";
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Box,
  Button,
  Typography,
} from "@mui/material";
import { useFormContext } from "react-hook-form";
import { IUser, ResourceType, Role } from "@/types";
import { MenuTitles, defaulUsertValues } from './Schema/userSchema';

export type ActionType = "view" | "create" | "update" | "delete" | "import" | "export";

export interface FilterOption {
  resource: ResourceType[];
  hideActions?: ActionType[];
  hideMenu?: boolean;
}

const allActions: ActionType[] = ["view", "create", "update", "delete", "import", "export"];

const roleFilterOptions: Record<Role, FilterOption[]> = {
  accountant: [],
  admin: [],
  manager: [],
  superadmin: [],
  driver: [],
  carrier: [],
  customer: [],
};

const MenuPermissionsTable: React.FC = () => {
  const { watch, register, setValue } = useFormContext<IUser>();
  const role = watch("role") as Role;

  type MenuKey = keyof IUser['menuPermission'];
  type PermissionKey = keyof IUser['menuPermission'][MenuKey]['permissions'];

const menuRoutes: { title: string; path: MenuKey }[] = Object.keys(
  defaulUsertValues.menuPermission
)
  .filter((key) =>
    role === Role.ACCOUNTANT ? key === "loads" : true
  )
  .map((key) => ({
    title: key,
    path: key as MenuKey,
  }));



  const filterOptions = role ? roleFilterOptions[role] : [];

  const shouldHideAction = (resource: MenuKey, action: PermissionKey) => {
    const option = filterOptions.find(f => f.resource.includes(resource));
    return option?.hideActions?.includes(action as ActionType);
  };

  const shouldHideMenu = (resource: MenuKey) => {
    const option = filterOptions.find(f => f.resource.includes(resource));
    return option?.hideMenu;
  };

  const allpermission = () =>
    menuRoutes.every(route =>
      allActions.every(perm =>
        !shouldHideAction(route.path, perm as PermissionKey)
          ? watch(`menuPermission.${route.path}.permissions.${perm}` as const)
          : true
      )
    );

  const isActionDisabled = (action: ActionType) =>
    role === Role.ACCOUNTANT && action !== 'view';

  const addAllMenus = () => {
    const all = allpermission();
    menuRoutes.forEach(route => {
      allActions.forEach(perm => {
        if (!shouldHideAction(route.path, perm as PermissionKey) && !isActionDisabled(perm as ActionType)) {
          setValue(`menuPermission.${route.path}.permissions.${perm}` as const, !all);
        }
      });
    });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Menu Permissions
        </Typography>
        <Button onClick={addAllMenus}
        variant="outlined"
        size="small"
        sx={{
          borderRadius: {xs: "6px", md: "6px" },
          fontWeight:600,
          fontSize:'0.8rem',
          px:2,
          py:0.2,
        }}>
          {allpermission() ? "Clear" : "Grant"} All Permissions
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Menu</TableCell>
              {allActions.map((action) => (
                <TableCell align="center" key={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {menuRoutes
              .filter(route => !shouldHideMenu(route.path))
              .map(route => (
              <TableRow key={route.path}>
                <TableCell sx={{ textTransform: "capitalize", fontWeight:'600' }}>{route.title}</TableCell>
                {allActions.map(action => {
                  const permKey = action as PermissionKey;
                  const fieldPath = `menuPermission.${route.path}.permissions.${permKey}` as const;

                  return shouldHideAction(route.path, permKey) ? (
                    <TableCell key={action} align="center">
                      —
                    </TableCell>
                  ) : (
                    <TableCell key={action} align="center">
                      <Checkbox
                        {...register(fieldPath)}
                        checked={watch(fieldPath)}
                        disabled={isActionDisabled(action as ActionType)}
                        style={{padding:'2px'}}
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 17,
                          }
                        }}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MenuPermissionsTable;
