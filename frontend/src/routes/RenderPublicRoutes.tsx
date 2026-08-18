import { Suspense } from "react";
import { Route } from "react-router-dom";
import { Route as ExtendedRoute } from ".";
export const RenderPublicRoutes = ({ routes }: { routes: ExtendedRoute[] }): React.ReactNode[] => {
  return routes.map(({ path, element: Element }) => (
    <Route
      key={path}
      path={path}
      element={
        <Suspense fallback={null}>
          {Element && <Element />}
        </Suspense>
      }
    />
  ));
};