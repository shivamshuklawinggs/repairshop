import { ActionType, ResourceType } from '@/types';
import { UserState, logout } from '@/redux/Slice/UserSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/utils/paths';
import { fetchCurrentCompany, fetchCurrentUser } from '@/redux/api';
import { getMenuItems } from '@/redux/InitialData/staticMenuItems';
import {  hasRoleAccess } from '@/utils/roleHelpers';
import { useQueryClient } from '@tanstack/react-query';

// Actions that require company access
const UNAUTHORIZED_ACTIONS: ActionType[] = ['create', 'delete', 'update', 'export', 'import'];

// =============================================================================
// 1. USER PERMISSION CHECKER CLASS
// =============================================================================

export class UserPermissionChecker {
  private user: UserState;

  constructor(user: UserState) {
    this.user = user;
  }

  hasPermission(
    action: ActionType,
    resource: ResourceType[],
  ): boolean {
    const userRole = this.user?.user?.role;
   

    if (resource.includes('layout')) {
      return true;
    }

    if (hasRoleAccess(userRole, resource)) {
      return true;
    }

    const hasPermissionForAnyResource = resource.some((res) => {
      const menuPermissions = this.user?.user?.menuPermission;
      if (!menuPermissions) return false;
      const permissions = menuPermissions[res as keyof typeof menuPermissions]?.permissions;
      if (!permissions) return false;
      const checkAction = action === 'view' ? 'view' : action;
      return permissions[checkAction as keyof typeof permissions] ?? false;
    });

    return hasPermissionForAnyResource;
  }
}

// =============================================================================
// 2. UTILITY & ROUTE ACCESS FUNCTIONS
// =============================================================================

export const hasAccess = (
  routeKey: ResourceType[],
  action: ActionType,
  user: UserState | null,
): boolean => {
  if (!user) return false;
  const checker = new UserPermissionChecker(user as UserState);
  if (!user.currentCompany && UNAUTHORIZED_ACTIONS.includes(action)) return false;
  return checker.hasPermission(action, routeKey);
};

export const HasPermission = ({
  action,
  resource,
  component,
}: {
  action: ActionType;
  resource: ResourceType[];
  component: React.ReactNode;
}): React.ReactNode => {
  const user = useSelector((state: RootState) => state.user);
  const checker = useMemo(() => new UserPermissionChecker(user), [user]);

  if (!user) return null;
  if (!user.currentCompany && UNAUTHORIZED_ACTIONS.includes(action)) return null;
  return checker.hasPermission(action, resource) ? component : null;
};

export function withPermission(
  action: ActionType,
  resource: ResourceType[],
) {
  return function <P extends object>(WrappedComponent: React.ComponentType<P>) {
    const ComponentWithPermission = (props: P) => (
      <HasPermission
        action={action}
        resource={resource}
        component={<WrappedComponent {...props} />}
      />
    );

    ComponentWithPermission.displayName = `WithPermission(${WrappedComponent.displayName || WrappedComponent.name
      })`;

    return ComponentWithPermission;
  };
}

export const getFilteredMenuItems = (user: UserState) => {
  return getMenuItems(
    user?.user?.role,
    user?.user?.menuPermission
  );
};

// =============================================================================
// 3. useAuth — call ONCE in RouterConfig (not per route/page)
//
//  • fetchCurrentUser  → fires on mount and whenever `token` changes
//  • fetchCurrentCompany → fires on mount and whenever `currentCompany` changes
//  • Navigation between pages never re-triggers either call
//  • No useRef, no React Query — plain useEffect + Redux dispatch
// =============================================================================

export const useAuth = () => {
  const qc = useQueryClient()
  const token = useSelector((state: RootState) => state.user.token);
  const currentCompany = useSelector((state: RootState) => state.user.currentCompany);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Fetch user on mount and whenever token changes (login / token refresh)
  useEffect(() => {
    if (!token) return;

    dispatch(fetchCurrentUser())
      .unwrap()
      .catch(async (error) => {
        console.error('Error fetching user:', error);
        dispatch(logout());
        await qc.cancelQueries();
        qc.removeQueries();
        qc.clear();
        navigate(`${paths.login}?next=${window.location.pathname}`);
      });
  }, [token]); // ← only re-runs when token value itself changes

  // Fetch company on mount and whenever the selected company changes
  useEffect(() => {
    if (!currentCompany || !token) return;

    dispatch(fetchCurrentCompany({ companyId: currentCompany }))
      .unwrap()
      .catch((error) => {
        console.error('Error fetching company:', error);
      });
  }, [currentCompany]); // ← only re-runs when currentCompany value changes
};
