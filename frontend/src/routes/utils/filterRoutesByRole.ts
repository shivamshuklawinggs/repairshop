import {  Role } from '@/types';
import {  roleMenuConfig } from '@/utils/roleHelpers';
import { Route } from '..';
/**
 * Filter routes based on role and menuPermissions
 * - Direct role access (explicit roles or roleMenuConfig) → bypass, always include
 * - No direct role access → fall back to menuPermissions view check
 */
export const filterRoutesByRole = (routes: Route[], userRole: Role, menuPermissions?: any): Route[] => {
  if (!userRole) return [];

  const allowedResources = roleMenuConfig[userRole] || [];

  return routes
    .filter(route => {
      // Check direct role access
      let hasDirectRoleAccess: boolean;
      if (route.roles && route.roles.length > 0) {
        hasDirectRoleAccess = route.roles.includes(userRole);
      } else {
        hasDirectRoleAccess = route.resource.some(r => allowedResources.includes(r));
      }

      // Direct role access → bypass
      if (hasDirectRoleAccess) return true;

      // No direct access → check menuPermissions
      if (menuPermissions) {
        return route.resource.some(r => menuPermissions[r]?.permissions?.view);
      }

      return false;
    })
    .map(route => ({
      ...route,
      children: route.children ? filterRoutesByRole(route.children, userRole, menuPermissions) : undefined,
    }));
};