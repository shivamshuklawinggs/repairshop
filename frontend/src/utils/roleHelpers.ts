import { Role, SidebarMenuItem, ResourceType } from "@/types";

// Role-based menu configurations
export const roleMenuConfig: Record<Role, ResourceType[]> = {
  [Role.SUPERADMIN]: ['superadmin', 'users', 'company', 'profile'],
  [Role.ADMIN]: ["InvoiceReminderTemplatesList","advancedSearch",'dashboard', 'customers', 'carriers', 'documents', 'expense_service', 'accounting', 'users', 'company', 'profile'],
  [Role.MANAGER]: ["InvoiceReminderTemplatesList",'dashboard','users', 'profile',"advancedSearch","InvoiceReminderTemplatesList"],

  [Role.ACCOUNTANT]: ['dashboard', 'accounting', 'profile',"advancedSearch","InvoiceReminderTemplatesList",],
  [Role.DRIVER]:['dashboard', "profile"],
  [Role.CARRIER]:['dashboard',"profile"],
  [Role.CUSTOMER]:['dashboard',"profile"],
};

/**
 * Check if a role has access to a specific resource
 * @param userRole - The user's role
 * @param resource - The resource to check access for
 * @returns True if the role has access to the resource
 */
export const hasRoleAccess = (userRole: Role | undefined, resource: ResourceType[]): boolean => {
  if (!userRole) return false;
  const allowedResources = roleMenuConfig[userRole] || [];
  return resource.some(r => allowedResources.includes(r));
};

/**
 * Filter menu items based on role
 */
export const filterByRole = (items: SidebarMenuItem[], userRole?: Role): SidebarMenuItem[] => {
  if (!userRole) return items;

  const allowedResources = roleMenuConfig[userRole] || [];

  const filtered = items.filter(item =>
    item.resource.some(r => allowedResources.includes(r))
  );


  return filtered.flatMap(item => {
    // If role is ACCOUNTANT and this is the accounting parent with children,
    // return the children as top-level items instead
    if (userRole === Role.ACCOUNTANT && item.children && item.children.length > 0) {
      return filterByRole(item.children, userRole);
    }

    return [{
      ...item,
      children: item.children ? filterByRole(item.children, userRole) : undefined,
    }];
  });
};



/**
 * Returns the default landing path for a given role after login
 */
export const getDefaultPathForRole = (role: Role): string => {
  if (role === Role.SUPERADMIN) return '/superadmin/dashboard';
  return '/';
};

/**
 * Checks if a pathname is accessible for a given role.
 * Uses the same logic as filterRoutesByRole in RouterConfig:
 * - explicit `roles` array takes precedence over resource-based check
 * - falls back to roleMenuConfig resource matching
 */
export const isPathAllowedForRole = (
  path: string,
  role: Role,
  routes: { path: string; roles: Role[]; resource: ResourceType[]; children?: any[] }[]
): boolean => {
  const allowedResources = roleMenuConfig[role] || [];

  const check = (list: typeof routes): boolean => {
    for (const route of list) {
      if (route.path) {
        // Build a regex from the route path (convert :param segments to [^/]+)
        const pattern = new RegExp(
          '^' + route.path.replace(/:[^/]+/g, '[^/]+') + '(/.*)?$'
        );
        if (pattern.test(path)) {
          if (route.roles && route.roles.length > 0) {
            return route.roles.includes(role);
          }
          return route.resource.some(r => allowedResources.includes(r));
        }
      }
      if (route.children && check(route.children)) return true;
    }
    return false;
  };

  return check(routes);
};
