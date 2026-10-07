import React, { useState } from "react";
import {
  Modal,
  FormField,
  PrimaryBtn,
  SecondaryBtn,
  inputStyle,
} from "../../../common/Hostelshared";

export default function EditAllocationModal({
  allocation,
  onClose,
  onUpdate,
  loading,
  onSuccess,
}) {
  const [rent, setRent] = useState(allocation.monthlyRent || 0);
  const [room, setRoom] = useState(allocation.roomNumber || "");
  const [hostel, setHostel] = useState(allocation.hostelName || "");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rent <= 0) return setError("Monthly rent must be greater than 0");
    if (!room.trim()) return setError("Room number is required");

    setError("");
    try {
      await onUpdate({
        id: allocation._id,
        monthlyRent: Number(rent),
        roomNumber: room.trim().toUpperCase(),
        hostelName: hostel,
      }).unwrap();
      onSuccess();
    } catch (err) {
      setError(err?.data?.message ?? "Failed to update allocation details.");
    }
  };

  return (
    <Modal
      title="Update Allocation & Fee Details"
      onClose={onClose}
      width={450}
    >
      <div
        style={{
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Student Header */}
        <div
          style={{
            padding: "14px",
            background: "#F8FAFC",
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94A3B8",
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            Allocated Student
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
            {allocation.studentId?.personalInfo?.fullName}
          </div>
          <div
            style={{ fontSize: 12, color: "#64748B", fontFamily: "monospace" }}
          >
            {allocation.studentId?.studentId}
          </div>
        </div>

        {/* Edit Fields */}
        <FormField label="Hostel Block Name">
          <input
            value={hostel}
            onChange={(e) => setHostel(e.target.value)}
            style={inputStyle}
            placeholder="e.g., Boys Hostel A"
          />
        </FormField>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <FormField label="Room Number" required>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              style={inputStyle}
              placeholder="e.g., 204"
            />
          </FormField>
          <FormField label="Monthly Rent (PKR)" required>
            <input
              type="number"
              min="0"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              style={inputStyle}
            />
          </FormField>
        </div>

        <p
          style={{
            fontSize: 12,
            color: "#64748B",
            fontStyle: "italic",
            background: "#F1F5F9",
            padding: "10px",
            borderRadius: 8,
          }}
        >
          <strong>Note:</strong> Updating the monthly rent will affect all
          future bulk challans generated for this student. It will not alter
          previously generated challans.
        </p>

        {error && (
          <div
            style={{
              color: "#E11D48",
              fontSize: 13,
              background: "#FFF1F2",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #FECDD3",
            }}
          >
            ⚠ {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            paddingTop: 14,
            borderTop: "1px solid #F1F5F9",
            marginTop: 4,
          }}
        >
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
          <PrimaryBtn onClick={handleSubmit} loading={loading}>
            Save Updates
          </PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}
