import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../src/server.js";
import User from "../src/models/userSchema.js";
import crypto from "crypto";

describe("Auth API Integration Tests", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const testMongoUri =
      process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/doctor_app_test";
    await mongoose.connect(testMongoUri);
  }, 15000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return 400 if one field is missing in register", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "oussama1", password: "12345678", first_name: "oussama" });
    expect(res.status).toBe(400);
  });

  it("should return 400 if password is last then 8 caracters", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "oussama6@gmail.com",
      password: "1234567",
      last_name: "oussama",
      first_name: "oussama",
    });
    expect(res.status).toBe(400);
  });

  it("should return 201 if account has been created successfully", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "oussama6@gmail.com",
      password: "12345678",
      first_name: "oussama",
      last_name: "oussama",
    });
    expect(res.status).toBe(201);
  });

  it("should return 409 if email is already exist in dbs", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "oussama6@gmail.com",
      password: "12345678",
      first_name: "oussma",
      last_name: "ouss",
    });
    expect(res.status).toBe(409);
  });

  it("should return 400 if email or password is missing in login ", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "oussama6@gmail.com" });
    expect(res.status).toBe(400);
  });

  it("should return 400 if password or email is not correct in login ", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "oussama6@gmail.com", password: "87654321" });
    expect(res.status).toBe(400);
  });

  it("should return 200 if email and password are correct", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "oussama6@gmail.com",
      password: "12345678",
    });
    expect(res.status).toBe(200);
  });

  it("should return 400 if email is missing in forget-password", async () => {
    const res = await request(app).post("/auth/forget-password").send({});
    expect(res.status).toBe(400);
  });

  it("should return 200 if email is correct in forget-password", async () => {
    const res = await request(app)
      .post("/auth/forget-password")
      .send({ email: "oussama6@gmail.com" });
    expect(res.status).toBe(200);
  });

  it("should get a new access token using refresh cookie", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "oussama6@gmail.com", password: "12345678" });

    const cookies = loginRes.headers["set-cookie"];

    const res = await request(app).get("/auth/refresh").set("Cookie", cookies);
    expect(res.status).toBe(200);
  });

  it("should return 204 if refresh token is not exist in cookies", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.status).toBe(204);
  });

  it("should return 200 if refresh token is exist in cookies", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "oussama6@gmail.com", password: "12345678" });
    const cookies = loginRes.headers["set-cookie"];
    const res = await request(app).post("/auth/logout").set("Cookie", cookies);
    expect(res.status).toBe(200);
  });

  it("should return 400 if token is not in query parameter", async () => {
    const res = await request(app).get("/auth/verify-email");
    expect(res.status).toBe(400);
  });

  it("should return 200 if token in query parameter", async () => {
    const user = await User.findOne({ email: "oussama6@gmail.com" }).lean();
    const token = user?.verificationToken as string;
    const res = await request(app).get("/auth/verify-email").query({ token });
    expect(res.status).toBe(400);
  });

  it("should retrun 400 if email is missing ", async () => {
    const res = await request(app).post("/auth/forget-password").send({});
    expect(res.status).toBe(400);
  });

  it("should return 404 if email address is not exist in dbs", async () => {
    const res = await request(app)
      .post("/auth/forget-password")
      .send({ email: "oussama5@gmail.com" });
    expect(res.status).toBe(404);
  });

  it("should return 200 if email is exist and also a resetToken", async () => {
    const res = await request(app)
      .post("/auth/forget-password")
      .send({ email: "oussama6@gmail.com" });
    expect(res.status).toBe(200);
  });

  it("should return 400 if reset token or new password is missing in query parameter", async () => {
    const res = await request(app).patch("/auth/reset-password").send({});
    expect(res.status).toBe(400);
  });

  it("should return 404 if no user with this token is exist or if token has been expired", async () => {
    const token =
      "lhgwogawkjaglhalrghakghaeoirugerlgkahnerjlgkaha;rghagrgkjrelghl;;g;gja";

    const res = await request(app)
      .patch("/auth/reset-password")
      .query({ token })
      .send({ newPassword: "44411122" });
    expect(res.status).toBe(404);
  });

  it("should return 200 if reset Token is correct and new Password is exist", async () => {
    const rawToken = "my-secret-reset-token";
    const hashToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    await User.findOneAndUpdate(
      { email: "oussama6@gmail.com" },
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
