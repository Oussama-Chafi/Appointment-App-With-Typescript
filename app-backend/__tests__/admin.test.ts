import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../src/server";
import mongoose from "mongoose";
import User from "../src/models/userSchema";
import { Doctor } from "../src/models/doctorSchema";
import DocSlot from "../src/models/slotSchema";
import Appointment from "../src/models/appointmentSchema";
import { getStripeInstance } from "../src/config/stripe";
describe("Admin API Intagration Tests", () => {
  let userAccessToken: string;
  let adminAccessToken: string;
  let doctorID1: string;
  let doctorID2: string;
  let slotID: string;
  let appointmentID: string;
  let userID: string;
  let doctorUserID1: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const testMongoUri =
      process.env.MONGO_URI_TEST ||
      "mongodb://127.0.0.1:27017/doctor_app_test?directConnection=true&retryWrites=false";
    await mongoose.connect(testMongoUri);
    await User.deleteMany();
    await Doctor.deleteMany();
    await Appointment.deleteMany();

    // you can cancel Authenticatin rate limit in the server file so you can send many requests

    const [createUser, createAdmin, createUserDoctor1, createUserDoctor2] =
      await Promise.all([
        request(app).post("/auth/register").send({
          email: "usertest1@gmail.com",
          password: "12345678",
          first_name: "user1",
          last_name: "test",
        }),
        request(app).post("/auth/register").send({
          first_name: "admin",
          last_name: "test",
          email: "adminEmail@gmail.com",
          password: "12345678",
          role: "admin",
        }),
        User.create({
          first_name: "doctor1",
          last_name: "test1",
          email: "doctorEmai1@gmail.com",
          password: "12345678",
          role: "doctor",
        }),
        User.create({
          first_name: "doctor2",
          last_name: "test2",
          email: "doctorEmail2@gmail.com",
          password: "12345678",
          role: "doctor",
        }),
      ]);

    const [createDoctor1, createDoctor2] = await Promise.all([
      Doctor.create({
        userID: createUserDoctor1._id,
        phone: "1245783256",
        specialty: "specialtytest1",
        address: "testAddress",
        consultationFee: 50,
      }),
      Doctor.create({
        userID: createUserDoctor2._id,
        phone: "1245783256",
        specialty: "specialtytest2",
        address: "testAddress",
        consultationFee: 50,
      }),
    ]);

    const [loginUserRes, loginAdminRes, loginUserDoctorRis] = await Promise.all(
      [
        request(app)
          .post("/auth/login")
          .send({ email: "usertest1@gmail.com", password: "12345678" }),
        request(app)
          .post("/auth/login")
          .send({ email: "adminEmail@gmail.com", password: "12345678" }),
        request(app)
          .post("/auth/login")
          .send({ email: "doctorEmail@gmail.com", password: "12345678" }),
      ],
    );

    const createSlot = await DocSlot.create({
      doctorID: createDoctor1._id,
      date: "2026-09-20",
      startTime: "11:00",
      endTime: "12:00",
      isBooked: true,
      price: 50,
    });
    const stripe = getStripeInstance();
    const payment_intent = await stripe.paymentIntents.create({
      amount: 5000,
      payment_method_types: ["card"],
      payment_method: "pm_card_visa",
      currency: "usd",
      confirm: true,
    });
    const createAppointment = await Appointment.create({
      patientID: createUser.body.user.id,
      doctorID: createDoctor1._id,
      slotID: createSlot._id,
      payment: true,
      paymentStatus: "paid",
      paymentIntentId: payment_intent.id,
      //   status: "cancelled",
      // status : "completed",
      status: "confirmed",
    });
    userAccessToken = `Bearer ${loginUserRes.body.accessToken}`;
    adminAccessToken = `Bearer ${loginAdminRes.body.accessToken}`;
    doctorID1 = createDoctor1._id.toString();
    doctorID2 = createDoctor2._id.toString();
    appointmentID = createAppointment._id.toString();
    slotID = createSlot._id.toString();
    userID = createUser.body.user.id.toString();
    doctorUserID1 = createUserDoctor1._id.toString();
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return 403 if a user try to get an admin path", async () => {
    const res = await request(app)
      .get("/admin/all-patients")
      .set("Authorization", userAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Access denied!");
  });

  it("should return 200 even if threr is no requests", async () => {
    const res = await request(app)
      .get("/admin/doctor-requests")
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(200);
  });

  it("should return all requests in db and also using search query", async () => {
    const res = await request(app)
      .get("/admin/doctor-requests?search=doctor2")
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(200);
    expect(res.body.data[0].userID.first_name).toBe("doctor2");
  });

  it("should return 400 if doctor id is invalid", async () => {
    const res = await request(app)
      .patch("/admin/doctor-requests/6aac9a882f4609aabc9be45z/status")
      .set("Authorization", adminAccessToken)
      .send({ status: "approved" });

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 400 if status is not approved or rejected", async () => {
    const res = await request(app)
      .patch(`/admin/doctor-requests/${doctorID1}/status`)
      .set("Authorization", adminAccessToken)
      .send({ status: "testStatus" });

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 404 if doctor profile not found", async () => {
    const res = await request(app)
      .patch(`/admin/doctor-requests/6aac9a882f4609aabc9be45a/status`)
      .set("Authorization", adminAccessToken)
      .send({ status: "approved" });

    console.log("res.body", res.body);
    expect(res.status).toBe(404);
  });

  it("should return 200 if doctor has been accepted and update his role to doctor", async () => {
    const res = await request(app)
      .patch(`/admin/doctor-requests/${doctorID1}/status`)
      .set("Authorization", adminAccessToken)
      .send({ status: "approved" });

    console.log("res.body", res.body);
    expect(res.status).toBe(200);
    expect(res.body.data.userID.role).toBe("doctor");
  });

  it("should return 200 if doctor has been rejected and also delete his profile as doctor ", async () => {
    const res = await request(app)
      .patch(`/admin/doctor-requests/${doctorID1}/status`)
      .set("Authorization", adminAccessToken)
      .send({ status: "rejected" });

    const getDoc = await Doctor.findById(doctorID1).lean();

    console.log("res.body", res.body);
    expect(res.status).toBe(200);
    expect(getDoc).toBeNull();
  });

  it("should return 200 and all patients and we can use search query", async () => {
    const res = await request(app)
      .get("/admin/all-patients?search=")
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(200);
  });

  it("should return 200 all doctors in db and we can use search query", async () => {
    const res = await request(app)
      .get("/admin/all-doctors?search=specialtytest2")
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(200);
  });

  it("should return all appointments in db and we can use search query", async () => {
    const res = await request(app)
      .get("/admin/all-appointments?search=2026-09-20")
      .set("Authorization", adminAccessToken);

    console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body.data[0].slotID.date).toBe("2026-09-20");
  });

  it("should return 400 if appointmetn id is not valid", async () => {
    const res = await request(app)
      .patch(`/admin/cancel-appointment/6aacb14fc26a4b35a9930b7z`)
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 404 if appointment not found", async () => {
    const res = await request(app)
      .patch(`/admin/cancel-appointment/6aacb14fc26a4b35a9930b7a`)
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(404);
  });

  it("should return 400 if this appointment has aleardy cancelled", async () => {
    const res = await request(app)
      .patch(`/admin/cancel-appointment/${appointmentID}`)
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 400 if this appointment has aleardy completed", async () => {
    const res = await request(app)
      .patch(`/admin/cancel-appointment/${appointmentID}`)
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 200 if the appointment has cancelled successfully and return payment mony to the patient if this appointment has paid", async () => {
    const res = await request(app)
      .patch(`/admin/cancel-appointment/${appointmentID}`)
      .set("Authorization", adminAccessToken);

    const [getSlot, getAppointment] = await Promise.all([
      DocSlot.findById(slotID).lean(),
      Appointment.findById(appointmentID).lean(),
    ]);
    console.log("appointment", getAppointment);
    console.log("res.body", res.body);
    expect(res.status).toBe(200);
    expect(getSlot?.isBooked).toBe(false);
    expect(getAppointment?.status).toBe("cancelled");
    expect(getAppointment?.paymentIntentId).toBe(null);
  });

  it("should return 400 if new role is not user | doctor | admin", async () => {
    const res = await request(app)
      .patch(`/admin/update-role/6aacc0b3c42af7c659850f70`)
      .set("Authorization", adminAccessToken)
      .send({ newRole: "testRole" });

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 400 if user id is not valid ", async () => {
    const res = await request(app)
      .patch("/admin/update-role/6aacc0b3c42af7c659850f7z")
      .set("Authorization", adminAccessToken)
      .send({ newRole: "admin" });

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 404 if this account not found", async () => {
    const res = await request(app)
      .patch("/admin/update-role/6aacc0b3c42af7c659850f7a")
      .set("Authorization", adminAccessToken)
      .send({ newRole: "admin" });

    console.log("res.body", res.body);
    expect(res.status).toBe(404);
  });

  it("should return 200 if role updated successfully", async () => {
    const res = await request(app)
      .patch(`/admin/update-role/${userID}`)
      .set("Authorization", adminAccessToken)
      .send({ newRole: "admin" });

    const getUser = await User.findById(userID).lean();

    console.log("user:", getUser);
    console.log("res.body", res.body);
    expect(res.status).toBe(200);
    expect(getUser?.role).toBe("admin");
  });

  it("should return 400 if user id is invalid", async () => {
    const res = await request(app)
      .patch("/admin/block-user/6aacc0b3c42af7c659850f7z")
      .set("Authorization", adminAccessToken)
      .send({ isBlocked: true });

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 404 if this account not found", async () => {
    const res = await request(app)
      .patch("/admin/block-user/6aacc0b3c42af7c659850f7a")
      .set("Authorization", adminAccessToken)
      .send({ isBlocked: true });

    console.log("res.body", res.body);
    expect(res.status).toBe(404);
  });
  it("should return 400 if isBlocked feld is not a boolean ", async () => {
    const res = await request(app)
      .patch("/admin/block-user/6aacc0b3c42af7c659850f7a")
      .set("Authorization", adminAccessToken)
      .send({ isBlocked: "test" });

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  // run the test in line 329 so we have changed the role of the user.

  it("should return 403 if an admin try to block an another admin", async () => {
    const res = await request(app)
      .patch(`/admin/block-user/${userID}`)
      .set("Authorization", adminAccessToken)
      .send({ isBlocked: true });

    console.log("res.body", res.body);
    expect(res.status).toBe(403);
  });

  it("should return 200 if the account has blocked", async () => {
    const [res, getUser] = await Promise.all([
      request(app)
        .patch(`/admin/block-user/${userID}`)
        .set("Authorization", adminAccessToken)
        .send({ isBlocked: true }),
      User.findById(userID).lean(),
    ]);

    console.log("res.body", res.body);
    expect(res.status).toBe(200);
    expect(res.body.data.isBlocked).toBe(true);
    expect(res.body.data.tokenVersion).toBeGreaterThan(
      getUser?.tokenVersion as number,
    );
  });

  it("should return 400 if user id is invalid", async () => {
    const res = await request(app)
      .delete("/admin/delete-account/6aacc0b3c42af7c659850f7z")
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 404 if this account not found", async () => {
    const res = await request(app)
      .delete(`/admin/delete-account/6aa9d8cf51da0972b69ead89`)
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(404);
  });

  // run test in the line 329 so we got two admins

  it("should return 403 if admin try to delete an admin account or himself ", async () => {
    const res = await request(app)
      .delete(`/admin/delete-account/${userID}`)
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(403);
  });

  it("should return 200 if the account has been deleted successfully ", async () => {
    const res = await request(app)
      .delete(`/admin/delete-account/${userID}`)
      .set("Authorization", adminAccessToken);
    const getUser = await User.findById(userID).lean();

    console.log("res.body", res.body);
    expect(res.status).toBe(200);
    expect(getUser).toBeNull();
  });

  it("should return 200 a doctor account delete from Doctor schema and User schema ", async () => {
    const res = await request(app)
      .delete(`/admin/delete-account/${doctorUserID1}`)
      .set("Authorization", adminAccessToken);

    const [getUser, getDocUserAccount] = await Promise.all([
      User.findById(doctorUserID1).lean(),
      Doctor.findOne({ userID: doctorUserID1 }),
    ]);

    console.log("res.body", res.body);
    expect(res.status).toBe(200);
    expect(getUser).toBeNull();
    expect(getDocUserAccount).toBeNull();
  });

  it("should return 400 if slot id is missing or is invalid", async () => {
    const res = await request(app)
      .delete("/admin/delete-slot/6aa9d8cf51da0972b69ead8s")
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 404 if slot not found", async () => {
    const res = await request(app)
      .delete("/admin/delete-slot/6aa9d8cf51da0972b69ead89")
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(404);
  });

  it("should return 400 if slot has been booked ", async () => {
    const res = await request(app)
      .delete(`/admin/delete-slot/${slotID}`)
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  // change isBooked to false in createSlot

  it("should return 204 if has been deleted successfully ", async () => {
    const res = await request(app)
      .delete(`/admin/delete-slot/${slotID}`)
      .set("Authorization", adminAccessToken);

    console.log("res.body", res.body);
    expect(res.status).toBe(204);
  });

  it("should return 400 if slotIDs is not an array or equal 0", async () => {
    const res = await request(app)
      .delete("/admin/delete-many-slots")
      .set("Authorization", adminAccessToken)
      .send({ slotIDs: "test" });

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 400 if one slot id is invalid", async () => {
    const res = await request(app)
      .delete("/admin/delete-many-slots")
      .set("Authorization", adminAccessToken)
      .send({ slotIDs: ["6aa9d8cf51da0972b69ead8z"] });
    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 400 if slot id is not equal 24 letter from ", async () => {
    const res = await request(app)
      .delete("/admin/delete-many-slots")
      .set("Authorization", adminAccessToken)
      .send({ slotIDs: ["6aa9d8cf51da0972b69ead8"] });
    console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 400 if slot has been booked and deleteaccount equal 0", async () => {
    const res = await request(app)
      .delete("/admin/delete-many-slots")
      .set("Authorization", adminAccessToken)
      .send({ slotIDs: [`${slotID}`] });

    console.log("res.body", res.body);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "No eligible unbooked slots were found to delete or you are not authorized to delete them.",
    );
  });

  it("should return 200 if the slots has been deleted successfully and just available slots", async () => {
    const createSlot = await DocSlot.create({
      doctorID: doctorID1,
      date: "2026-09020",
      startTime: "15:00",
      endTime: "16:00",
      isBooked: false,
      price: 50,
    });
    const slotID2 = createSlot._id.toString();
    const res = await request(app)
      .delete("/admin/delete-many-slots")
      .set("Authorization", adminAccessToken)
      .send({ slotIDs: [`${slotID}`, `${slotID2}`] });

    console.log("res.body", res.body);
    expect(res.status).toBe(200);
  });
});
