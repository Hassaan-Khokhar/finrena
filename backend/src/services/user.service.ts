import { prisma } from '../config/db';
import { User, Role, AuthProvider } from '@prisma/client';

export type UserWithoutPassword = Omit<User, 'passwordHash'>;

export class UserService {
  static excludePassword<T extends { passwordHash?: string | null }>(user: T): Omit<T, 'passwordHash'> {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  static async findById(id: string): Promise<UserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    return this.excludePassword(user);
  }

  static async create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    avatarUrl?: string;
    role?: Role;
    authProvider?: AuthProvider;
    oauthId?: string;
  }): Promise<UserWithoutPassword> {
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        fullName: data.fullName.trim(),
        avatarUrl: data.avatarUrl,
        role: data.role || Role.USER,
        authProvider: data.authProvider || AuthProvider.LOCAL,
        oauthId: data.oauthId,
      },
    });

    return this.excludePassword(user);
  }

  static async upsertOAuthUser(data: {
    email: string;
    fullName: string;
    avatarUrl?: string;
    authProvider: AuthProvider;
    oauthId?: string;
  }): Promise<UserWithoutPassword> {
    const email = data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName: data.fullName || existing.fullName,
          avatarUrl: data.avatarUrl || existing.avatarUrl,
          oauthId: data.oauthId || existing.oauthId,
          authProvider: data.authProvider,
        },
      });
      return this.excludePassword(updated);
    }

    const created = await prisma.user.create({
      data: {
        email,
        fullName: data.fullName || 'Trader Analyst',
        avatarUrl: data.avatarUrl,
        authProvider: data.authProvider,
        oauthId: data.oauthId,
        role: Role.USER,
      },
    });

    return this.excludePassword(created);
  }
}
