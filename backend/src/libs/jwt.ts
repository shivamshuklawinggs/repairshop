import jwt, { JwtPayload } from 'jsonwebtoken';
import config from 'config';
import Token from 'models/token.model';
import { Types } from 'mongoose';

export interface ITokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate JWT Access Token
 * @param payload - Token payload
 * @returns Generated token
 */
export const generateAccessToken = (payload: ITokenPayload): string => {
  const jwtSecret = config.JWT_SECRET as string;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in configuration');
  }

  const options: any = {
    expiresIn: config.JWT_EXPIRE || '365d',
  };

  const token = jwt.sign(payload, jwtSecret, options);
  return token;
};

/**
 * Generate JWT Refresh Token
 * @param payload - Token payload
 * @returns Generated token
 */
export const generateRefreshToken = (payload: ITokenPayload): string => {
  const refreshSecret = config.REFRESH_TOKEN_SECRET as string;
  if (!refreshSecret) {
    throw new Error('REFRESH_TOKEN_SECRET is not defined in configuration');
  }

  const options: any = {
    expiresIn: '365d', // 7 days refresh token
  };

  const token = jwt.sign(payload, refreshSecret, options);
  return token;
};

/**
 * Save token to database with TTL
 * @param userId - User ID
 * @param token - Token string
 * @param type - Token type (access or refresh)
 * @param expiresIn - Expiration time in seconds
 */
export const saveTokenToDatabase = async (
  userId: Types.ObjectId,
  token: string,
  type: 'access' | 'refresh',
  expiresIn: number
): Promise<void> => {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await Token.create({
    userId,
    token,
    type,
    expiresAt,
  });
};

/**
 * Verify JWT Token
 * @param token - Token to verify
 * @param isRefresh - Whether to verify against refresh token secret
 * @returns Decoded payload
 */
export const verifyToken = (
  token: string,
  isRefresh: boolean = false
): ITokenPayload => {
  const secret = isRefresh
    ? (config.REFRESH_TOKEN_SECRET as string)
    : (config.JWT_SECRET as string);

  if (!secret) {
    throw new Error(
      `${isRefresh ? 'REFRESH_TOKEN_SECRET' : 'JWT_SECRET'} is not defined`
    );
  }

  const decoded = jwt.verify(token, secret) as ITokenPayload;
  return decoded;
};

/**
 * Verify token exists in database
 * @param token - Token string
 * @param type - Token type
 * @returns True if token exists and is valid
 */
export const verifyTokenInDatabase = async (
  token: string,
  type: 'access' | 'refresh'
): Promise<boolean> => {
  const tokenRecord = await Token.findOne({
    token,
    type,
    expiresAt: { $gt: new Date() },
  });

  return !!tokenRecord;
};

/**
 * Revoke token by removing from database
 * Deletes both access and refresh tokens for the user
 * @param token - Token to revoke
 */
export const revokeToken = async (token: string): Promise<void> => {
  const tokenRecord = await Token.findOne({ token });

  if (tokenRecord) {
    await Token.deleteMany({ userId: tokenRecord.userId });
  }
};

/**
 * Get token expiration time in seconds from config
 * @param type - Token type
 * @returns Expiration time in seconds
 */
export const getTokenExpirationSeconds = (
  type: 'access' | 'refresh'
): number => {
  if (type === 'refresh') {
    return 365 * 24 * 60 * 60; // 7 days
  }
  // Parse JWT_EXPIRE string (e.g., "1h", "30m", "3600")
  const expire = config.JWT_EXPIRE || '365d';
  if (typeof expire === 'string') {
    if (expire.endsWith('h')) {
      return parseInt(expire) * 60 * 60;
    } else if (expire.endsWith('m')) {
      return parseInt(expire) * 60;
    } else if (expire.endsWith('d')) {
      return parseInt(expire) * 24 * 60 * 60;
    }
    return parseInt(expire); // assume seconds
  }
  return expire as number;
};
