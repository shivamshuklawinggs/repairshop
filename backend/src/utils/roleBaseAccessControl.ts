// =============================================================================
// ACCESSCONTROL CUSTOM IMPLEMENTATION - TYPESCRIPT
// =============================================================================

import { capitalizeFirstLetter } from 'libs';
import { AppError } from 'middlewares/error';
import { Role } from 'microservices/auth-service/types';
import { IUserDocument } from 'models/user.model';

// =============================================================================
// 1. TYPE DEFINITIONS
// ===========================================================================
export type ActionType = 'create' | 'view' | 'update' | 'delete' | 'import' | 'export';
export type ResourceType = 'profile' | 'customers' | 'carriers' | 'documents' | 'expense_service' | 'accounting' | 'users' | 'dashboard' | 'company' | 'layout' | 'public' | 'superadmin';

export interface PermissionCheck {
  action: ActionType;
  resource: ResourceType[]
}
export interface PermissionResult {
  granted: boolean;
  attributes?: string[];
}
export const ADMIN_ASSIGNABLE_ROLES = [ Role.ACCOUNTANT];
export const SUPERADMIN_ASSIGNABLE_ROLES = [Role.ADMIN];
// Role-based menu configurations
export const roleMenuConfig: Record<Role, ResourceType[]> = {
  [Role.SUPERADMIN]: ['superadmin', 'users', 'company', 'profile'],
  [Role.ADMIN]: ['dashboard', 'customers', 'carriers', 'documents', 'expense_service', 'accounting', 'users', 'company', 'profile'],
  [Role.ACCOUNTANT]: ['dashboard','users', 'profile','accounting'],
};
/**
 * Check whether a creator role is allowed to create a user with the given target role.
 */
export function canCreatorAssignRole(creatorRole: Role, targetRole: Role): boolean {
  switch (creatorRole) {
    case Role.ADMIN:      return ADMIN_ASSIGNABLE_ROLES.includes(targetRole);
    case Role.SUPERADMIN: return SUPERADMIN_ASSIGNABLE_ROLES.includes(targetRole);
    default:              return false;
  }
}
export const hasRoleAccess = (userRole: Role | undefined, resource: ResourceType[]): boolean => {
  if (!userRole) return false;
  const allowedResources = roleMenuConfig[userRole] || [];
  return resource.some(r => allowedResources.includes(r));
};
// =============================================================================
// 2. PERMISSION CHECKER CLASS (CUSTOM IMPLEMENTATION)
// =============================================================================

export class UserPermissionChecker {
  private user: IUserDocument;

  constructor(user: IUserDocument) {
    this.user = user;
  }

  /**
   * Checks if the user has a specific permission for a given resource.
   * This is the core logic that replaces the `accesscontrol` library.
   */
  hasPermission({action,resources}:{action: ActionType, resources: ResourceType[],}): boolean {
    console.log("action", action);
    console.log("resources", resources);
    const userRole = this.user?.role;
    if (hasRoleAccess(userRole, resources)) {
      return true;
    }
    return false

  }
  // Check specific permission and return Permission object
  can(action: ActionType, resources: ResourceType[]): PermissionResult {
    const hasPermission = this.hasPermission({action:action, resources:resources});
    return { granted: hasPermission, attributes: [] };
  }
  async canUserUpdate(targetRole: Role): Promise<boolean> {
    if (this.user.role === Role.ADMIN && !ADMIN_ASSIGNABLE_ROLES.includes(targetRole)) {
      throw new AppError(
        `Users with the ${capitalizeFirstLetter(this.user.role)} role are not authorized to update users with the ${capitalizeFirstLetter(targetRole)} role.`,
        400
      );
    }
    if (
      this.user.role === Role.SUPERADMIN &&
      !SUPERADMIN_ASSIGNABLE_ROLES.includes(targetRole)
    ) {
      throw new AppError(
        `Users with the ${capitalizeFirstLetter(this.user.role)} role cannot update users with the ${capitalizeFirstLetter(targetRole)} role.`,
        403
      );
    }
  
    return true;
  }
}
