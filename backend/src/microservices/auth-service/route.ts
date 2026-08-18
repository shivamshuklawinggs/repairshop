import { Router } from "express";
import {
  loginUser,
  forgotPassword,
  resetPassword,
  logout,
  currentLoginUser,
  refreshAccessToken,
  updateUserProfile,
} from "./auth.controller";
import { AuthLoginSchema, AuthUpdateSchema, ForgtPasswordSchema, ResetPasswordSchema } from "./user.validate";
import { Middleware } from "middlewares";
const router = Router();

// login user
router.post("/login",
  Middleware.loginLimiter,
  Middleware.requestValidate(AuthLoginSchema),
  loginUser);
// logout user
router.get("/logout", logout)
router.post('/forget-password',
  Middleware.loginLimiter,
  Middleware.requestValidate(ForgtPasswordSchema), forgotPassword);
router.post('/reset-password',
  Middleware.loginLimiter,
  Middleware.requestValidate(ResetPasswordSchema), resetPassword);
router.post('/refresh-token', refreshAccessToken);
router.get('/current-user', Middleware.verifyToken, currentLoginUser),
router.put('/update-profile', Middleware.verifyToken,Middleware.requestValidate(AuthUpdateSchema), updateUserProfile);
export default router;
