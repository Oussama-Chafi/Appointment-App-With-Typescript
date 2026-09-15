import { jest, describe, beforeAll, afterAll, it, expect } from "@jest/globals";
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

    await Appointment.deleteMany({});
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await DocSlot.deleteMany({});

    const user1 = await request(app).post("/auth/register").send({
      email: "oussama1@gmail.com",
      password: "12345678",
      first_name: "oussama1",
      last_name: "oussama1",
    });

    // this user  for double booking
    const user3 = await request(app).post("/auth/register").send({
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

  it("should return 404 if slotID is missing in params", async () => {
    const logRes = await request(app)
      .post("/auth/login")
      .send({ email: "oussama1@gmail.com", password: "12345678" });

    // missing slotId in params
    const res = await request(app)
      .post("/appointment/book")
      .set("Authorization", `Bearer ${logRes.body.accessToken}`);
    expect(res.status).toBe(404);
  });

  it("should return 400 if slot ID in not an Object-Id", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "oussama1@gmail.com", password: "12345678" });

    const slotID = "a;lgha;lwgj;wajgklag;wrgsdl,g";

    const res = await request(app)
      .post(`/appointment/book/${slotID}`)
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);
    expect(res.status).toBe(400);
  });

  it("should return 201 if appointment boocked successfully", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "oussama1@gmail.com", password: "12345678" });

    const res = await request(app)
      .post(`/appointment/book/${avaiSlotID}`)
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);
    // console.log(res.body);

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

  it("should return 200 if feating has been successfully", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "oussama1@gmail.com", password: "12345678" });
    const userID = loginRes.body.user?.id;
    console.log(userID);

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

  // you need to init rs.initiate() in powerSell as administator because there is session in the controller.

  it("should return 200 if appointment has been cancelled successfully", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "oussama1@gmail.com", password: "12345678" });
    console.log(loginRes.body);

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
    // console.log("slot" , updateSlot)
    expect(updateSlot?.isBooked).toBe(false);
  });

  // here we need to change the scret key of stripe so we can initialise an error from stripe instead using mock

  it("should release slot (isBooked: false) and not keep appointment if stripe API fails", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "oussama1@gmail.com", password: "12345678" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();

    const res = await request(app)
      .post(`/appointment/book/${avaiSlotID}`)
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);
    // console.log(res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);

    const getSlot = await DocSlot.findById(avaiSlotID).lean();
    expect(getSlot?.isBooked).toBe(false);

    // console.log(getSlot);

    const appointment = await Appointment.findOne({ avaiSlotID });
    expect(appointment).toBeNull();
  });

  it("it should return 200 if an appointment paid has been cancelled successfully", async () => {
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
    console.log("res status:", res.body);
    expect(res.status).toBe(200);
    const [updateSlot, updateAppointment] = await Promise.all([
      DocSlot.findById(unavaiSlotID).lean(),
      Appointment.findById(appointment._id).lean(),
    ]);
    // console.log("UpdateSlot :",updateSlot);
    // console.log("updateAppointment" , updateAppointment);
    expect(updateSlot?.isBooked).toBe(false);
    expect(updateAppointment?.status).toBe("cancelled");
    expect(updateAppointment?.paymentStatus).toBe("refunded");
  });

  // you can search with first name , last name , email or date
  it("should return 200 if an appointment exist with search query", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "oussama1@gmail.com", password: "12345678" });
    const appointment = await Appointment.create({
      patientID: loginRes.body.user?.id,
      doctorID,
      slotID: unavaiSlotID,
    });
    console.log("appointment", appointment);
    const res = await request(app)
      .get("/appointment/my-appointments?23-09-2026")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);
    console.log("res status:", res.body);
    expect(res.status).toBe(200);
    expect(res.body.data >= 1);
  });
});
