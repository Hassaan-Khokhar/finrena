import argon2 from 'argon2';
import { AuthProvider } from '@prisma/client';
import { ApiError } from '../utils/apiError';
import { UserService } from './user.service';
import { TokenService } from './token.service';

export class AuthService {
  static async register(email: string, passwordPlain: string, fullName: string) {
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      throw ApiError.conflict('Email already in use');
    }

    const passwordHash = await argon2.hash(passwordPlain);

    const user = await UserService.create({
      email,
      passwordHash,
      fullName,
    });

    const accessToken = TokenService.generateAccessToken(user.id);
    const { rawToken: refreshToken } = await TokenService.issueRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  static async login(email: string, passwordPlain: string) {
    const user = await UserService.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const isMatch = await argon2.verify(user.passwordHash, passwordPlain);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const safeUser = UserService.excludePassword(user);
    const accessToken = TokenService.generateAccessToken(user.id);
    const { rawToken: refreshToken } = await TokenService.issueRefreshToken(user.id);

    return { user: safeUser, accessToken, refreshToken };
  }

  static async oauthLogin(data: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
    provider: 'GOOGLE' | 'GITHUB';
    oauthId?: string;
  }) {
    if (!data.email) {
      throw ApiError.badRequest('OAuth provider did not return an email address');
    }

    const providerEnum = data.provider === 'GOOGLE' ? AuthProvider.GOOGLE : AuthProvider.GITHUB;
    const user = await UserService.upsertOAuthUser({
      email: data.email,
      fullName: data.fullName || (data.provider === 'GOOGLE' ? 'Google Trader' : 'GitHub Developer'),
      avatarUrl: data.avatarUrl,
      authProvider: providerEnum,
      oauthId: data.oauthId,
    });

    const accessToken = TokenService.generateAccessToken(user.id);
    const { rawToken: refreshToken } = await TokenService.issueRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  static async continueWithEmail(email: string, passwordPlain: string, fullName?: string) {
    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await UserService.findByEmail(cleanEmail);

    if (existingUser) {
      if (!existingUser.passwordHash) {
        throw ApiError.unauthorized('This account was created with OAuth. Please sign in with Google or GitHub.');
      }
      const isMatch = await argon2.verify(existingUser.passwordHash, passwordPlain);
      if (!isMatch) {
        throw ApiError.unauthorized('Incorrect password. Please try again.');
      }

      const safeUser = UserService.excludePassword(existingUser);
      const accessToken = TokenService.generateAccessToken(existingUser.id);
      const { rawToken: refreshToken } = await TokenService.issueRefreshToken(existingUser.id);
      return { user: safeUser, accessToken, refreshToken, isNewUser: false };
    }

    const passwordHash = await argon2.hash(passwordPlain);
    const derivedName = fullName?.trim() || cleanEmail.split('@')[0];
    const newUser = await UserService.create({
      email: cleanEmail,
      passwordHash,
      fullName: derivedName,
    });

    const accessToken = TokenService.generateAccessToken(newUser.id);
    const { rawToken: refreshToken } = await TokenService.issueRefreshToken(newUser.id);
    return { user: newUser, accessToken, refreshToken, isNewUser: true };
  }
}
