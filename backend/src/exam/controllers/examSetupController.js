import ExamHall from "../models/ExamHall.js";

export const getExamHalls = async (req, res) => {
  try {
    const halls = await ExamHall.find();
    res.status(200).json({ success: true, data: halls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createExamHall = async (req, res) => {
  try {
    const hall = await ExamHall.create(req.body);
    res.status(201).json({ success: true, data: hall });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
