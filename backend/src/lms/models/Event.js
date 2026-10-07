import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    time: { type: Date, required: true }, // The actual date and time of the event
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Event", eventSchema);
