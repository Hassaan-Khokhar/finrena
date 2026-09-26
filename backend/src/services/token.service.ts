import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { ApiError } from '../utils/apiError';
import { v4 as uuidv4 } from 'uuid';

export class TokenService {
  static generateAccessToken(userId: string): string {
    return jwt.sign({ id: userId }, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async issueRefreshToken(userId: string, familyId?: string): Promise<{ rawToken: string; familyId: string }> {
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const resolvedFamilyId = familyId || uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId: resolvedFamilyId,
        expiresAt,
      },
    });

    // Opportunistically prune expired tokens
    prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }).catch(() => {});

    return { rawToken, familyId: resolvedFamilyId };
  }

  static async rotateRefreshToken(rawToken: string): Promise<{ newAccessToken: string; newRefreshToken: string }> {
    const tokenHash = this.hashToken(rawToken);
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!tokenRecord) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    if (tokenRecord.isRevoked) {
      // Breach detected! Revoked token reuse attempt. Invalidate entire family.
      await prisma.refreshToken.updateMany({
        where: { familyId: tokenRecord.familyId },
        data: { isRevoked: true },
      });
      throw ApiError.unauthorized('Token breach detected. Please login again.');
    }

    if (tokenRecord.expiresAt.getTime() < Date.now()) {
      throw ApiError.unauthorized('Refresh token expired');
    }

    // Mark current token as revoked
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    // Mint new credentials with preserved familyId
    const newAccessToken = this.generateAccessToken(tokenRecord.userId);
    const newRefreshData = await this.issueRefreshToken(tokenRecord.userId, tokenRecord.familyId);

    return { newAccessToken, newRefreshToken: newRefreshData.rawToken };
  }

  static async revokeToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }
}
