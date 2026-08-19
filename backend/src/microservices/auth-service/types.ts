export enum Role {
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
  ACCOUNTANT = 'accountant',
}

export const ROLES = Object.values(Role);
export const VisibleCompanyAssignedRoles = [Role.ACCOUNTANT];
export const UnAuthRoles = Object.values(Role).filter((role) => role !== Role.SUPERADMIN)



