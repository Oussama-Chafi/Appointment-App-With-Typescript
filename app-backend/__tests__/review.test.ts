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
import User from "../src/models/userSchema";
import { Doctor } from "../src/models/doctorSchema";
import Appointment from "../src/models/appointmentSchema";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import DocSlot from "../src/models/slotSchema";

let mongoServer: MongoMemoryServer;

describe("Review API Intagration Test", () => {
  let userAccessToken1: string;
  let userAccessToken2: string;
  let doctorAccessToken1: string;
  let doctorAccessToken2: string;
  let appointmentId1: string;
  let appointmentId2: string;
  let doctorID1: string;
  let doctorID2: string;
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  }, 30000);
  beforeEach(async () => {
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await DocSlot.deleteMany({});

    const [addUser1, addUser2, addUserDoc1, addUserDoc2] = await Promise.all([
      request(app).post("/auth/register").send({
        first_name: "user1",
        last_name: "test1",
        email: "user1@gmail.com",
        password: "12345678",
      }),
      request(app).post("/auth/register").send({
        first_name: "user2",
        last_name: "test2",
        email: "user2@gmail.com",
        password: "12345678",
      }),
      request(app).post("/auth/register").send({
        first_name: "doctor1",
        last_name: "test1",
        email: "doctor1@gmail.com",
        password: "12345678",
      }),
      request(app).post("/auth/register").send({
        first_name: "doctor2",
        last_name: "test2",
        email: "doctor2@gmail.com",
        password: "12345678",
      }),
    ]);
    const [createDoctor1, createDoctor2] = await Promise.all([
      Doctor.create({
        userID: addUserDoc1.body.user.id,
        phone: "1245783256",
        specialty: "specialtytest1",
        address: "testAddress",
        consultationFee: 50,
      }),
      Doctor.create({
        userID: addUserDoc2.body.user.id,
        phone: "1245783256",
        specialty: "specialtytest1",
        address: "testAddress",
        consultationFee: 50,
      }),
    ]);
    const [loginResUser1, loginResUser2, loginResDoc1, loginResDoc2] =
      await Promise.all([
        request(app)
          .post("/auth/login")
          .send({ email: "user1@gmail.com", password: "12345678" }),
        request(app)
          .post("/auth/login")
          .send({ email: "user2@gmail.com", password: "12345678" }),
        request(app)
          .post("/auth/login")
          .send({ email: "doctor1@gmail.com", password: "12345678" }),
        request(app)
          .post("/auth/login")
          .send({ email: "doctor2@gmail.com", password: "12345678" }),
      ]);

    const [createSlot1, createSlot2] = await Promise.all([
      DocSlot.create({
        doctorID: createDoctor1._id,
        date: "2026-10-18",
        startTime: "10:00",
        endTime: "11:00",
        isBooked: true,
        price: 50,
      }),
      DocSlot.create({
        doctorID: createDoctor2._id,
        date: "2026-10-19",
        startTime: "14:00",
        endTime: "15:00",
        isBooked: true,
        price: 50,
      }),
    ]);
    const [createAppointment1, createAppointment2] = await Promise.all([
      Appointment.create({
        doctorID: createDoctor1._id,
        slotID: createSlot1._id,
        patientID: addUser1.body.user.id,
        payment: true,
        paymentStatus: "paid",
        status: "completed",
      }),
      Appointment.create({
        doctorID: createDoctor2._id,
        slotID: createSlot2._id,
        patientID: addUser2.body.user.id,
      }),
    ]);
    userAccessToken1 = `Bearer ${loginResUser1.body.accessToken as string}`;
    userAccessToken2 = `Bearer ${loginResUser2.body.accessToken as string}`;
    doctorAccessToken1 = `Bearer ${loginResDoc1.body.accessToken as string}`;
    doctorAccessToken2 = `Bearer ${loginResDoc2.body.accessToken as string}`;
    appointmentId1 = createAppointment1._id.toString();
    appointmentId2 = createAppointment2._id.toString();
    doctorID1 = createDoctor1._id.toString();
    doctorID2 = createDoctor2._id.toString();
  }, 30000);
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("POST reviews/doctor/:doctorID/appointment/:appointmentID", () => {
    it("should return 400 if any field is missing", async () => {
      const res = await request(app)
        .post(`/reviews/doctor/${doctorID1}/appointment/${appointmentId1}`)
        .set("Authorization", userAccessToken1)
        .send({ rate: 4 });
      expect(res.status).toBe(400);
    });

    it("should return 400 if doctorID or appointmentID is invalid", async () => {
      const res = await request(app)
        .post(`/reviews/doctor/invalid-doctor-id/appointment/${appointmentId1}`)
        .set("Authorization", userAccessToken1)
        .send({ rate: 3, comment: "test comment" });

      expect(res.status).toBe(400);
    });

    it("should return 404 if doctor profile or if appointment not found ", async () => {
      const res = await request(app)
        .post(
          `/reviews/doctor/${doctorID1}/appointment/6aa9d8cf51da0972b69ead8a`,
        )
        .set("Authorization", userAccessToken1)
        .send({ rate: 3, comment: "test comment" });

      expect(res.status).toBe(404);
    });

    it("should return 201 if the appointment has benn successfully reviewed", async () => {
      const res = await request(app)
        .post(`/reviews/doctor/${doctorID1}/appointment/${appointmentId1}`)
        .set("Authorization", userAccessToken1)
        .send({ rate: 3, comment: "test comment" });
      expect(res.status).toBe(201);
    });

    it("should return 400 if this appointment has already a review", async () => {
      await request(app)
        .post(`/reviews/doctor/${doctorID1}/appointment/${appointmentId1}`)
        .set("Authorization", userAccessToken1)
        .send({ rate: 3, comment: "test comment" });

      const res = await request(app)
        .post(`/reviews/doctor/${doctorID1}/appointment/${appointmentId1}`)
        .set("Authorization", userAccessToken1)
        .send({ rate: 3, comment: "test comment 2" });

      expect(res.status).toBe(400);
    });

    it("should return 403 if the user try to review someone's appointment", async () => {
      const res = await request(app)
        .post(`/reviews/doctor/${doctorID1}/appointment/${appointmentId1}`)
        .set("Authorization", userAccessToken2)
        .send({ rate: 1, comment: "test comment 2" });

      expect(res.status).toBe(403);
    });

    it("should return 400 if the appointment is not completed yet", async () => {
      const res = await request(app)
        .post(`/reviews/doctor/${doctorID2}/appointment/${appointmentId2}`)
        .set("Authorization", userAccessToken2)
        .send({ rate: 1, comment: "test comment 2" });

      expect(res.status).toBe(400);
    });

    it("should return 403 if the doctor wasn't assigned to this appointment", async () => {
      const res = await request(app)
        .post(`/reviews/doctor/${doctorID2}/appointment/${appointmentId1}`)
        .set("Authorization", userAccessToken2)
        .send({ rate: 1, comment: "test comment 2" });

      expect(res.status).toBe(403);
    });
  });
});
