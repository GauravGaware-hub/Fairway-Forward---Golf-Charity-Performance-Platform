import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("GET /api/v1/health", () => {
  it("should return HTTP 200 with status ok", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: "ok",
      },
    });
  });

  it("should handle 404 for unknown endpoints", async () => {
    const response = await request(app).get("/api/v1/unknown");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        message: "Cannot GET /api/v1/unknown",
        code: "NOT_FOUND",
      },
    });
  });
});
