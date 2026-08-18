import { lazy } from 'react';
import { Route } from '.';
import { paths } from '@/utils/paths';
// Public Pages
const Login = lazy(() => import('@/pages/auth-service/Login'));
const Register = lazy(() => import('@/pages/auth-service/Register'));
const ForgetPassword = lazy(() => import('@/pages/auth-service/ForgetPassword'));
const NotAuthorized = lazy(() => import('@/pages/NotAuthorized'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const ResetPassword = lazy(() => import('@/pages/auth-service/resetPassword'));
const BaseImageViewer = lazy(() => import('@/components/common/BaseImageViewer'));

const publicRoutes: Route[] = [
  {
    path: paths.login,
    element: Login,
    title: 'Login',
    key: "login",
    action: 'view',
    resource: ['public'],
    roles:[]
  },
  {
    path: paths.register,
    element: Register,
    title: 'Register',
    key: "register",
    action: 'view',
    resource: ['public'],
    roles:[]
  },
  {
    path: paths.notfound,
    element: NotFound,
    key: "notfound",
    title: '404',
    action: 'view',
    resource: ['public'],
    roles:[]
  },
  {
    path: paths.base64imageviewer + "/:id/:type",
    element: BaseImageViewer,
    key: "base64imageviewer",
    title: 'Base64 Image Viewer',
    action: 'view',
    resource: ['public'],
     roles:[]
  },

  // forget password
  {
    path: paths.forgetpassword,
    element: ForgetPassword,
    key: "forgetpassword",
    title: 'Forget Password',
    action: 'view',
    resource: ['public'],
     roles:[]
  },
  // not authorized
  {
    path: paths.NotAuthorized,
    key: "notauthorized",
    element: NotAuthorized,
    title: '403',
    action: 'view',
    resource: ['public'],
     roles:[]
  },
  // wild card route
  {
    path: '*',
    element: NotFound,
    key: "wildcard",
    title: '404',
    action: 'view',
    resource: ['public'],
    roles:[]
  },
  {
    path: `${paths.resetpassword}/:token`,
    element: ResetPassword,
    key: "resetpassword",
    title: '404',
    action: 'view',
    resource: ['public'],
    roles:[]
  },



];
export default publicRoutes