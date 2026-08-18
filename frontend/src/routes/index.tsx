import React from 'react';
import { ActionType, ResourceType, Role } from '@/types';
import baseProtectedRoutes from './baseProtectedRoutes';
import publicRoutes from './publicRoutes';
// Define route interface
export interface Route {
  path: string;
  element?: React.LazyExoticComponent<React.FC> | React.FC;
  title: string;
  key: string;
  icon?: string;
  icontype?: string;
  currentCompany?: boolean;
  hideInMenu?: boolean;
  children?: Route[];
  action: ActionType;
  resource: ResourceType[];
  roles: Role[];
}

// Function to generate routes recursively
const generateRoutes = (routes: Route[], parentPath = ''): Route[] => {
  return routes.map(route => {
    const fullPath = `${parentPath}${route.path}`.replace('//', '/');
    const newRoute: Route = {
      ...route,
      path: fullPath,
      element: route.element,
    };

    if (route.children) {
      newRoute.children = generateRoutes(route.children, fullPath);
    }

    return newRoute;
  });
};

// Function to flatten routes for React Router
const flattenRoutes = (routes: Route[]): Route[] => {
  return routes.reduce((acc: Route[], route: Route) => {
    acc.push(route);
    if (route.children) {
      acc.push(...flattenRoutes(route.children));
    }
    return acc;
  }, []);
};
export const routes = generateRoutes(publicRoutes);
export const protectedRoutes = generateRoutes(baseProtectedRoutes);