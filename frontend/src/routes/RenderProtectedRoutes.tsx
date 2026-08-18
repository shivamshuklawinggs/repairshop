import { Suspense } from "react";
import { Route as ROUTETYPE } from ".";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

/**
 * Pure function (not a React component) — renders Route elements recursively.
 * Must be called as {RenderProtectedRoutes({ routes })} inside <Routes>/<Route>,
 * NOT as <RenderProtectedRoutes /> — React Router walks children statically
 * and only accepts <Route> or <React.Fragment> as direct children.
 */
export const RenderProtectedRoutes = ({ routes }: { routes: ROUTETYPE[] }): React.ReactNode[] => {
  return routes.map((route: ROUTETYPE) => {
    const RouteElement = () => (
      <ProtectedRoute
        action={route.action}
        resource={route.resource}
      >
        <Suspense fallback={null}>
          {route.element && <route.element />}
        </Suspense>
      </ProtectedRoute>
    );

    if (route.children) {
      return [
        route.element && (
          <Route
            key={route.path}
            path={route.path}
            element={<RouteElement />}
          />
        ),
        ...RenderProtectedRoutes({ routes: route.children })
      ].filter(Boolean) as React.ReactNode[];
    }

    return (
      <Route
        key={route.path}
        path={route.path}
        element={<RouteElement />}
      />
    );
  });
};