import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../src/server";
import mongoose from "mongoose";
import User from "../src/models/userSchema";
import Appointment from "../src/models/appointmentSchema";

describe("User API Intagration Tests ", () => {
  let userAccessToken: string;
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const testMongoUri =
      process.env.MONGO_URI_TEST ||
      "mongodb://127.0.0.1:27017/doctor_app_test?directConnection=true&retryWrites=false";
    await mongoose.connect(testMongoUri);

    await User.deleteMany();
    await Appointment.deleteMany();

    const createUser = await request(app).post("/auth/register").send({
      first_name: "user",
      last_name: "test",
      email: "usertest@gmail.com",
      password: "12345678",
    });
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "usertest@gmail.com", password: "12345678" });

    userAccessToken = `Bearer ${loginRes.body.accessToken as string}`;
    console.log(userAccessToken);
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return 401 if user isn't authenticated", async () => {
    const res = await request(app).get("/profile/");

    console.log("res.body", res.body);
    expect(res.status).toBe(401);
  });

  it("should return 200 if we got profile", async () => {
    const res = await request(app)
      .get("/profile/")
      .set("Authorization", userAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(200);
  });

  it("should return 404 if the user is not exist", async () => {
    await User.deleteMany();
    const res = await request(app)
      .get("/profile/")
      .set("Authorization", userAccessToken);

    console.log("res.body", res.body);
    // this status from auth-middleware;

    expect(res.status).toBe(404);
  });

  it("should return 400 if the user doesn't update anything ", async () => {
    const res = await request(app)
      .patch("/profile/update-profile")
      .send({})
      .set("Authorization", userAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 400 if user try to update a feld that his cannot updated", async () => {
    const res = await request(app)
      .patch("/profile/update-profile")
      .send({ role: "admin" })
      .set("authorization", userAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 200 if the feld has been updated successfully", async () => {
    const res = await request(app)
      .patch("/profile/update-profile")
      .set("authorization", userAccessToken)
      .send({
        first_name: "update_fi",
        phone: "1234567890",
        email: "updateEmail@gmail.com",
        gender: "Male",
      });

    console.log("res.body", res.body);
    expect(res.status).toBe(200);
  });

  // make sure you changed the max limit of authLimit to 2 so we can just register and login

  it("should return 429 if the rate limit middleware prevent request ", async () => {
    const res = await request(app)
      .patch("/profile/change-password")
      .set("authorization", userAccessToken)
      .send({
        oldPassword: "12345678",
        newPassword: "87654321",
        confirmNewPass: "87654321",
      });

    console.log("res.body", res.body);
    expect(res.status).toBe(429);
  });

  it("should return 400 if the new passwords are not matching", async () => {
    const res = await request(app)
      .patch("/profile/change-password")
      .set("authorization", userAccessToken)
      .send({
        oldPassword: "12345678",
        newPassword: "87654321",
        confirmNewPass: "88765432",
      });

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 400 if the old password is not matching the password from db", async () => {
    const res = await request(app)
      .patch("/profile/change-password")
      .set("authorization", userAccessToken)
      .send({
        oldPassword: "44441111",
        newPassword: "87654321",
        confirmNewPass: "87654321",
      });

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 200 if the password has been updated successfully", async () => {
    const res = await request(app)
      .patch("/profile/change-password")
      .set("authorization", userAccessToken)
      .send({
        oldPassword: "12345678",
        newPassword: "87654321",
        confirmNewPass: "87654321",
      });

    console.log("res.body", res.body);
    expect(res.status).toBe(200);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "usertest@gmail.com", password: "87654321" });

    console.log("loginRes.body", loginRes.body);
    expect(loginRes.body.accessToken).toBeDefined();
  });

  //  make sure you changed the max limit of authLimit to 2 so we can just register and login

  it("should return 429 if the rateLimit middleware prevent the request", async () => {
    const res = await request(app)
      .delete("/profile/delete-account")
      .set("authorization", userAccessToken)
      .send({ password: "12345678" });

    console.log("res.body", res.body);
    expect(res.status).toBe(204);
  });

  it("should return 400 if the password is not correct", async () => {
    const res = await request(app)
      .delete("/profile/delete-account")
      .set("authorization", userAccessToken)
      .send({ password: "1223455410" });

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 204 if the account has been deleted successfully and the password was correct", async () => {
    const res = await request(app)
      .delete("/profile/delete-account")
      .set("authorization", userAccessToken)
      .send({ password: "12345678" });

    console.log("res.body", res.body);
    expect(res.status).toBe(204);
  });

  it("should return 400 if the password is not correct", async () => {
    const res = await request(app)
      .patch("/profile/logout-all")
      .set("authorization", userAccessToken)
      .send({ password: "11100010" });

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  // make sure you changed the max limit of authLimit to 2 so we can just register and login

  it("should return 429 if the rate limit middleware prevent the request", async () => {
    const res = await request(app)
      .patch("/profile/logout-all")
      .set("authorization", userAccessToken)
      .send({ password: "12345678" });

    console.log("res.body", res.body);
    expect(res.status).toBe(429);
  });

  it("should return 200 if the password is correct and the tokenVersion has been updated successfully", async () => {
    const res = await request(app)
      .patch("/profile/logout-all")
      .set("authorization", userAccessToken)
      .send({ password: "12345678" });

    console.log("tokenVersion should be equal 1", await User.find());
    console.log("res.body", res.body);
    expect(res.status).toBe(200);
  });
});
