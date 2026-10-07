// utils/mongo.js
import mongoose from 'mongoose';

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const toObjectId = (id) =>
  isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null;
