import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { ApiResponse } from '../utils/apiResponse';
import { env } from '../config/env';

const setCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export class AuthController {
  static async register(req: Request, res: Response) {
    const { email, password, fullName } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.register(email, password, fullName);
    
    setCookies(res, accessToken, refreshToken);

    res.status(201).json(new ApiResponse(201, user, 'Registered successfully'));
  }

  static async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.login(email, password);
    
    setCookies(res, accessToken, refreshToken);

    res.status(200).json(new ApiResponse(200, user, 'Login successful'));
  }

  static async refresh(req: Request, res: Response) {
    const { refresh_token } = req.cookies;
    if (!refresh_token) {
      return res.status(401).json(new ApiResponse(401, null, 'No refresh token provided'));
    }

    const { newAccessToken, newRefreshToken } = await TokenService.rotateRefreshToken(refresh_token);
    
    setCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json(new ApiResponse(200, null, 'Tokens refreshed'));
  }

  static async logout(req: Request, res: Response) {
    const { refresh_token } = req.cookies;
    if (refresh_token) {
      await TokenService.revokeToken(refresh_token);
    }

    res.cookie('access_token', '', { maxAge: 0, httpOnly: true, path: '/' });
    res.cookie('refresh_token', '', { maxAge: 0, httpOnly: true, path: '/api/v1/auth/refresh' });

    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  }

  static async oauthLogin(req: Request, res: Response) {
    const { email, fullName, avatarUrl, provider, oauthId } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.oauthLogin({
      email,
      fullName,
      avatarUrl,
      provider: provider === 'GITHUB' ? 'GITHUB' : 'GOOGLE',
      oauthId,
    });

    setCookies(res, accessToken, refreshToken);

    res.status(200).json(new ApiResponse(200, user, 'OAuth authentication successful'));
  }

  static async continue(req: Request, res: Response) {
    const { email, password, fullName } = req.body;
    const { user, accessToken, refreshToken, isNewUser } = await AuthService.continueWithEmail(email, password, fullName);

    setCookies(res, accessToken, refreshToken);

    const message = isNewUser ? 'Account created successfully' : 'Signed in successfully';
    res.status(isNewUser ? 201 : 200).json(new ApiResponse(isNewUser ? 201 : 200, user, message));
  }

  static async getMe(req: Request, res: Response) {
    res.status(200).json(new ApiResponse(200, (req as any).user, 'User fetched'));
  }
}
