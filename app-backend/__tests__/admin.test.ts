import { describe, beforeAll, beforeEach, afterAll, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../src/server";
import mongoose from "mongoose";
import User from "../src/models/userSchema";
import { Doctor } from "../src/models/doctorSchema";
import DocSlot from "../src/models/slotSchema";
import Appointment from "../src/models/appointmentSchema";
import { getStripeInstance } from "../src/config/stripe";

describe("Admin API Integration Tests", () => {
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
  }, 30000);

  beforeEach(async () => {
    await User.deleteMany();
    await Doctor.deleteMany();
    await Appointment.deleteMany();
    await DocSlot.deleteMany();

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

    const [loginUserRes, loginAdminRes] = await Promise.all([
      request(app)
        .post("/auth/login")
        .send({ email: "usertest1@gmail.com", password: "12345678" }),
      request(app)
        .post("/auth/login")
        .send({ email: "adminEmail@gmail.com", password: "12345678" }),
    ]);

    const createSlot = await DocSlot.create({
      doctorID: createDoctor1._id,
      date: "2026-10-16",
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

  // --- 1. Authorization & Doctor Requests ---
  describe("Admin Authorization & Doctor Requests", () => {
    it("should return 403 if a user tries to get an admin path", async () => {
      const res = await request(app)
        .get("/admin/all-patients")
        .set("Authorization", userAccessToken);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Access denied!");
    });

    it("should return 200 even if there are no requests", async () => {
      const res = await request(app)
        .get("/admin/doctor-requests")
        .set("Authorization", adminAccessToken);

      expect(res.status).toBe(200);
    });

    it("should return all requests in db and also using search query", async () => {
      const docReq =  await request(app).post("/doctors/app-as-doctor").send({
          consultationFee: 50,
          specialty: "testSpecialty",
          address: "testAddress",
          phone: "1234567890",
      }).set("Authorization" , userAccessToken);
      const res = await request(app)
        .get("/admin/doctor-requests?search=user1")
        .set("Authorization", adminAccessToken);
      expect(res.status).toBe(200);
      expect(res.body.data[0].userID.first_name).toBe("user1");
    });

    it("should return 400 if doctor id is invalid when updating status", async () => {
      const res = await request(app)
        .patch("/admin/doctor-requests/6aac9a882f4609aabc9be45z/status")
        .set("Authorization", adminAccessToken)
        .send({ status: "approved" });

      expect(res.status).toBe(400);
    });

    it("should return 400 if status is not approved or rejected", async () => {
      const res = await request(app)
        .patch(`/admin/doctor-requests/${doctorID1}/status`)
        .set("Authorization", adminAccessToken)
        .send({ status: "testStatus" });

      expect(res.status).toBe(400);
    });

    it("should return 404 if doctor profile not found", async () => {
      const res = await request(app)
        .patch(`/admin/doctor-requests/6aac9a882f4609aabc9be45a/status`)
        .set("Authorization", adminAccessToken)
        .send({ status: "approved" });

      expect(res.status).toBe(404);
    });

    it("should return 200 if doctor has been accepted and update role to doctor", async () => {
      const res = await request(app)
        .patch(`/admin/doctor-requests/${doctorID1}/status`)
        .set("Authorization", adminAccessToken)
        .send({ status: "approved" });

      expect(res.status).toBe(200);
      expect(res.body.data.userID.role).toBe("doctor");
    });

    it("should return 200 if doctor has been rejected and delete profile", async () => {
      const res = await request(app)
        .patch(`/admin/doctor-requests/${doctorID1}/status`)
        .set("Authorization", adminAccessToken)
        .send({ status: "rejected" });

      const getDoc = await Doctor.findById(doctorID1).lean();

      expect(res.status).toBe(200);
      expect(getDoc).toBeNull();
    });
  });

  // --- 2. Admin Get Lists (Patients, Doctors, Appointments) ---
  describe("Admin Listings (Patients, Doctors, Appointments)", () => {
    it("should return 200 and all patients with search query", async () => {
      const res = await request(app)
        .get("/admin/all-patients?search=")
        .set("Authorization", adminAccessToken);

      expect(res.status).toBe(200);
    });

    it("should return 200 and all doctors in db with search query", async () => {
      const res = await request(app)
        .get("/admin/all-doctors?search=specialtytest2")
        .set("Authorization", adminAccessToken);

      expect(res.status).toBe(200);
    });

    it("should return all appointments in db and use search query", async () => {
      const res = await request(app)
        .get("/admin/all-appointments?search=2026-10-16")
        .set("Authorization", adminAccessToken);

      expect(res.status).toBe(200);
      expect(res.body.data[0].slotID.date).toBe("2026-10-16");
    });
  });

  // --- 3. Admin Appointment Cancellation ---
  describe("Admin Cancel Appointment", () => {
    it("should return 400 if appointment id is not valid", async () => {
      const res = await request(app)
        .patch(`/admin/cancel-appointment/6aacb14fc26a4b35a9930b7z`)
        .set("Authorization", adminAccessToken);

      expect(res.status).toBe(400);
    });

    it("should return 404 if appointment not found", async () => {
      const res = await request(app)
        .patch(`/admin/cancel-appointment/6aacb14fc26a4b35a9930b7a`)
        .set("Authorization", adminAccessToken);

      expect(res.status).toBe(404);
    });

    it("should return 200 if appointment cancelled successfully and refund payment", async () => {
      const res = await request(app)
        .patch(`/admin/cancel-appointment/${appointmentID}`)
        .set("Authorization", adminAccessToken);

      const [getSlot, getAppointment] = await Promise.all([
        DocSlot.findById(slotID).lean(),
        Appointment.findById(appointmentID).lean(),
      ]);

      expect(res.status).toBe(200);
      expect(getSlot?.isBooked).toBe(false);
      expect(getAppointment?.status).toBe("cancelled");
      expect(getAppointment?.paymentIntentId).toBeNull();
    });

    it("should return 400 if appointment has already been cancelled", async () => {
      // إلغاء الموعد أولاً
      await Appointment.findByIdAndUpdate(appointmentID, { status: "cancelled" });

      const res = await request(app)
        .patch(`/admin/cancel-appointment/${appointmentID}`)
        .set("Authorization", adminAccessToken);

      expect(res.status).toBe(400);
    });
  });

  // --- 4. Admin User Role Management ---
  describe("Admin User Role Management", () => {
    it("should return 400 if new role is invalid", async () => {
      const res = await request(app)
        .patch(`/admin/update-role/6aacc0b3c42af7c659850f70`)
        .set("Authorization", adminAccessToken)
        .send({ newRole: "testRole" });

      expect(res.status).toBe(400);
    });

    it("should return 400 if user id is not valid", async () => {
      const res = await request(app)
        .patch("/admin/update-role/6aacc0b3c42af7c659850f7z")
        .set("Authorization", adminAccessToken)
        .send({ newRole: "admin" });

      expect(res.status).toBe(400);
    });

    it("should return 404 if account not found", async () => {
      const res = await request(app)
        .patch("/admin/update-role/6aacc0b3c42af7c659850f7a")
        .set("Authorization", adminAccessToken)
        .send({ newRole: "admin" });

      expect(res.status).toBe(404);
    });

    it("should return 200 if role updated successfully", async () => {
      const res = await request(app)
        .patch(`/admin/update-role/${userID}`)
        .set("Authorization", adminAccessToken)
        .send({ newRole: "admin" });

      const getUser = await User.findById(userID).lean();

      expect(res.status).toBe(200);
      expect(getUser?.role).toBe("admin");
    });
  });

  // --- 5. Admin Block User & Account Deletion ---
  describe("Admin Block User & Account Deletion", () => {
    it("should return 400 if user id is invalid for blocking", async () => {
      const res = await request(app)
        .patch("/admin/block-user/6aacc0b3c42af7c659850f7z")
        .set("Authorization", adminAccessToken)
        .send({ isBlocked: true });

      expect(res.status).toBe(400);
    });

    it("should return 404 if account not found for blocking", async () => {
      const res = await request(app)
        .patch("/admin/block-user/6aacc0b3c42af7c659850f7a")
        .set("Authorization", adminAccessToken)
        .send({ isBlocked: true });
      expect(res.status).toBe(404);
    });

    it("should return 400 if isBlocked field is not a boolean", async () => {
      const res = await request(app)
        .patch(`/admin/block-user/${userID}`)
        .set("Authorization", adminAccessToken)
        .send({ isBlocked: "test" });

      expect(res.status).toBe(400);
    });

    it("should return 403 if admin tries to block another admin", async () => {
      await User.findByIdAndUpdate(userID, { role: "admin" });

      const res = await request(app)
        .patch(`/admin/block-user/${userID}`)
        .set("Authorization", adminAccessToken)
        .send({ isBlocked: true });

      expect(res.status).toBe(403);
    });

    it("should return 200 if the account has been blocked successfully", async () => {
      const [res, getUser] = await Promise.all([
        request(app)
          .patch(`/admin/block-user/${userID}`)
          .set("Authorization", adminAccessToken)
          .send({ isBlocked: true }),
        User.findById(userID).lean(),
      ]);

      expect(res.status).toBe(200);
      expect(res.body.data.isBlocked).toBe(true);
      expect(res.body.data.tokenVersion).toBeGreaterThan(
        getUser?.tokenVersion as number,
      );
    });

    it("should return 200 if account has been deleted successfully", async () => {
      const res = await request(app)
        .delete(`/admin/delete-account/${userID}`)
        .set("Authorization", adminAccessToken);
      const getUser = await User.findById(userID).lean();

      expect(res.status).toBe(200);
      expect(getUser).toBeNull();
    });

    it("should return 200 if doctor account is deleted from Doctor and User schema", async () => {
      const res = await request(app)
        .delete(`/admin/delete-account/${doctorUserID1}`)
        .set("Authorization", adminAccessToken);

      const [getUser, getDocUserAccount] = await Promise.all([
        User.findById(doctorUserID1).lean(),
        Doctor.findOne({ userID: doctorUserID1 }),
      ]);

      expect(res.status).toBe(200);
      expect(getUser).toBeNull();
      expect(getDocUserAccount).toBeNull();
    });
  });

  // --- 6. Admin Slot Management ---
  describe("Admin Slot Management", () => {
    it("should return 400 if slot id is invalid", async () => {
      const res = await request(app)
        .delete("/admin/delete-slot/6aa9d8cf51da0972b69ead8s")
        .set("Authorization", adminAccessToken);

      expect(res.status).toBe(400);
    });

    it("should return 404 if slot not found", async () => {
      const res = await request(app)
        .delete("/admin/delete-slot/6aa9d8cf51da0972b69ead89")
        .set("Authorization", adminAccessToken);

      expect(res.status).toBe(404);
    });

    it("should return 400 if slot has been booked when trying to delete", async () => {
      const res = await request(app)
        .delete(`/admin/delete-slot/${slotID}`)
        .set("Authorization", adminAccessToken);

      expect(res.status).toBe(400);
    });

    it("should return 204 if available slot has been deleted successfully", async () => {
      await DocSlot.findByIdAndUpdate(slotID, { isBooked: false });

      const res = await request(app)
        .delete(`/admin/delete-slot/${slotID}`)
        .set("Authorization", adminAccessToken);

      expect(res.status).toBe(204);
    });

    it("should return 400 if slotIDs is not an array or equals 0", async () => {
      const res = await request(app)
        .delete("/admin/delete-many-slots")
        .set("Authorization", adminAccessToken)
        .send({ slotIDs: "test" });

      expect(res.status).toBe(400);
    });

    it("should return 400 if one slot id in delete-many is invalid", async () => {
      const res = await request(app)
        .delete("/admin/delete-many-slots")
        .set("Authorization", adminAccessToken)
        .send({ slotIDs: ["6aa9d8cf51da0972b69ead8z"] });

      expect(res.status).toBe(400);
    });

    it("should return 200 if multiple available slots are deleted successfully", async () => {
      await DocSlot.findByIdAndUpdate(slotID, { isBooked: false });
      const createSlot2 = await DocSlot.create({
        doctorID: doctorID1,
        date: "2026-09-20",
        startTime: "15:00",
        endTime: "16:00",
        isBooked: false,
        price: 50,
      });
      const slotID2 = createSlot2._id.toString();

      const res = await request(app)
        .delete("/admin/delete-many-slots")
        .set("Authorization", adminAccessToken)
        .send({ slotIDs: [slotID, slotID2] });

      expect(res.status).toBe(200);
    });
  });
});
