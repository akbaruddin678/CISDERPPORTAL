import PaymentRecord from "../model/PaymentRecord.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";

// ==========================================
// 1. FETCH RECORDS
// ==========================================
export const getPaymentRecords = async (req, res) => {
  try {
    const records = await PaymentRecord.find()
      .sort({ createdAt: -1 })
      .populate("headOfAccount", "fullName")
      .populate("recordedBy", "fullName")
      .populate("expenses.recordedBy", "fullName");

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. CREATE OPERATIONS
// ==========================================

// Create Internal Budget Allocation
export const createAllocation = async (req, res) => {
  try {
    const { title, allocatedAmount } = req.body;
    let initialProof = null;

    if (req.file) {
      initialProof = await uploadToR2(req.file, "accounts/allocations");
    }

    const newRecord = await PaymentRecord.create({
      recordType: "allocation",
      title,
      allocatedAmount: Number(allocatedAmount),
      initialProof,
      headOfAccount: req.user._id,
      date: new Date(),
    });

    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Log Received Money (Income)
export const addReceivedFund = async (req, res) => {
  try {
    const { title, source, receivedAmount } = req.body;
    let initialProof = null;

    if (req.file) {
      initialProof = await uploadToR2(req.file, "accounts/received");
    }

    const newRecord = await PaymentRecord.create({
      recordType: "received",
      title,
      source,
      allocatedAmount: Number(receivedAmount), // Mapped to allocatedAmount for consistent math
      receivedAmount: Number(receivedAmount),
      initialProof,
      recordedBy: req.user._id,
      date: new Date(),
    });

    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Log Direct / External Expense (Unallocated)
export const addDirectExpense = async (req, res) => {
  try {
    const { description, source, amount } = req.body;

    let proofs = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToR2(file, "accounts/direct-expenses"),
      );
      proofs = await Promise.all(uploadPromises);
    }

    const newRecord = await PaymentRecord.create({
      recordType: "direct",
      description,
      title: description, // Fallback
      source,
      amount: Number(amount),
      proofs,
      recordedBy: req.user._id,
      date: new Date(),
    });

    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Log Sub-Expense against an Allocation or Received Fund
export const addExpense = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { description, amount, date } = req.body;

    let proofs = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToR2(file, "accounts/expenses"),
      );
      proofs = await Promise.all(uploadPromises);
    }

    const record = await PaymentRecord.findById(recordId);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    record.expenses.push({
      description,
      amount: Number(amount),
      date: date || new Date(),
      proofs,
      recordedBy: req.user._id,
    });

    await record.save();
    await record.populate("expenses.recordedBy", "fullName");

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. UPDATE & DELETE OPERATIONS
// ==========================================

export const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedRecord = await PaymentRecord.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!updatedRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    res.status(200).json({ success: true, data: updatedRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRecord = await PaymentRecord.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { recordId, expenseId } = req.params;

    const record = await PaymentRecord.findById(recordId);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    record.expenses = record.expenses.filter(
      (exp) => exp._id.toString() !== expenseId,
    );

    await record.save();
    res
      .status(200)
      .json({ success: true, message: "Expense deleted", data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. PRINT/REPORT GENERATION
// ==========================================

export const getFinancialReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Apply date filters if provided
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      dateFilter = { createdAt: { $gte: startDate, $lt: endDate } };
    }

    const records = await PaymentRecord.find(dateFilter).lean();

    // Aggregate Data
    let totalAllocated = 0;
    let totalReceived = 0;
    let totalDirectExpenses = 0;
    let totalSubExpenses = 0;

    records.forEach((r) => {
      if (r.recordType === "allocation")
        totalAllocated += r.allocatedAmount || 0;
      if (r.recordType === "received")
        totalReceived += r.allocatedAmount || r.receivedAmount || 0;
      if (r.recordType === "direct") totalDirectExpenses += r.amount || 0;

      if (r.expenses && r.expenses.length > 0) {
        totalSubExpenses += r.expenses.reduce(
          (sum, exp) => sum + exp.amount,
          0,
        );
      }
    });

    res.status(200).json({
      success: true,
      data: {
        records,
        summary: {
          totalAllocated,
          totalReceived,
          totalDirectExpenses,
          totalSubExpenses,
          totalFundsAvailable: totalAllocated + totalReceived,
          overallExpenses: totalDirectExpenses + totalSubExpenses,
          remainingBalance: totalAllocated + totalReceived - totalSubExpenses,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
