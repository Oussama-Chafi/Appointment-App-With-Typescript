import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../src/server";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../src/models/userSchema";
import crypto from "crypto";

let mongoServer: MongoMemoryServer;
const userTest = {
  first_name: "user",
  last_name: "test",
  email: "user@gmail.com",
  password: "12345678",
};

describe("Authentication API Integration Tests", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("POST /auth/register", () => {
    it("should return 400 if one field is missing in register", async () => {
      const res = await request(app).post("/auth/register").send({
        email: userTest.email,
        password: userTest.password,
        first_name: userTest.first_name,
      });
      expect(res.status).toBe(400);
    });

    it("should return 400 if password is less than 8 characters", async () => {
      const res = await request(app).post("/auth/register").send({
        email: userTest.email,
        password: "1234567",
        last_name: userTest.last_name,
        first_name: userTest.first_name,
      });
      expect(res.status).toBe(400);
    });

    it("should return 201 if account has been created successfully", async () => {
      const res = await request(app).post("/auth/register").send(userTest);
      expect(res.status).toBe(201);
    });

    it("should return 409 if email already exists in DB", async () => {
      const res = await request(app).post("/auth/register").send(userTest);
      expect(res.status).toBe(409);
    });
  });

  describe("POST /auth/login", () => {
    it("should return 400 if email or password is missing in login", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: userTest.email });
      expect(res.status).toBe(400);
    });

    it("should return 400 if password or email is incorrect in login", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: userTest.email, password: "87654321" });
      expect(res.status).toBe(400);
    });

    it("should return 200 if email and password are correct", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: userTest.email, password: userTest.password });
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(userTest.email);
    });
  });

  describe("GET /auth/refresh-token", () => {
    it("should get a new access token using refresh token", async () => {
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: userTest.email, password: userTest.password });

      const cookies = loginRes.headers["set-cookie"];

      const res = await request(app)
        .get("/auth/refresh")
        .set("Cookie", cookies);
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });
  });

  describe("POST /auth/forget-password", () => {
    it("should return 400 if email is missing in forget-password", async () => {
      const res = await request(app).post("/auth/forget-password").send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email address is required.");
    });

    it("should return 200 whether email exists or not for security", async () => {
      const res = await request(app)
        .post("/auth/forget-password")
        .send({ email: "oussama6@gmail.com" });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        "you can check your email and you can click the button to change the password",
      );
    });
  });

  describe("POST /auth/logout", () => {
    it("should return 204 if refresh token does not exist in cookies", async () => {
      const res = await request(app).post("/auth/logout");
      expect(res.status).toBe(204);
    });
  });

  describe("GET /auth/verify-email", () => {
    it("should return 400 if token is not in query parameter", async () => {
      const res = await request(app).get("/auth/verify-email");
      expect(res.status).toBe(400);
    });

    it("should return 200 if token is in query parameter", async () => {
      const user = await User.findOne({ email: userTest.email }).lean();
      const token = user?.verificationToken as string;
      const res = await request(app).get("/auth/verify-email").query({ token });
      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /auth/reset-password", () => {
    it("should return 400 if reset token or new password is missing", async () => {
      const res = await request(app).patch("/auth/reset-password").send({});
      expect(res.status).toBe(400);
    });

    it("should return 404 if no user with this token exists or token expired", async () => {
      const token = "lhgwogawkjaglhalrghakghaeoirugerlgkahnerjlgkaha;rghagrgkjrelghl;;g;gja";

      const res = await request(app)
        .patch("/auth/reset-password")
        .query({ token })
        .send({ newPassword: "44411122" });
      expect(res.status).toBe(404);
    });

    it("should return 200 if reset token is correct and new password is acceptable", async () => {
      const rawToken = "my-secret-reset-token";
      const hashToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      await User.findOneAndUpdate(
        { email: userTest.email },
        {
          resetToken: hashToken,
          resetTokenExpiry: Date.now() + 10 * 60 * 1000,
        },
      );
      const res = await request(app)
        .patch("/auth/reset-password")
        .query({ token: rawToken })
        .send({ newPassword: "12121212" });
      expect(res.status).toBe(200);
    });
  });
});