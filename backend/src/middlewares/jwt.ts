import {  Response, NextFunction, Request } from 'express';
import { AppError } from './error';
import { verifyToken, verifyTokenInDatabase } from 'libs/jwt';
import User, { IUserDocument } from 'models/user.model';
import { ActionType, ResourceType, UserPermissionChecker } from 'utils/roleBaseAccessControl';
import { Producer } from 'config/rabbitmq/producers';
import { Role } from 'microservices/auth-service/types';

export class JWTMiddleware {
  /**
   * Verify JWT token and attach user to request
   */
  static verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract JWT token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('Unauthorized: No token provided', 401));
      }

      const token = authHeader.replace('Bearer ', ''); // Remove 'Bearer ' prefix

      // Verify JWT signature
      const decoded = verifyToken(token, false);

      // Verify token exists in database (not revoked)
      const tokenExists = await verifyTokenInDatabase(token, 'access');
      if (!tokenExists) {
        return next(new AppError('Unauthorized: Token is invalid or expired', 401));
      }

      // Get user from database
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new AppError('Unauthorized: User not found', 401));
      }

      // Attach user to request object
      req.user = user
      res.locals.companyId = req.headers["companyid"] as string
      if(req.user.role==Role.ACCOUNTANT && req.user._id!==req.user.manager){
        user.manager=user._id
        await user.save()
        req.user=user
      }
      if (!user.ipAddress && user.role==Role.ADMIN) {
        // Capture IP address and queue geolocation update
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress;
        if (ipAddress) {
          await Producer.updateUserGeolocation(user._id.toString(), ipAddress as string);
        }
      }
      next();

    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Unauthorized: Token has expired', 401));
      }
      if (error.name === 'JsonWebTokenError') {
        return next(new AppError('Unauthorized: Invalid token', 401));
      }
      next(error);
    }
  };

  /**
   * Middleware factory for permission checking
   */
  static requirePermission = (action: ActionType, resource: ResourceType[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Ensure token is valid (wrap if it's callback-based)
        await new Promise<void>((resolve, reject) => {
          JWTMiddleware.verifyToken(req, res, (err?: any) => {
            if (err) return reject(err);
            resolve();
          });
        });

        const checker = new UserPermissionChecker(req.user as IUserDocument);
        const hasPermission = checker.hasPermission({action:action, resources:resource});
        if (!hasPermission) {
          return next(
            new AppError(
              `Permission denied: cannot ${action} on ${resource.join(", ")}`,
              403,
            )
          );
        }

        next();
      } catch (error: any) {
        next(error);
      }
    };
  };

  /**
   * Role-based middleware
   */
  static requireRole = (roles: string | string[]) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // First verify token
        await JWTMiddleware.verifyToken(req, res, (err) => {
          if (err) return next(err);
        });

        if (!req.user) {
          return next(new AppError('Unauthorized: No user found', 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
          return next(new AppError(`Access denied: Insufficient role privileges`, 403, {
            required: allowedRoles,
            userRole: req.user.role
          }));
        }

        next();
      } catch (error: any) {
        next(error);
      }
    };
  };
 
}
