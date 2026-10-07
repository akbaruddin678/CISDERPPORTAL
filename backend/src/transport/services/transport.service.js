import TransportRoute from "../models/TransportRoute.js";
import TransportAllocation from "../models/TransportAllocation.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import StudentChallan from "../../accountant/model/StudentChallan.js";
import { AppError } from "../../accountant/middleware/errorHandler.js";
import TransportVehicle from "../models/TransportVehicle.js";
import TransportDriver from "../models/TransportDriver.js";

import mongoose from "mongoose";


export class TransportService {
  // --- SETUP: VEHICLE, DRIVER, ROUTE ---
  static async createVehicle(data) {
    return await TransportVehicle.create(data);
  }
  static async getVehicles() {
    return await TransportVehicle.find({ status: "Active" });
  }

  static async createDriver(data) {
    return await TransportDriver.create(data);
  }
  static async getDrivers() {
    return await TransportDriver.find({ status: "Active" });
  }

  static async createRoute(data) {
    // Ensure vehicle/driver not already assigned? (Optional logic)
    return await TransportRoute.create(data);
  }

  static async getRoutes() {
    return await TransportRoute.find({ status: "Active" })
      .populate("vehicleId", "registrationNumber capacity")
      .populate("driverId", "fullName contactNumber");
  }

  // --- CORE: STUDENT ALLOCATION ---
  static async allocateTransport(data) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { studentId, routeId, stopName, admissionDate, targetMonth } = data;

      // 1. Validate Student
      const student = await StudentProfile.findById(studentId).session(session);
      if (!student) throw new AppError("Student not found", 404);

      // 2. Validate Route & Capacity
      const route = await TransportRoute.findById(routeId)
        .populate("vehicleId")
        .session(session);
      if (!route) throw new AppError("Route not found", 404);

      const currentLoad = await TransportAllocation.countDocuments({
        routeId,
        status: "ALLOCATED",
      }).session(session);
      if (route.vehicleId && currentLoad >= route.vehicleId.capacity) {
        throw new AppError("Bus capacity full!", 400);
      }

      // 3. GET FEE FROM STOP (Crucial Step)
      const selectedStop = route.stops.find((s) => s.stopName === stopName);
      if (!selectedStop) throw new AppError("Invalid Stop selected", 400);
      const monthlyFare = selectedStop.monthlyFare; // Automatic Fee

      // 4. Check Existing
      const existing = await TransportAllocation.findOne({
        studentId,
        status: "ALLOCATED",
      }).session(session);
      if (existing) throw new AppError("Student already assigned", 400);

      // 5. Create Allocation
      const allocation = await TransportAllocation.create(
        [
          {
            studentId,
            routeId,
            stopName,
            agreedMonthlyFare: monthlyFare,
            allocationDate: admissionDate || new Date(),
            status: "ALLOCATED",
          },
        ],
        { session }
      );

      // 6. Generate First Challan (Registration + Month)
      // Check if registration fee previously paid? Assuming simplified flow based on prompt:
      // Just charge the Monthly Fare of the stop.

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 10);

      await StudentChallan.create(
        [
          {
            studentId,
            programId: student.programId,
            departmentId: student.departmentId,
            termId: student.termId,
            challanNo: `TRP-${Date.now()}`,
            dueDate,
            issueDate: new Date(),
            challanType: "transport_monthly",
            feeDetails: { transportMonthlyFare: monthlyFare },
            remarks: `Transport: ${route.routeName} - ${stopName} (${targetMonth})`,
            originalTotal: monthlyFare,
            netAmount: monthlyFare,
            remainingAmount: monthlyFare,
            status: "issued",
            isDeleted: false,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return allocation[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // --- BULK CHALLAN ---
  static async generateBulkChallan(data) {
    const { studentIds, month } = data;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const studentId of studentIds) {
        const allocation = await TransportAllocation.findOne({
          studentId,
          status: "ALLOCATED",
        }).session(session);
        if (!allocation) continue;

        // Prevent Duplicate for Month
        const exists = await StudentChallan.findOne({
          studentId,
          challanType: "transport_monthly",
          remarks: { $regex: month, $options: "i" },
        }).session(session);
        if (exists) continue;

        const student = await StudentProfile.findById(studentId).session(
          session
        );

        await StudentChallan.create(
          [
            {
              studentId,
              programId: student.programId,
              departmentId: student.departmentId,
              termId: student.termId,
              challanNo: `TRP-${Date.now()}-${Math.floor(
                Math.random() * 1000
              )}`,
              dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
              issueDate: new Date(),
              challanType: "transport_monthly",
              feeDetails: {
                transportMonthlyFare: allocation.agreedMonthlyFare,
              },
              remarks: `Transport Fee for ${month}`,
              originalTotal: allocation.agreedMonthlyFare,
              netAmount: allocation.agreedMonthlyFare,
              remainingAmount: allocation.agreedMonthlyFare,
              status: "issued",
              isDeleted: false,
            },
          ],
          { session }
        );
      }
      await session.commitTransaction();
      return { message: "Generated" };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // --- GETTERS ---
  static async getAllocations() {
    return await TransportAllocation.find({ status: "ALLOCATED" })
      .populate({
        path: "studentId",
        select: "studentId",
        populate: { path: "personalInfo", select: "fullName" },
      })
      .populate("routeId", "routeName")
      .sort({ createdAt: -1 });
  }

  static async getChallans() {
    return await StudentChallan.find({
      challanType: { $regex: "transport", $options: "i" },
      isDeleted: false,
    })
      .populate({
        path: "studentId",
        select: "studentId",
        populate: { path: "personalInfo", select: "fullName" },
      })
      .sort({ issueDate: -1 });
  }

  static async getStats() {
    const active = await TransportAllocation.countDocuments({
      status: "ALLOCATED",
    });
    const vehicles = await TransportVehicle.countDocuments({
      status: "Active",
    });
    const routes = await TransportRoute.countDocuments({ status: "Active" });

    // Revenue Stats
    const financial = await StudentChallan.aggregate([
      {
        $match: {
          challanType: { $regex: "transport", $options: "i" },
          isDeleted: false,
        },
      },
      { $group: { _id: "$status", total: { $sum: "$netAmount" } } },
    ]);

    let collected = 0,
      pending = 0;
    financial.forEach((f) => {
      if (f._id === "paid") collected = f.total;
      else pending += f.total;
    });

    return {
      activeStudents: active,
      totalVehicles: vehicles,
      totalRoutes: routes,
      collected,
      pending,
    };
  }

  static async vacateTransport(id) {
    return await TransportAllocation.findByIdAndUpdate(id, {
      status: "VACATED",
      vacatedDate: new Date(),
    });
  }
}