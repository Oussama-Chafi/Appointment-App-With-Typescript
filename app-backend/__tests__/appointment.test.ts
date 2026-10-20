import {
  describe,
  beforeAll,
  beforeEach,
  afterAll,
  it,
  expect,
  jest,
} from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/server";
import User from "../src/models/userSchema";
import Appointment from "../src/models/appointmentSchema";
import DocSlot from "../src/models/slotSchema";
import { Doctor } from "../src/models/doctorSchema";
import { getStripeInstance } from "../src/config/stripe";

describe("Appointments API Integration Tests", () => {
  let avaiSlotID: string;
  let unavaiSlotID: string;
  let doctorID: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const testMongoUri =
      process.env.MONGO_URI_TEST ||
      "mongodb://127.0.0.1:27017/doctor_app_test?directConnection=true&retryWrites=false";
    await mongoose.connect(testMongoUri);
  }, 30000);

  beforeEach(async () => {
    await Appointment.deleteMany({});
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await DocSlot.deleteMany({});

    await request(app).post("/auth/register").send({
      email: "oussama1@gmail.com",
      password: "12345678",
      first_name: "oussama1",
      last_name: "oussama1",
    });

    await request(app).post("/auth/register").send({
      email: "oussama3@gmail.com",
      password: "12345678",
      first_name: "oussama2",
      last_name: "oussama2",
    });

    const userDoc = await User.create({
      first_name: "Doctor",
      last_name: "test",
      email: "doctortest@gmail.com",
      password: "87654321",
    });
    const addDoctor = await Doctor.create({
      userID: userDoc._id,
      specialty: "testSpecialty",
      phone: "1245788612",
      address: "testAdress",
      consultationFee: 50,
    });

    const [avaiSlot, unavaiSlot] = await Promise.all([
      DocSlot.create({
        doctorID: addDoctor._id,
        startTime: "10:00",
        endTime: "11:00",
        date: "23-09-2026",
        isBooked: false,
        price: 50,
      }),
      DocSlot.create({
        doctorID: addDoctor._id,
        startTime: "10:00",
        endTime: "11:00",
        date: "23-09-2026",
        isBooked: true,
        price: 50,
      }),
    ]);

    doctorID = addDoctor._id?.toString();
    avaiSlotID = avaiSlot._id.toString();
    unavaiSlotID = unavaiSlot._id.toString();
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // --- 1. POST /appointment/book ---
  describe("POST /appointment/book", () => {
    it("should return 404 if slotID is missing in params", async () => {
      const logRes = await request(app)
        .post("/auth/login")
        .send({ email: "oussama1@gmail.com", password: "12345678" });

      const res = await request(app)
        .post("/appointment/book")
        .set("Authorization", `Bearer ${logRes.body.accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 if slot ID is not an Object-Id", async () => {
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: "oussama1@gmail.com", password: "12345678" });

      const slotID = "a;lgha;lwgj;wajgklag;wrgsdl,g";

      const res = await request(app)
        .post(`/appointment/book/${slotID}`)
        .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 201 if appointment booked successfully", async () => {
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: "oussama1@gmail.com", password: "12345678" });

      const res = await request(app)
        .post(`/appointment/book/${avaiSlotID}`)
        .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should prevent double booking for the same slot at the exact same time", async () => {
      const [log1, log2] = await Promise.all([
        request(app)
          .post("/auth/login")
          .send({ email: "oussama1@gmail.com", password: "12345678" }),
        request(app)
          .post("/auth/login")
          .send({ email: "oussama3@gmail.com", password: "12345678" }),
      ]);

      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/appointment/book/${avaiSlotID}`)
          .set("Authorization", `Bearer ${log1.body.accessToken}`),
        request(app)
          .post(`/appointment/book/${avaiSlotID}`)
          .set("Authorization", `Bearer ${log2.body.accessToken}`),
      ]);

      const statusCodes = [res1.status, res2.status];
      expect(statusCodes).toContain(201);
      expect(statusCodes).toContain(404);
    });
  });

  // --- 2. GET /appointment/my-appointments ---
  describe("GET /appointment/my-appointments", () => {
    it("should return 200 if fetching has been successfully", async () => {
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: "oussama1@gmail.com", password: "12345678" });
      const userID = loginRes.body.user?.id;

      await Appointment.create({
        patientID: userID,
        doctorID,
        slotID: unavaiSlotID,
      });

      const res = await request(app)
        .get("/appointment/my-appointments")
        .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 200 if an appointment exists with search query", async () => {
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: "oussama1@gmail.com", password: "12345678" });

      const res = await request(app)
        .get("/appointment/my-appointments?23-09-2026")
        .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data >= 1);
    });
  });

  // --- 3. POST /appointment/cancel-appointment/:id ---
  describe("POST /appointment/cancel-appointment/:id", () => {
    it("should return 200 if appointment has been cancelled successfully", async () => {
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: "oussama1@gmail.com", password: "12345678" });

      const appointment = await Appointment.create({
        patientID: loginRes.body.user?.id,
        doctorID: doctorID,
        slotID: unavaiSlotID,
      });

      const res = await request(app)
        .post(`/appointment/cancel-appointment/${appointment._id}`)
        .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(200);
      const updateSlot = await DocSlot.findById(unavaiSlotID);
      expect(updateSlot?.isBooked).toBe(false);
    });

    it("should return 200 if an appointment paid has been cancelled successfully", async () => {
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: "oussama1@gmail.com", password: "12345678" });

      const stripe = getStripeInstance();
      const payment_intent = await stripe.paymentIntents.create({
        amount: 5000,
        currency: "usd",
        payment_method_types: ["card"],
        payment_method: "pm_card_visa",
        confirm: true,
      });

      const appointment = await Appointment.create({
        patientID: loginRes.body.user?.id,
        doctorID,
        slotID: unavaiSlotID,
        payment: true,
        paymentStatus: "paid",
        paymentIntentId: payment_intent.id,
        status: "confirmed",
        price: 50,
      });

      const res = await request(app)
        .post(`/appointment/cancel-appointment/${appointment._id}`)
        .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(200);

      const [updateSlot, updateAppointment] = await Promise.all([
        DocSlot.findById(unavaiSlotID).lean(),
        Appointment.findById(appointment._id).lean(),
      ]);

      expect(updateSlot?.isBooked).toBe(false);
      expect(updateAppointment?.status).toBe("cancelled");
      expect(updateAppointment?.paymentStatus).toBe("refunded");
    });
  });

  // --- 4. Stripe / Booking Error Handling ---
  describe("Stripe / Booking Error Handling", () => {
    it("should release slot (isBooked: false) and not keep appointment if an error occurs during booking process", async () => {
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: "oussama1@gmail.com", password: "12345678" });

      expect(loginRes.status).toBe(200);

      const createSpy = jest
        .spyOn(Appointment, "create")
        .mockImplementationOnce(() => {
          throw new Error("Database or Stripe failure simulation");
        });

      const res = await request(app)
        .post(`/appointment/book/${avaiSlotID}`)
        .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBeGreaterThanOrEqual(400);

      const getSlot = await DocSlot.findById(avaiSlotID).lean();
      expect(getSlot?.isBooked).toBe(false);

      createSpy.mockRestore();
    });
  });
});
