import { Request, Response, NextFunction } from "express";
import User, { IUserDocument } from "models/user.model";
import { AppError } from "middlewares/error";
import crypto from "crypto";
import { Producer } from "config/rabbitmq/producers";
import { revokeToken,generateAccessToken, generateRefreshToken, saveTokenToDatabase, getTokenExpirationSeconds, verifyToken } from "libs/jwt";
import { Role } from "./types";


/**
 * @description User Login
 * @type POST 
 * @path /api/users/login
 */
const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload: IUserDocument = req.body;
    payload.email = payload.email.toLowerCase();

    // Use a "where" clause to find the user by email
    const checkUser = await User.findOne({ email: payload.email });
    if (!checkUser) {
      throw new AppError("No user found with provided email", 400);
    }

    if (!checkUser.isActive) {
      throw new AppError("Account is deactivated by owner!", 400);
    }
    if (checkUser.isBlocked) {
      throw new AppError("Account is blocked by owner!", 400);
    }
    const isMatch = await checkUser.matchPassword(payload.password as string, checkUser.password);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 400);
    }

    // Remove sensitive info from returned user data
    const { password, isBlocked, ...userData } = checkUser.toJSON();
  // Generate JWT tokens
    const tokenPayload = {
      userId: checkUser._id.toString(),
      email: checkUser.email,
      role: checkUser.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save tokens to database with TTL
    const accessTokenExpiry = getTokenExpirationSeconds('access');
    const refreshTokenExpiry = getTokenExpirationSeconds('refresh');

    await saveTokenToDatabase(checkUser._id, accessToken, 'access', accessTokenExpiry);
    await saveTokenToDatabase(checkUser._id, refreshToken, 'refresh', refreshTokenExpiry);
    const tokens = {
      accessToken: accessToken,
      refreshToken: refreshToken,
    }
    res.status(200).json({
      success: true,
      data: {
        user: userData,
        ...tokens
      },
      message: "Login successful",
    });
  } catch (error) {
    next(error)
  }

}

/**
 * @description Forgot Password
 * @type POST 
 * @path /api/auth/forgot-password
 */
const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError("No user found with provided email", 404);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpiry;
    await user.save();
    await Producer.resetPassword(user._id as string); // Send reset password email
    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });

  } catch (error) {
    next(error)
  }
}

/**
 * @description Reset Password
 * @type POST 
 * @path /api/auth/reset-password
 */
const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) {
      throw new AppError("Invalid or expired reset token", 400);
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful"
    });
  } catch (error) {
    next(error)
  }
}
const logout = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await revokeToken(token);
    }
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error)
  }
};
/**
 * @description Refresh Access Token
 * @type POST 
 * @path /api/auth/refresh-token
 */
const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("Refresh token is required", 400);
    }

    // Verify refresh token signature
    const decoded = verifyToken(refreshToken, true);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError("User not found", 401);
    }

    // Generate new access token
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const accessTokenExpiry = getTokenExpirationSeconds('access');

    // Save new access token to database
    await saveTokenToDatabase(user._id, newAccessToken, 'access', accessTokenExpiry);

    // Optionally: Rotate refresh token (revoke old one and create new one)
    // Uncomment below to enable refresh token rotation
    // await revokeToken(refreshToken);
    // const newRefreshToken = generateRefreshToken(tokenPayload);
    // const refreshTokenExpiry = getTokenExpirationSeconds('refresh');
    // await saveTokenToDatabase(user._id, newRefreshToken, 'refresh', refreshTokenExpiry);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: accessTokenExpiry,
        // Include new refresh token if rotation is enabled:
        // refreshToken: newRefreshToken,
        // refreshExpiresIn: refreshTokenExpiry,
      },
      message: "Token refreshed successfully",
    });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new AppError("Refresh token has expired. Please login again", 401));
    } else if (error.name === 'JsonWebTokenError') {
      next(new AppError("Invalid refresh token", 401));
    } else {
      next(error);
    }
  }
};
const currentLoginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError("User not found", 400);
    }

    // If user is admin, populate plan details and usage
    if (user.role === Role.ADMIN) {
      const userWithPlan = await User.findById(userId).populate('ActivePlan.PlanId');
      
      // Count users created under this admin
      const userCount = await User.countDocuments({ ownerAdminId: userId });
      
      // Get plan details
      const planDetails = (userWithPlan as any)?.ActivePlan?.PlanId;
      const planLimit = planDetails?.noOfUsers || 0;
      const planExpiry = (userWithPlan as any)?.ActivePlan?.expires;
      
      // Calculate days remaining
      let daysRemaining = 0;
      if (planExpiry) {
        const now = new Date();
        const expiryDate = new Date(planExpiry);
        const diffTime = expiryDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) daysRemaining = 0;
      }

      const userData = userWithPlan?.toJSON();
      res.status(200).json({ 
        data: {
          ...userData,
          planDetails: {
            name: planDetails?.name,
            description: planDetails?.description,
            price: planDetails?.price,
            noOfDays: planDetails?.noOfDays,
            maxUsers: planLimit,
            usersUsed: userCount,
            usersRemaining: Math.max(0, planLimit - userCount),
            expires: planExpiry,
            daysRemaining: daysRemaining,
            isExpired: daysRemaining === 0
          }
        }, 
        success: true, 
        statusCode: 200 
      });
    } else {
      res.status(200).json({ data: user, success: true, statusCode: 200 });
    }
  } catch (error) {
    next(error)
  }
}
const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
     const user = await User.findById(req.user?._id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Update fields except password
    Object.entries(req.body).forEach(([key, value]) => {
      if (key !== 'password' && key in user) {
        (user as any)[key] = value;
      }
    });

    // Handle password separately if provided
    if (req.body.password) {
      user.password = req.body.password;
    }
    await user.save();
    res.status(200).json({ data: user, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};


export {  loginUser, forgotPassword, resetPassword, logout, currentLoginUser,refreshAccessToken,updateUserProfile };
