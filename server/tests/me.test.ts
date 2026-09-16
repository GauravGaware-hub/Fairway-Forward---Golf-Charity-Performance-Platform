import { Role } from "@prisma/client";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { supabaseServer } from "../src/config/supabase.js";

// Mock Supabase Server Auth Client
vi.mock("../src/config/supabase.js", () => ({
  supabaseServer: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock Prisma Client
vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    profile: {
      upsert: vi.fn(),
    },
  },
}));

describe("Phase 2 Authentication & Profile API (/api/v1/me)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Unauthenticated Requests", () => {
    it("should return 401 UNAUTHORIZED when Authorization header is missing", async () => {
      const response = await request(app).get("/api/v1/me");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    });

    it("should return 401 UNAUTHORIZED when bearer token is invalid", async () => {
      vi.mocked(supabaseServer.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Invalid JWT") as unknown as null,
      });

      const response = await request(app)
        .get("/api/v1/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired authentication token",
        },
      });
    });
  });

  describe("2. GET /api/v1/me (Authenticated User)", () => {
    it("should return HTTP 200 with user and profile data for authenticated user", async () => {
      const mockSupabaseUser = { id: "user-123", email: "user@example.com" };
      const mockAppUser = {
        id: "user-123",
        email: "user@example.com",
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          id: "profile-123",
          userId: "user-123",
          firstName: "John",
          lastName: "Doe",
          phone: "+1234567890",
          avatarUrl: "https://example.com/avatar.jpg",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(supabaseServer.auth.getUser).mockResolvedValueOnce({
        data: { user: mockSupabaseUser as unknown as import("@supabase/supabase-js").User },
        error: null,
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAppUser);

      const response = await request(app)
        .get("/api/v1/me")
        .set("Authorization", "Bearer valid-user-token");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          user: {
            id: "user-123",
            email: "user@example.com",
            role: "USER",
          },
          profile: {
            id: "profile-123",
            firstName: "John",
            lastName: "Doe",
            phone: "+1234567890",
            avatarUrl: "https://example.com/avatar.jpg",
          },
        },
      });
    });

    it("should auto-create application user with default USER role if user record does not exist", async () => {
      const mockSupabaseUser = { id: "new-user-456", email: "newuser@example.com" };
      const mockCreatedUser = {
        id: "new-user-456",
        email: "newuser@example.com",
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      };

      vi.mocked(supabaseServer.auth.getUser).mockResolvedValueOnce({
        data: { user: mockSupabaseUser as unknown as import("@supabase/supabase-js").User },
        error: null,
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce(mockCreatedUser);

      const response = await request(app)
        .get("/api/v1/me")
        .set("Authorization", "Bearer valid-new-token");

      expect(response.status).toBe(200);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          id: "new-user-456",
          email: "newuser@example.com",
          role: Role.USER,
        },
        include: { profile: true },
      });
      expect(response.body.data.user.role).toBe("USER");
      expect(response.body.data.profile).toBeNull();
    });
  });

  describe("3. Role-Based Access Control (requireAdmin)", () => {
    it("should return HTTP 403 FORBIDDEN when authenticated non-admin accesses admin route", async () => {
      const mockSupabaseUser = { id: "user-123", email: "user@example.com" };
      const mockAppUser = {
        id: "user-123",
        email: "user@example.com",
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      };

      vi.mocked(supabaseServer.auth.getUser).mockResolvedValueOnce({
        data: { user: mockSupabaseUser as unknown as import("@supabase/supabase-js").User },
        error: null,
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAppUser);

      const response = await request(app)
        .get("/api/v1/admin/test")
        .set("Authorization", "Bearer non-admin-token");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin access required",
        },
      });
    });

    it("should allow access to admin route when authenticated user has ADMIN role", async () => {
      const mockSupabaseAdmin = { id: "admin-789", email: "admin@example.com" };
      const mockAdminUser = {
        id: "admin-789",
        email: "admin@example.com",
        role: Role.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      };

      vi.mocked(supabaseServer.auth.getUser).mockResolvedValueOnce({
        data: { user: mockSupabaseAdmin as unknown as import("@supabase/supabase-js").User },
        error: null,
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAdminUser);

      const response = await request(app)
        .get("/api/v1/admin/test")
        .set("Authorization", "Bearer admin-token");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          message: "Admin access granted",
        },
      });
    });
  });

  describe("4. PATCH /api/v1/me (Profile Update & Input Validation)", () => {
    it("should update profile successfully with valid input fields", async () => {
      const mockSupabaseUser = { id: "user-123", email: "user@example.com" };
      const mockAppUser = {
        id: "user-123",
        email: "user@example.com",
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      };
      const mockUpdatedProfile = {
        id: "profile-123",
        userId: "user-123",
        firstName: "Jane",
        lastName: "Smith",
        phone: "+9876543210",
        avatarUrl: "https://example.com/jane.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(supabaseServer.auth.getUser).mockResolvedValueOnce({
        data: { user: mockSupabaseUser as unknown as import("@supabase/supabase-js").User },
        error: null,
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAppUser);
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValueOnce(mockAppUser);
      vi.mocked(prisma.profile.upsert).mockResolvedValueOnce(mockUpdatedProfile);

      const response = await request(app)
        .patch("/api/v1/me")
        .set("Authorization", "Bearer user-token")
        .send({
          firstName: "Jane",
          lastName: "Smith",
          phone: "+9876543210",
          avatarUrl: "https://example.com/jane.jpg",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.profile).toEqual({
        id: "profile-123",
        firstName: "Jane",
        lastName: "Smith",
        phone: "+9876543210",
        avatarUrl: "https://example.com/jane.jpg",
      });
    });

    it("should reject attempt to modify immutable fields like role or id", async () => {
      const mockSupabaseUser = { id: "user-123", email: "user@example.com" };
      const mockAppUser = {
        id: "user-123",
        email: "user@example.com",
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      };

      vi.mocked(supabaseServer.auth.getUser).mockResolvedValueOnce({
        data: { user: mockSupabaseUser as unknown as import("@supabase/supabase-js").User },
        error: null,
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAppUser);

      const response = await request(app)
        .patch("/api/v1/me")
        .set("Authorization", "Bearer user-token")
        .send({
          firstName: "Hacker",
          role: "ADMIN",
          id: "other-user-id",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("BAD_REQUEST");
    });

    it("should update profile for authenticated user ID derived solely from token", async () => {
      const mockSupabaseUser = { id: "user-123", email: "user@example.com" };
      const mockAppUser = {
        id: "user-123",
        email: "user@example.com",
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      };

      vi.mocked(supabaseServer.auth.getUser).mockResolvedValueOnce({
        data: { user: mockSupabaseUser as unknown as import("@supabase/supabase-js").User },
        error: null,
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAppUser);
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValueOnce(mockAppUser);
      vi.mocked(prisma.profile.upsert).mockResolvedValueOnce({
        id: "profile-123",
        userId: "user-123",
        firstName: "ValidName",
        lastName: null,
        phone: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .patch("/api/v1/me")
        .set("Authorization", "Bearer user-token")
        .send({
          firstName: "ValidName",
        });

      expect(response.status).toBe(200);
      expect(prisma.profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-123" },
        })
      );
    });
  });
});
