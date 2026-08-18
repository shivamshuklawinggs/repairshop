import PageSkeleton from "@/components/common/PageSkeleton";
import { UserPermissionChecker } from "@/hooks/authUtils";
import { useAppSelector } from "@/redux/store";
import { ActionType, ResourceType } from "@/types";
import { paths } from "@/utils/paths";
import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { detectPageType } from "@/utils/pageTypeDetection";
import NotAuthorized from "@/pages/NotAuthorized"; // 👈 your existing NotAuthorized component
interface RouteProps {
  children: React.ReactNode;
  action: ActionType;
  resource: ResourceType[];
}

/**
 * ProtectedRoute
 *
 * • Does NOT call useAuth() — that runs once in RouterConfig so queries
 *   are never duplicated on navigation.
 * • Unauthenticated  → redirect to login
 * • No permission    → render <NotAuthorized /> inside the current layout
 *                       (no full-page redirect, breadcrumb / sidebar stay visible)
 */
export const ProtectedRoute: React.FC<RouteProps> = ({
  children,
  action,
  resource,
}) => {
  const user = useAppSelector((state) => state.user);
  const location = useLocation();

  const checker = useMemo(() => new UserPermissionChecker(user), [user]);
  const pageType = useMemo(() => detectPageType(location.pathname), [location.pathname]);

  // 1. Still loading initial session
  if (user.loading) {
    return <PageSkeleton pageType={pageType} />;
  }

  // 2. Not authenticated → go to login
  if (!user.isAuthenticated) {
    return <Navigate to={`${paths.login}?next=${window.location.pathname}`} replace />;
  }

  // 3. Authenticated but no permission → show NotAuthorized INSIDE the layout
  //    (Layout renders <Outlet />, so children of a <Route> appear there.
  //     Returning the component here keeps the sidebar/header in place.)
  if (!checker.hasPermission(action, resource)) {
    return <NotAuthorized />;
  }

  return <>{children}</>;
};
