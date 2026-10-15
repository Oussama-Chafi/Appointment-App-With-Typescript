import {
  describe,
  beforeAll,
  beforeEach,
  afterAll,
  it,
  expect,
} from "@jest/globals";
import request from "supertest";
import { app } from "../src/server";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../src/models/userSchema";
import Appointment from "../src/models/appointmentSchema";

let mongoServer: MongoMemoryServer;
let userAccessToken: string;

const userTest = {
  first_name: "user",
  last_name: "test",
  email: "user@gmail.com",
  password: "12345678",
};

const createAndLogin = async () => {
  await request(app).post("/auth/register").send(userTest);
  const res = await request(app)
    .post("/auth/login")
    .send({ email: userTest.email, password: userTest.password });
  return `Bearer ${res.body.accessToken as string}`;
};

describe("User API Intagration Test", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri);
  }, 30000);

  // make sure you change the max of rate limit middleware.

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  beforeEach(async () => {
    await User.deleteMany({});
    await Appointment.deleteMany({});
    userAccessToken = await createAndLogin();
  }, 30000);

  describe("GET /profile/", () => {
    it("should return 401 if user isn't authenticated", async () => {
      const res = await request(app).get("/profile");
      expect(res.status).toBe(401);
    });

    it("should return 404 if user profile not found", async () => {
      await User.deleteMany({});
      const res = await request(app)
        .get("/profile")
        .set("Authorization", userAccessToken);
      expect(res.status).toBe(404);
    });

    it("should return 200 if the user got his profile", async () => {
      const res = await request(app)
        .get("/profile")
        .set("Authorization", userAccessToken);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(userTest.email);
    });
  });

  describe("PATCH /profile/update-profile", () => {
    it("should return 400 if updating without fields", async () => {
      const res = await request(app)
        .patch("/profile/update-profile")
        .set("Authorization", userAccessToken)
        .send({});
      expect(res.status).toBe(400);
    });

    it("should return 400 if the user try to update restricted fields  ", async () => {
      const res = await request(app)
        .patch("/profile/update-profile")
        .set("Authorization", userAccessToken)
        .send({ role: "admin" });
      expect(res.status).toBe(400);
    });

    it("should return 200 if updating was successfully", async () => {
      const res = await request(app)
        .patch("/profile/update-profile")
        .set("Authorization", userAccessToken)
        .send({ first_name: "update_name" });
      expect(res.status).toBe(200);
      expect(res.body.data.first_name).toBe("update_name");
    });
  });

  describe("PATCH /profile/change-password", () => {
    it("should return 400 if the confirm password feld is not correct", async () => {
      const res = await request(app)
        .patch("/profile/change-password")
        .set("authorization", userAccessToken)
        .send({
          oldPassword: userTest.password,
          newPassword: "87654321",
          confirmNewPass: "88765432",
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if old password is not correct", async () => {
      const res = await request(app)
        .patch("/profile/change-password")
        .set("authorization", userAccessToken)
        .send({
          oldPassword: "44441111",
          newPassword: "87654321",
          confirmNewPass: "87654321",
        });

      expect(res.status).toBe(400);
    });

    it("should return 200 if the password has been changed successfully", async () => {
      const res = await request(app)
        .patch("/profile/change-password")
        .set("authorization", userAccessToken)
        .send({
          oldPassword: userTest.password,
          newPassword: "87654321",
          confirmNewPass: "87654321",
        });

      expect(res.status).toBe(200);

      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: userTest.email, password: "87654321" });

      expect(loginRes.body.accessToken).toBeDefined();
    });
  });
  describe("DELETE /profile/delete-account", () => {
    it("should return 400 if the password is not correct", async () => {
      const res = await request(app)
        .delete("/profile/delete-account")
        .set("authorization", userAccessToken)
        .send({ password: "1223455410" });

      expect(res.status).toBe(400);
    });

    it("should return 204 if the account has been deleted successfully and the password was correct", async () => {
      const res = await request(app)
        .delete("/profile/delete-account")
        .set("authorization", userAccessToken)
        .send({ password: userTest.password });

      expect(res.status).toBe(204);
    });
  });

  describe("PATCH /profile/logout-all", () => {
    it("should return 200 if the password is correct and the tokenVersion has been updated successfully", async () => {
      const res = await request(app)
        .patch("/profile/logout-all")
        .set("authorization", userAccessToken)
        .send({ password: userTest.password });

      expect(res.status).toBe(200);
    });

    it("should return 400 if the password is not correct ", async () => {
      const res = await request(app)
        .patch("/profile/logout-all")
        .set("authorization", userAccessToken)
        .send({ password: "1245678412" });

      expect(res.status).toBe(400);
    });
  });
});
