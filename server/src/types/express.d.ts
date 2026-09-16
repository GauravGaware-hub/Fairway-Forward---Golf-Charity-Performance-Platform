import { Profile, User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: User & { profile?: Profile | null };
    }
  }
}
