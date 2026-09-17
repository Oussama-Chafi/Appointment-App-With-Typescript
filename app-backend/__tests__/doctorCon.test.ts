import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/server";
import User from "../src/models/userSchema";
import Appointment from "../src/models/appointmentSchema";
import DocSlot from "../src/models/slotSchema";
import { Doctor } from "../src/models/doctorSchema";

describe("Doctor API Intagration Tests", () => {
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
  let userDocId2: string | undefined;
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

    // make sure you cancelled rate limit of Authentification in the server file

    const user = await request(app).post("/auth/register").send({
      first_name: "user",
      last_name: "test",
      email: "userTest@gmail.com",
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
        date: "2026-09-16",
        startTime: "11:00",
        endTime: "12:00",
        price: 50,
        isBooked: true,
      }),
      DocSlot.create({
        doctorID: addDoctor1._id,
        date: "2026-09-14",
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
    userDocId2 = updateRole2?._id.toString();
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return 200 if introduction was successfully", async () => {
    const res = await request(app)
      .post("/doctors/app-as-doctor")
      .send({
        consultationFee: 50,
        specialty: "testSpecialty",
        address: "testAddress",
        //   phone number should be with numbers
        phone: "1234561230",
      })
      .set("Authorization", accessToken);

    // console.log("res.body", res.body);
    expect(res.status).toBe(201);
    expect(res.body.data?.status).toBe("pending");
  });

  it("should return 400 if this user already send a request", async () => {
    const res = await request(app)
      .post("/doctors/app-as-doctor")
      .send({
        consultationFee: 50,
        specialty: "testSpecialty",
        address: "testAddress",
        phone: "1234561230",
      })
      .set("Authorization", accessToken);

    // console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 400 if just one feld is not correct or is missing ", async () => {
    const res = await request(app)
      .post("/doctors/app-as-doctor")
      .send({
        consultationFee: 50,
        specialty: "testSpecialty",
        address: "testAddress",
        // phone number should be equal 10
        phone: "06121423541",
      })
      .set("Authorization", accessToken);

    // console.log("res body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 200 if slots has been created successfully", async () => {
    const res = await request(app)
      .post("/doctors/add-slots")
      .send({
        date: "2026-09-16",
        startTime: "09:00",
        endTime: "14:00",
        price: 50,
        excludedSlots: ["12:00"],
      })
      .set("Authorization", doctorAccessToken1);

    // console.log("res.body", res.body);
    expect(res.status).toBe(201);
  });

  it("should return 400 if date in the past and also if start higher than end time", async () => {
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

    // console.log(res.body);
    expect(res.status).toBe(400);
  });

  it("should return 200 if featching was successfully and also with search query", async () => {
    const res = await request(app)
      .get("/doctors/all-doctors?search=userDoc1@gmail.com")
      .set("Authorization", accessToken);

    // console.log("res.body", res.body);
    expect(res.status).toBe(200);
  });

  it("should return empty data if no doctor with search query exist", async () => {
    const res = await request(app)
      .get("/doctors/all-doctors?search=doctortest@gmail.com")
      .set("Authorization", accessToken);

    // console.log("res.body", res.body);
    expect(res.status).toBe(200);
    expect((res.body.data = 0));
  });

  it("should return 400 if doctor id is not valid", async () => {
    const res = await request(app)
      .get("/doctors/available-slots/ea")
      .set("Authorization", accessToken);

    // console.log("res.body" , res.body);
    expect(res.status).toBe(400);
  });

  it("should return 200 if doctor id is correct and even if he has no slots", async () => {
    const res = await request(app)
      .get(`/doctors/available-slots/${doctorID}`)
      .set("Authorization", accessToken);

    // console.log("res.body", res.body);
    expect(res.status).toBe(200);
  });

  it("should return slots that's just in search query and available and also not in the past", async () => {
    const res = await request(app)
      .get(`/doctors/available-slots/${doctorID}?search=2026-09-14`)
      .set("Authorization", accessToken);

    // console.log("res.body" , res.body);
    expect(res.status).toBe(200);
  });

  it("should return 404 if doctor profile not found", async () => {
    const res = await request(app)
      .get("/doctors/available-slots/6aa9d8cf51da0972b69ead89")
      .set("Authorization", accessToken);

    // console.log("res.body" , res.body)
    expect(res.status).toBe(404);
  });

  it("should return 403 if a user try to get protected route ", async () => {
    const res = await request(app)
      .delete(`/doctors/delete-slot/${availableSlot}`)
      .set("Authorization", accessToken);

    // console.log("res.body" , res.body);
    expect(res.status).toBe(403);
  });

  it("should return 400 if slot id is not in params or is not valid", async () => {
    const res = await request(app)
      .delete("/doctors/delete-slot/6aa9d8cf51da0972b69ead8j")
      .set("Authorization", doctorAccessToken1);

    // console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 400 if a slot has been booked", async () => {
    const res = await request(app)
      .delete(`/doctors/delete-slot/${unavailableSlot}`)
      .set("Authorization", doctorAccessToken1);

    // console.log(res.body, "res.body");
    expect(res.status).toBe(400);
  });

  it("should return 403 if one doctor try to delete another doctor's slot", async () => {
    const res = await request(app)
      .delete(`/doctors/delete-slot/${availableSlot}`)
      .set("Authorization", doctorAccessToken2);

    // console.log("res.body", res.body);
    expect(res.status).toBe(403);
    expect(res.body.message === "You cannot delete another doctor's slots!");
  });

  it("should return 204 if slot has been deleted successfully", async () => {
    const res = await request(app)
      .delete(`/doctors/delete-slot/${availableSlot}`)
      .set("Authorization", doctorAccessToken1);

    expect(res.status).toBe(204);
  });

  it("should return 404 if slot is not exist", async () => {
    const res = await request(app)
      .delete("/doctors/delete-slot/6aa9d8cf51da0972b69ead89")
      .set("Authorization", doctorAccessToken1);

    // console.log("res.body", res.body);
    expect(res.status).toBe(404);
  });

  it("should return 400 if req is not an array or if it's equal 0", async () => {
    const res = await request(app)
      .delete("/doctors/delete-many-slots")
      .send({ slotIDs: `${availableSlot} , ${anotherAvailSlot}` })
      .set("Authorization", doctorAccessToken1);

    // console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 400 if a doctor try to delete another doctor's slot", async () => {
    const res = await request(app)
      .delete("/doctors/delete-many-slots")
      .send({ slotIDs: [availableSlot, anotherAvailSlot] })
      .set("Authorization", doctorAccessToken2);

    // console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 400 if one slot id is invalid", async () => {
    const res = await request(app)
      .delete("/doctors/delete-many-slots")
      .send({
        slotIDs: [availableSlot, anotherAvailSlot, "6aa9d8cf51da0972b69ead8s"],
      })
      .set("Authorization", doctorAccessToken1);

    // console.log("res.body:", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 200 if slots has deleted successfully", async () => {
    const res = await request(app)
      .delete("/doctors/delete-many-slots")
      .send({ slotIDs: [availableSlot, anotherAvailSlot] })
      .set("Authorization", doctorAccessToken1);

    // console.log("res.body", res.body);
    expect(res.status).toBe(200);
  });

  it("should return 400 is one slot is booked", async () => {
    const res = await request(app)
      .delete("/doctors/delete-many-slots")
      .send({ slotIDs: [unavailableSlot] })
      .set("Authorization", doctorAccessToken1);

    // console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 200 if an appointment exist for this doctor", async () => {
    const res = await request(app)
      .get("/doctors/appointments/my-appointments")
      .set("Authorization", doctorAccessToken1);

    // console.log("res.body", res.body);
    expect(res.status).toBe(200);
  });

  it("should return the appointment that exist with patient name or email or the date using search query", async () => {
    const res = await request(app)
      .get("/doctors/appointments/my-appointments?search=test")
      .set("Authorization", doctorAccessToken1);

    // console.log("res.body", res.body);
    expect(res.status).toBe(200);
    expect(res.body.results === 1);
  });

  it("should return 400 if status is not confirmed or rejected or completed ", async () => {
    const res = await request(app)
      .patch(`/doctors/appointments/${appointmentID}/status`)
      .send({ status: "testError" })
      .set("Authorization", doctorAccessToken1);

    // console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 403 if doctor id is not valid", async () => {
    const res = await request(app)
      .patch(`/doctors/appointments/${appointmentID}/status`)
      .send({ status: "confirmed" })
      .set("Authorization", doctorAccessToken2);

    // console.log("res.body", res.body);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if this appointment has been already cancelled or rejected or completed", async () => {
    const updateAppointment = await Appointment.findOneAndUpdate(
      { _id: appointmentID },
      { status: "rejected" },
      { returnDocument: "after" },
    );
    const res = await request(app)
      .patch(
        `/doctors/appointments/${updateAppointment?._id.toString()}/status`,
      )
      .send({ status: "confirmed" })
      .set("Authorization", doctorAccessToken1);

    // console.log("res.body:", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 200 if this appointment's stauts already has updated", async () => {
    const updateAppointment = await Appointment.findOneAndUpdate(
      { _id: appointmentID },
      { status: "confirmed" },
      { returnDocument: "after" },
    );
    // console.log("updateStatus:" , updateAppointment?.status)

    const res = await request(app)
      .patch(
        `/doctors/appointments/${updateAppointment?._id.toString()}/status`,
      )
      .send({ status: "confirmed" })
      .set("Authorization", doctorAccessToken1);
    // console.log("res.body:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("this appointment has already confirmed");
  });

  it("should update isBooked to false if the appointment has benn rejected", async () => {
    const res = await request(app)
      .patch(`/doctors/appointments/${appointmentID}/status`)
      .send({ status: "rejected" })
      .set("Authorization", doctorAccessToken1);
    // console.log("res.body:" , res.body);

    const updateSlot = await DocSlot.findById(unavailableSlot).lean();
    // console.log("updateSlot" , updateSlot)
    expect(res.status).toBe(200);
    expect(updateSlot?.isBooked).toBe(false);
  });

  it("should return 200 if doctor profile exist", async () => {
    const res = await request(app)
      .get(`/doctors/get-profile/${doctorID}`)
      .set("Authorization", accessToken);

    // console.log("res.body", res.body);
    expect(res.status).toBe(200);
    expect(res.body.data.userID.first_name).toBe("doctor");
  });

  it("should return 404 if doctor id is missing in params ", async () => {
    const res = await request(app)
      .get("/doctors/get-profile")
      .set("Authorization", accessToken);
    expect(res.status).toBe(404);
  });

  it("should return 400 if doctor id is missing in params or invalid id", async () => {
    const res = await request(app)
      .get(`/doctors/get-profile/${"6aa9d8cf51da0972b69"}`)
      .set("Authorization", accessToken);

    // console.log("res.body", res.body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 404 if doctor profile not found ", async () => {
    const res = await request(app)
      .get("/doctors/get-profile/6aa9d8cf51da0972b69ead89")
      .set("Authorization", accessToken);

    // console.log("res.body", res.body);
    expect(res.status).toBe(404);
  });

  it("should return 404 if doctor id is missing in params", async () => {
    const res = await request(app)
      .patch("/doctors/update-profile")
      .set("Authorization", doctorAccessToken1)
      .send({ specialty: "testSpecialty2" });

    expect(res.status).toBe(404);
  });

  it("should return 400 is doctor id in invalid in params", async () => {
    const res = await request(app)
      .patch("/doctors/update-profile/6aa9d8cf51da0972b9ead")
      .set("Authorization", doctorAccessToken1)
      .send({ specialty: "testSpecialty2" });

    // console.log("res.body", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 403 if doctor try to update someone doctor's profile", async () => {
    const res = await request(app)
      .patch(`/doctors/update-profile/${doctorID}`)
      .set("Authorization", doctorAccessToken2)
      .send({ specialty: "testSpecialty2" });

    // console.log("res.body", res.body);
    expect(res.status).toBe(403);
  });

  it("should return 400 if doctor try to update one feld that's not in validation middleware", async () => {
    const res = await request(app)
      .patch(`/doctors/update-profile/${doctorID}`)
      .set("Authorization", doctorAccessToken1)
      .send({ status: "approved" });

    // console.log("res.body from vali middleware", res.body);
    expect(res.status).toBe(400);
  });

  it("should return 200 if updating was successfully", async () => {
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

    // console.log("res.body", res.body);
    expect(res.status).toBe(200);
    expect(doctorAccount?.specialty).toBe("testSpecialty3");
    expect(docUserAccount?.phone).toBe("4554455499");
    expect(res.body.data.userID.email).toBe("testEmaildoc1@gmail.com");
  });

  it("should return 400 if one feld is not accepted ", async () => {
    const res = await request(app)
      .patch(`/doctors/update-profile/${doctorID}`)
      .set("Authorization", doctorAccessToken1)
      .send({ isAcceptingAppointments: "ladsf" });

    // console.log("res.body", res.body);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      '"isAcceptingAppointments" must be a boolean',
    );
  });
});
