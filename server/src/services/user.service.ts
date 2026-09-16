import { Profile, Role, User } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export interface UpdateProfileInput {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export class UserService {
  /**
   * Retrieves or creates a User record mapped to the authenticated Supabase user.
   */
  static async getOrCreateUser(supabaseUser: {
    id: string;
    email: string;
  }): Promise<User & { profile: Profile | null }> {
    const existingUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      include: { profile: true },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create new application User with default USER role
    return await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        role: Role.USER,
      },
      include: { profile: true },
    });
  }

  /**
   * Updates profile information for a specified user ID using upsert.
   */
  static async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<{ user: User; profile: Profile }> {
    // Ensure User exists
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    // Upsert Profile record for the target user
    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        avatarUrl: input.avatarUrl,
      },
      update: {
        ...(input.firstName !== undefined && { firstName: input.firstName }),
        ...(input.lastName !== undefined && { lastName: input.lastName }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      },
    });

    return { user, profile };
  }
}
