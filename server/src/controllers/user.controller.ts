import { Request, Response } from "express";
import { UserService } from "../services/user.service.js";
import { updateProfileSchema } from "../validators/user.validator.js";

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      profile: user.profile
        ? {
            id: user.profile.id,
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            phone: user.profile.phone,
            avatarUrl: user.profile.avatarUrl,
          }
        : null,
    },
  });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  const parseResult = updateProfileSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Invalid profile update payload",
        details: parseResult.error.format(),
      },
    });
    return;
  }

  const { profile } = await UserService.updateProfile(user.id, parseResult.data);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      profile: {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl,
      },
    },
  });
}
