import { describe, beforeAll, afterAll, beforeEach, it, expect } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/server";
import User from "../src/models/userSchema";
import Appointment from "../src/models/appointmentSchema";
import DocSlot from "../src/models/slotSchema";
import { Doctor } from "../src/models/doctorSchema";

describe("Doctor API Integration Tests", () => {
  let accessToken: string;
  let doctorID: string;
  let doctorAccessToken1: string;
  let availableSlot: string;
  let unavailableSlot: string;
  let doctorID2: string;
  let doctorAccessToken2: string;
  let anotherAvailSlot: string;
  let appointmentID: string;
  let userDocId: string | undefined;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const testMongoUri =
      process.env.MONGO_URI_TEST ||
      "mongodb://127.0.0.1:27017/doctor_app_test?directConnection=true&retryWrites=false";
    await mongoose.connect(testMongoUri);

    await User.deleteMany({});
    await DocSlot.deleteMany({});
    await Doctor.deleteMany({});

    const user = await request(app).post("/auth/register").send({
      first_name: "user",
      last_name: "test",
      email: "userTest1@gmail.com",
      password: "12345678",
    });
    const userID = user.body.user?.id as string;

    const [userDoc1, userDoc2] = await Promise.all([
      request(app).post("/auth/register").send({
        first_name: "doctor",
        last_name: "test1",
        email: "userDoc1@gmail.com",
        password: "12345678",
      }),
      request(app).post("/auth/register").send({
        first_name: "doctor",
        last_name: "test2",
        email: "userDoc2@gmail.com",
        password: "12345678",
      }),
    ]);

    const [updateRole1, updateRole2] = await Promise.all([
      User.findOneAndUpdate(
        { _id: userDoc1.body.user?.id },
        { role: "doctor" },
        { returnDocument: "after" },
      ),
      User.findOneAndUpdate(
        { _id: userDoc2.body.user?.id },
        { role: "doctor" },
        { returnDocument: "after" },
      ),
    ]);

    const [addDoctor1, addDoctor2] = await Promise.all([
      Doctor.create({
        userID: updateRole1?._id,
        specialty: "specialtyTest1",
        address: "addressTest",
        phone: "1201221454",
        consultationFee: 50,
      }),
      Doctor.create({
        userID: updateRole2?._id,
        specialty: "specialtyTest2",
        address: "addressTest",
        phone: "1201221454",
        consultationFee: 50,
      }),
    ]);

    const [loginUserRes, loginDoc1Res, loginDoc2Res] = await Promise.all([
      request(app)
        .post("/auth/login")
        .send({ email: "userTest1@gmail.com", password: "12345678" }),
      request(app)
        .post("/auth/login")
        .send({ email: "userDoc1@gmail.com", password: "12345678" }),
      request(app)
        .post("/auth/login")
        .send({ email: "userDoc2@gmail.com", password: "12345678" }),
    ]);

    const [avaiSlot, unavaiSlot, anotherSlot] = await Promise.all([
      DocSlot.create({
        doctorID: addDoctor1._id,
        date: "2026-09-16",
        startTime: "10:00",
        endTime: "11:00",
        price: 50,
        isBooked: false,
      }),
      DocSlot.create({
        doctorID: addDoctor1._id,
        date: "2026-10-16",
        startTime: "11:00",
        endTime: "12:00",
        price: 50,
        isBooked: true,
      }),
      DocSlot.create({
        doctorID: addDoctor1._id,
        date: "2026-10-16",
        startTime: "10:00",
        endTime: "11:00",
        price: 50,
        isBooked: false,
      }),
    ]);

    const appointment = await Appointment.create({
      patientID: userID,
      doctorID: addDoctor1._id,
      slotID: unavaiSlot._id,
    });

    accessToken = `Bearer ${loginUserRes.body.accessToken}`;
    doctorID = addDoctor1._id.toString();
    doctorID2 = addDoctor2._id.toString();
    doctorAccessToken1 = `Bearer ${loginDoc1Res.body.accessToken}`;
    doctorAccessToken2 = `Bearer ${loginDoc2Res.body.accessToken}`;
    availableSlot = avaiSlot._id.toString();
    unavailableSlot = unavaiSlot._id.toString();
    anotherAvailSlot = anotherSlot._id.toString();
    appointmentID = appointment._id.toString();
    userDocId = updateRole1?._id.toString();
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // --- 1. POST /doctors/app-as-doctor ---
  describe("POST /doctors/app-as-doctor", () => {
    it("should return 201 if application was submitted successfully", async () => {
      const tempUser = await request(app).post("/auth/register").send({
        first_name: "temp",
        last_name: "user",
        email: "tempuser@gmail.com",
        password: "12345678",
      });
      const tempLogin = await request(app)
        .post("/auth/login")
        .send({ email: "tempuser@gmail.com", password: "12345678" });
      const tempToken = `Bearer ${tempLogin.body.accessToken}`;

      const res = await request(app)
        .post("/doctors/app-as-doctor")
        .send({
          consultationFee: 50,
          specialty: "testSpecialty",
          address: "testAddress",
          phone: "1234561230",
        })
        .set("Authorization", tempToken);

      
      expect(res.status).toBe(201);
      expect(res.body.data?.status).toBe("pending");
    });

    it("should return 400 if this user already sent a request", async () => {
      await request(app)
        .post("/doctors/app-as-doctor")
        .send({
          consultationFee: 50,
          specialty: "testSpecialty",
          address: "testAddress",
          phone: "1234561230",
        })
        .set("Authorization", accessToken);

      const res = await request(app)
        .post("/doctors/app-as-doctor")
        .send({
          consultationFee: 50,
          specialty: "testSpecialty",
          address: "testAddress",
          phone: "1234561230",
        })
        .set("Authorization", accessToken);

      expect(res.status).toBe(400);
    });

    it("should return 400 if phone number format is invalid", async () => {
      const res = await request(app)
        .post("/doctors/app-as-doctor")
        .send({
          consultationFee: 50,
          specialty: "testSpecialty",
          address: "testAddress",
          phone: "06121423541",
        })
        .set("Authorization", accessToken);

      expect(res.status).toBe(400);
    });
  });

  // --- 2. POST /doctors/add-slots ---
  describe("POST /doctors/add-slots", () => {
    it("should return 201 if slots have been created successfully", async () => {
      const res = await request(app)
        .post("/doctors/add-slots")
        .send({
          date: "2026-10-15",
          startTime: "09:00",
          endTime: "14:00",
          price: 50,
          excludedSlots: ["12:00"],
        })
        .set("Authorization", doctorAccessToken1);
      expect(res.status).toBe(201);
    });

    it("should return 400 if date is in the past or start time is higher than end time", async () => {
      const res = await request(app)
        .post("/doctors/add-slots")
        .send({
          date: "2026-09-14",
          startTime: "13:00",
          endTime: "09:00",
          price: 50,
          excludedSlots: ["12:00"],
        })
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(400);
    });
  });

  // --- 3. GET /doctors/all-doctors ---
  describe("GET /doctors/all-doctors", () => {
    it("should return 200 and filter results successfully with search query", async () => {
      const res = await request(app)
        .get("/doctors/all-doctors?search=userDoc1@gmail.com")
        .set("Authorization", accessToken);

      expect(res.status).toBe(200);
    });

    it("should return empty data if no doctor matches search query", async () => {
      const res = await request(app)
        .get("/doctors/all-doctors?search=doctortest@gmail.com")
        .set("Authorization", accessToken);

      expect(res.status).toBe(200);
    });
  });

  // --- 4. GET /doctors/available-slots/:id ---
  describe("GET /doctors/available-slots/:id", () => {
    it("should return 400 if doctor id is not valid", async () => {
      const res = await request(app)
        .get("/doctors/available-slots/ea")
        .set("Authorization", accessToken);

      expect(res.status).toBe(400);
    });

    it("should return 200 if doctor id is correct even if he has no slots", async () => {
      const res = await request(app)
        .get(`/doctors/available-slots/${doctorID}`)
        .set("Authorization", accessToken);

      expect(res.status).toBe(200);
    });

    it("should return slots filtered by search query and validity", async () => {
      const res = await request(app)
        .get(`/doctors/available-slots/${doctorID}?search=2026-09-14`)
        .set("Authorization", accessToken);

      expect(res.status).toBe(200);
    });

    it("should return 404 if doctor profile is not found", async () => {
      const res = await request(app)
        .get("/doctors/available-slots/6aa9d8cf51da0972b69ead89")
        .set("Authorization", accessToken);

      expect(res.status).toBe(404);
    });
  });

  // --- 5. DELETE /doctors/delete-slot/:id ---
  describe("DELETE /doctors/delete-slot/:id", () => {
    it("should return 403 if a regular user tries to access protected route", async () => {
      const res = await request(app)
        .delete(`/doctors/delete-slot/${availableSlot}`)
        .set("Authorization", accessToken);

      expect(res.status).toBe(403);
    });

    it("should return 400 if slot id is not valid", async () => {
      const res = await request(app)
        .delete("/doctors/delete-slot/6aa9d8cf51da0972b69ead8j")
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(400);
    });

    it("should return 400 if a slot has already been booked", async () => {
      const res = await request(app)
        .delete(`/doctors/delete-slot/${unavailableSlot}`)
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(400);
    });

    it("should return 403 if one doctor tries to delete another doctor's slot", async () => {
      const res = await request(app)
        .delete(`/doctors/delete-slot/${availableSlot}`)
        .set("Authorization", doctorAccessToken2);

      expect(res.status).toBe(403);
    });

    it("should return 204 if slot has been deleted successfully", async () => {
      const res = await request(app)
        .delete(`/doctors/delete-slot/${availableSlot}`)
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(204);
    });

    it("should return 404 if slot does not exist", async () => {
      const res = await request(app)
        .delete("/doctors/delete-slot/6aa9d8cf51da0972b69ead89")
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(404);
    });
  });

  // --- 6. DELETE /doctors/delete-many-slots ---
  describe("DELETE /doctors/delete-many-slots", () => {
    it("should return 400 if request body is not an array", async () => {
      const res = await request(app)
        .delete("/doctors/delete-many-slots")
        .send({ slotIDs: `${availableSlot} , ${anotherAvailSlot}` })
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(400);
    });

    it("should return 400 if a doctor tries to delete another doctor's slots", async () => {
      const res = await request(app)
        .delete("/doctors/delete-many-slots")
        .send({ slotIDs: [availableSlot, anotherAvailSlot] })
        .set("Authorization", doctorAccessToken2);

      expect(res.status).toBe(400);
    });

    it("should return 400 if any slot id is invalid", async () => {
      const res = await request(app)
        .delete("/doctors/delete-many-slots")
        .send({
          slotIDs: [availableSlot, anotherAvailSlot, "6aa9d8cf51da0972b69ead8s"],
        })
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(400);
    });

    it("should return 200 if slots have been deleted successfully", async () => {
      const res = await request(app)
        .delete("/doctors/delete-many-slots")
        .send({ slotIDs: [anotherAvailSlot] })
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(200);
    });

    it("should return 400 if one of the slots is booked", async () => {
      const res = await request(app)
        .delete("/doctors/delete-many-slots")
        .send({ slotIDs: [unavailableSlot] })
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(400);
    });
  });

  // --- 7. Appointments Management Endpoints ---
  describe("Doctor Appointments Endpoints", () => {
    it("should return 200 and fetch doctor appointments", async () => {
      const res = await request(app)
        .get("/doctors/appointments/my-appointments")
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(200);
    });

    it("should filter appointments using search query (patient name/email/date)", async () => {
      const res = await request(app)
        .get("/doctors/appointments/my-appointments?search=test")
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(200);
    });

    it("should return 400 if appointment status is invalid when updating", async () => {
      const res = await request(app)
        .patch(`/doctors/appointments/${appointmentID}/status`)
        .send({ status: "testError" })
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(400);
    });

    it("should return 403 if unauthorized doctor tries to update status", async () => {
      const res = await request(app)
        .patch(`/doctors/appointments/${appointmentID}/status`)
        .send({ status: "confirmed" })
        .set("Authorization", doctorAccessToken2);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 if updating an already cancelled/rejected/completed appointment", async () => {
      const updateAppointment = await Appointment.findOneAndUpdate(
        { _id: appointmentID },
        { status: "rejected" },
        { returnDocument: "after" },
      );
      const res = await request(app)
        .patch(`/doctors/appointments/${updateAppointment?._id.toString()}/status`)
        .send({ status: "confirmed" })
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(400);
    });

    it("should return 200 if appointment status is already updated", async () => {
      const updateAppointment = await Appointment.findOneAndUpdate(
        { _id: appointmentID },
        { status: "confirmed" },
        { returnDocument: "after" },
      );

      const res = await request(app)
        .patch(`/doctors/appointments/${updateAppointment?._id.toString()}/status`)
        .send({ status: "confirmed" })
        .set("Authorization", doctorAccessToken1);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("this appointment has already confirmed");
    });

    it("should update isBooked to false if appointment is rejected", async () => {
      const res = await request(app)
        .patch(`/doctors/appointments/${appointmentID}/status`)
        .send({ status: "rejected" })
        .set("Authorization", doctorAccessToken1);

      const updateSlot = await DocSlot.findById(unavailableSlot).lean();
      expect(res.status).toBe(200);
      expect(updateSlot?.isBooked).toBe(false);
    });
  });

  // --- 8. Doctor Profile Endpoints ---
  describe("Doctor Profile Endpoints", () => {
    it("should return 200 if doctor profile exists", async () => {
      const res = await request(app)
        .get(`/doctors/get-profile/${doctorID}`)
        .set("Authorization", accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.userID.first_name).toBe("doctor");
    });

    it("should return 404 if doctor id is missing in params", async () => {
      const res = await request(app)
        .get("/doctors/get-profile")
        .set("Authorization", accessToken);
      expect(res.status).toBe(404);
    });

    it("should return 400 if doctor id is invalid", async () => {
      const res = await request(app)
        .get(`/doctors/get-profile/6aa9d8cf51da0972b69`)
        .set("Authorization", accessToken);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 404 if doctor profile is not found", async () => {
      const res = await request(app)
        .get("/doctors/get-profile/6aa9d8cf51da0972b69ead89")
        .set("Authorization", accessToken);

      expect(res.status).toBe(404);
    });

    it("should return 404 if doctor id is missing when updating profile", async () => {
      const res = await request(app)
        .patch("/doctors/update-profile")
        .set("Authorization", doctorAccessToken1)
        .send({ specialty: "testSpecialty2" });

      expect(res.status).toBe(404);
    });

    it("should return 400 if doctor id is invalid in update params", async () => {
      const res = await request(app)
        .patch("/doctors/update-profile/6aa9d8cf51da0972b9ead")
        .set("Authorization", doctorAccessToken1)
        .send({ specialty: "testSpecialty2" });

      expect(res.status).toBe(400);
    });

    it("should return 403 if a doctor tries to update another doctor's profile", async () => {
      const res = await request(app)
        .patch(`/doctors/update-profile/${doctorID}`)
        .set("Authorization", doctorAccessToken2)
        .send({ specialty: "testSpecialty2" });

      expect(res.status).toBe(403);
    });

    it("should return 400 if a doctor tries to update restricted fields not in validation middleware", async () => {
      const res = await request(app)
        .patch(`/doctors/update-profile/${doctorID}`)
        .set("Authorization", doctorAccessToken1)
        .send({ status: "approved" });

      expect(res.status).toBe(400);
    });

    it("should return 200 if doctor profile is updated successfully", async () => {
      const res = await request(app)
        .patch(`/doctors/update-profile/${doctorID}`)
        .set("Authorization", doctorAccessToken1)
        .send({
          specialty: "testSpecialty3",
          doctorPhone: "1212212110",
          phone: "4554455499",
          email: "testEmaildoc1@gmail.com",
        });

      const [doctorAccount, docUserAccount] = await Promise.all([
        Doctor.findById(doctorID).lean(),
        User.findById(userDocId).lean(),
      ]);

      expect(res.status).toBe(200);
      expect(doctorAccount?.specialty).toBe("testSpecialty3");
      expect(docUserAccount?.phone).toBe("4554455499");
      expect(res.body.data.userID.email).toBe("testEmaildoc1@gmail.com");
    });

    it("should return 400 if a field type is invalid (e.g. string instead of boolean)", async () => {
      const res = await request(app)
        .patch(`/doctors/update-profile/${doctorID}`)
        .set("Authorization", doctorAccessToken1)
        .send({ isAcceptingAppointments: "ladsf" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        '"isAcceptingAppointments" must be a boolean',
      );
    });
  });
});