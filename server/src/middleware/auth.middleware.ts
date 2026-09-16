import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { supabaseServer } from "../config/supabase.js";
import { SubscriptionService } from "../services/subscription.service.js";
import { UserService } from "../services/user.service.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  try {
    const { data, error } = await supabaseServer.auth.getUser(token);

    if (error || !data.user || !data.user.email) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired authentication token",
        },
      });
      return;
    }

    const appUser = await UserService.getOrCreateUser({
      id: data.user.id,
      email: data.user.email,
    });

    req.user = appUser;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication failed",
      },
    });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  if (req.user.role !== Role.ADMIN) {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Admin access required",
      },
    });
    return;
  }

  next();
}

export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  const hasAccess = await SubscriptionService.hasActiveSubscription(
    req.user.id,
    req.headers
  );

  if (!hasAccess) {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Active subscription required to access this feature",
      },
    });
    return;
  }

  next();
}
