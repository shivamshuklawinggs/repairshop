import { SidebarMenuItem, Role } from "@/types";
import baseMenuItems from "./baseMenuItems";
import { paths } from "@/utils/paths";
import { filterByRole as centralizedFilterByRole,} from "@/utils/roleHelpers";

/**
 * Unified filter: direct role access (bypass) -> menuPermissions fallback -> companyType
 */
const filterMenuItems = (items: SidebarMenuItem[], userRole?: Role, menuPermissions?: any): SidebarMenuItem[] => {
  return items
    .filter(item => {
      // 1. Check direct role access
      let hasDirectRoleAccess = false;
      if (item.roles && item.roles.length > 0) {
        hasDirectRoleAccess = !!userRole && item.roles.includes(userRole);
      } else {
        hasDirectRoleAccess = !!userRole && centralizedFilterByRole([item], userRole).length > 0;
      }

      // 2. If no direct role access, check menuPermissions for any of the item's resources
      if (!hasDirectRoleAccess) {
        const hasMenuPermission = item.resource?.some(r => menuPermissions?.[r]?.permissions?.view);
        if (!hasMenuPermission) return false;
      }

   

      return true;
    })
    .flatMap(item => {
      // Special case: ACCOUNTANT accounting children
      if (userRole === Role.ACCOUNTANT && item.path === paths.accounting && item.children && item.children.length > 0) {
        return filterMenuItems(item.children, userRole, menuPermissions);
      }
      // Special case: REPAIR accounting children
      if (item.path === paths.accounting && item.children && item.children.length > 0) {
        return filterMenuItems(item.children, userRole, menuPermissions);
      }

      return [{
        ...item,
        path: userRole === Role.SUPERADMIN && item.title === 'Dashboard' ? paths.superadminDashboard : item.path,
        children: item.children ? filterMenuItems(item.children, userRole, menuPermissions) : undefined,
      }];
    });
};

/**
 * Get menu items filtered by role and company type
 */
export const getMenuItems = (userRole?: Role, menuPermissions?: any): SidebarMenuItem[] => {
  return filterMenuItems([...baseMenuItems], userRole, menuPermissions);
};

// Export the base menu for backward compatibility
export const staticMenuItems = baseMenuItems;