// =============================================================================
// ACCESSCONTROL CUSTOM IMPLEMENTATION - TYPESCRIPT
// =============================================================================

import { capitalizeFirstLetter } from 'libs';
import { AppError } from 'middlewares/error';
import { Role } from 'microservices/auth-service/types';
import { IUserDocument } from 'models/user.model';
import { companyType } from 'models/company.model';

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
export const ADMIN_ASSIGNABLE_ROLES = [ Role.MANAGER, Role.ACCOUNTANT];
export const MANAGER_ASSIGNABLE_ROLES = [Role.ACCOUNTANT];
export const SUPERADMIN_ASSIGNABLE_ROLES = [Role.ADMIN];
// Role-based menu configurations
export const roleMenuConfig: Record<Role, ResourceType[]> = {
  [Role.SUPERADMIN]: ['superadmin', 'users', 'company', 'profile'],
  [Role.ADMIN]: ['dashboard', 'customers', 'carriers', 'documents', 'expense_service', 'accounting', 'users', 'company', 'profile'],
  [Role.MANAGER]: ['dashboard','users', 'profile'],
  [Role.ACCOUNTANT]: ['dashboard', 'accounting', 'profile'],
};
/**
 * Check whether a creator role is allowed to create a user with the given target role.
 */
export function canCreatorAssignRole(creatorRole: Role, targetRole: Role): boolean {
  switch (creatorRole) {
    case Role.ADMIN:      return ADMIN_ASSIGNABLE_ROLES.includes(targetRole);
    case Role.MANAGER:    return MANAGER_ASSIGNABLE_ROLES.includes(targetRole);
    case Role.SUPERADMIN: return SUPERADMIN_ASSIGNABLE_ROLES.includes(targetRole);
    default:              return false;
  }
}
export const hasRoleAccess = (userRole: Role | undefined, resource: ResourceType[]): boolean => {
  if (!userRole) return false;
  const allowedResources = roleMenuConfig[userRole] || [];
  return resource.some(r => allowedResources.includes(r));
};
export const hasCompanyTypeAccess = (
  userCompanyType: companyType,
  allowedTypes: companyType[]
): boolean => {
  if (!allowedTypes?.length) return true;
  if (!userCompanyType) return false;
  return allowedTypes.includes(userCompanyType);
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
  hasPermission({action,resources,companyType,allowedCompanyTypes}:{action: ActionType, resources: ResourceType[],companyType?:companyType, allowedCompanyTypes?: companyType[]}): boolean {
    const userRole = this.user?.role;

    if (allowedCompanyTypes?.length) {
      if(!companyType){
        return false
      }
      if (!hasCompanyTypeAccess(companyType, allowedCompanyTypes)) {
        return false;
      }
    }
    if (hasRoleAccess(userRole, resources)) {
      return true;
    }

    const hasPermissionForAnyResource = resources.some((res) => {
      const menuPermissions = this.user?.menuPermission;
      if (!menuPermissions) return false;
      const permissions = menuPermissions[res as keyof typeof menuPermissions]?.permissions;
      if (!permissions) return false;
      const checkAction = action === 'view' ? 'view' : action;
      return permissions[checkAction as keyof typeof permissions] ?? false;
    });

    return hasPermissionForAnyResource;

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
    if (this.user.role === Role.MANAGER && !MANAGER_ASSIGNABLE_ROLES.includes(targetRole)) {
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
