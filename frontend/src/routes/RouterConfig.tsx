import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { routes, protectedRoutes } from '.';
import Layout from '@/components/common/layout/Layout';
import { RenderPublicRoutes } from './RenderPublicRoutes';
import { RenderProtectedRoutes } from './RenderProtectedRoutes';
/**
 * RouterConfig
 *
 * useAuth is now called inside Layout — no need to call it here.
 * Layout's ProtectedContent handles auth + permission for every protected route.
 */
const RouterConfig: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Public Routes */}
        {RenderPublicRoutes({ routes })}

        {/* Protected Routes — Layout calls useAuth() once and renders
            ProtectedContent which guards the <Outlet /> */}
        <Route element={<Layout />}>
          {RenderProtectedRoutes({ routes: protectedRoutes })}
        </Route>
      </Routes>
    </Suspense>
  );
};

export default RouterConfig;
