import React from "react";

const ProfilePDFTemplate = React.forwardRef(
  ({ userData, admissionData, challanData, safeImages }, ref) => {
    /* ================= HELPERS ================= */
    const formatDate = (date) =>
      date
        ? new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "N/A";

    const formatEducationPeriod = (s, e) =>
      s && e
        ? `${new Date(s).getFullYear()} - ${new Date(e).getFullYear()}`
        : "N/A";

    /* ================= SHARED STYLES ================= */
    const styles = {
      pageContainer: {
        width: "210mm",
        minHeight: "297mm",
        backgroundColor: "#ffffff",
        fontFamily: "'Helvetica', 'Arial', sans-serif",
        color: "#111827",
        position: "relative",
      },

      headerSection: {
        backgroundColor: "#1a237e",
        color: "#ffffff",
        padding: "20mm 15mm 12mm",
        position: "relative",
        borderBottom: "4px solid #ff9800",
      },

      universityName: {
        fontSize: "28px",
        fontWeight: "bold",
        letterSpacing: "0.5px",
        marginBottom: "4px",
        textTransform: "uppercase",
      },

      documentTitle: {
        fontSize: "16px",
        fontWeight: "500",
        opacity: "0.9",
        marginBottom: "8px",
      },

      statusBadge: {
        position: "absolute",
        top: "15mm",
        right: "15mm",
        backgroundColor: "#4caf50",
        color: "#ffffff",
        padding: "6px 20px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "bold",
        textTransform: "uppercase",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      },

      contentSection: {
        padding: "0 15mm",
      },

      sectionHeader: {
        fontSize: "16px",
        fontWeight: "bold",
        color: "#1a237e",
        padding: "8px 0",
        margin: "15mm 0 8mm",
        borderBottom: "2px solid #1a237e",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      },

      subSectionHeader: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#37474f",
        margin: "10mm 0 6mm",
        paddingBottom: "4px",
        borderBottom: "1px solid #cfd8dc",
      },

      infoGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "6mm 12mm",
        marginBottom: "8mm",
      },

      infoItem: {
        marginBottom: "5mm",
      },

      infoLabel: {
        fontSize: "11px",
        color: "#546e7a",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "0.3px",
        marginBottom: "2px",
      },

      infoValue: {
        fontSize: "13px",
        fontWeight: "bold",
        color: "#000000",
        minHeight: "16px",
      },

      tableHeader: {
        backgroundColor: "#f5f5f5",
        border: "1px solid #b0bec5",
        padding: "10px 8px",
        fontSize: "11px",
        fontWeight: "bold",
        color: "#263238",
        textAlign: "left",
      },

      tableCell: {
        border: "1px solid #e0e0e0",
        padding: "10px 8px",
        fontSize: "11px",
        color: "#37474f",
        verticalAlign: "top",
      },

      photoContainer: {
        width: "120px",
        height: "150px",
        border: "2px solid #b0bec5",
        borderRadius: "4px",
        overflow: "hidden",
        backgroundColor: "#fafafa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 8mm",
      },

      signatureArea: {
        borderTop: "1px solid #000",
        width: "180px",
        marginTop: "30px",
        paddingTop: "4px",
      },

      footer: {
        position: "absolute",
        bottom: "0",
        left: "0",
        right: "0",
        backgroundColor: "#f5f5f5",
        borderTop: "1px solid #e0e0e0",
        padding: "8px 15mm",
        fontSize: "9px",
        color: "#757575",
        textAlign: "center",
      },

      pageNumber: {
        position: "absolute",
        bottom: "10mm",
        right: "15mm",
        fontSize: "10px",
        color: "#9e9e9e",
      },
    };

    /* ================= PAGE 1 ================= */
    const Page1 = () => (
      <div style={{ ...styles.pageContainer, paddingBottom: "25mm" }}>
        {/* HEADER */}
        <div style={styles.headerSection}>
          <div style={styles.universityName}>CISD</div>
          <div style={styles.documentTitle}>OFFICIAL ADMISSION APPLICATION</div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              marginTop: "15mm",
              paddingTop: "6mm",
              borderTop: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <div>
              <div style={{ marginBottom: "2px" }}>
                <strong>Application ID:</strong>{" "}
                {admissionData?._id?.slice(-8) || "N/A"}
              </div>
              <div>
                <strong>Date Generated:</strong> {formatDate(new Date())}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: "2px" }}>
                <strong>Session:</strong>{" "}
                {admissionData?.applyingSession || "N/A"}
              </div>
              <div>
                <strong>Class:</strong>{" "}
                {admissionData?.academicDepartment || "N/A"}
              </div>
            </div>
          </div>

          <div
            style={{
              ...styles.statusBadge,
              backgroundColor:
                admissionData?.status === "approved"
                  ? "#4caf50"
                  : admissionData?.status === "rejected"
                  ? "#f44336"
                  : admissionData?.status === "pending"
                  ? "#ff9800"
                  : "#9e9e9e",
            }}
          >
            {admissionData?.status?.toUpperCase() || "PENDING"}
          </div>
        </div>

        {/* CONTENT */}
        <div style={styles.contentSection}>
          {/* SECTION HEADER */}
          <div>Personal Information</div>

          {/* PHOTO AND BASIC INFO */}
          <div style={{ display: "flex", gap: "15mm", marginBottom: "12mm" }}>
            {/* PHOTO */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ ...styles.photoContainer, margin: 0 }}>
                {safeImages?.photo ? (
                  <img
                    src={safeImages.photo}
                    alt="Applicant Photo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div
                    style={{
                      color: "#9e9e9e",
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                      👤
                    </div>
                    PHOTO NOT AVAILABLE
                  </div>
                )}
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontSize: "10px",
                  color: "#757575",
                  marginTop: "4px",
                }}
              >
                Student Photograph
              </div>
            </div>

            {/* PERSONAL DETAILS */}
            <div style={{ flex: 1 }}>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Full Name</div>
                  <div style={styles.infoValue}>
                    {admissionData?.fullName || "N/A"}
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>CNIC / B-Form</div>
                  <div style={styles.infoValue}>
                    {admissionData?.cnic || "N/A"}
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Father's Name</div>
                  <div style={styles.infoValue}>
                    {admissionData?.fatherName || "N/A"}
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Date of Birth</div>
                  <div style={styles.infoValue}>
                    {formatDate(admissionData?.dob)}
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Gender</div>
                  <div style={styles.infoValue}>
                    {admissionData?.gender || "N/A"}
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Nationality</div>
                  <div style={styles.infoValue}>
                    {admissionData?.nationality || "N/A"}
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Email Address</div>
                  <div style={styles.infoValue}>{userData?.email || "N/A"}</div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Phone Number</div>
                  <div style={styles.infoValue}>
                    {admissionData?.phone || "N/A"}
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Father's Occupation</div>
                  <div style={styles.infoValue}>
                    {admissionData?.fatherOccupation || "N/A"}
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Father's CNIC</div>
                  <div style={styles.infoValue}>
                    {admissionData?.fatherCnic || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ADDRESS INFORMATION */}
          <div style={styles.subSectionHeader}>Address Details</div>

          <div
            style={{
              backgroundColor: "#f8f9fa",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              padding: "10mm",
              marginBottom: "12mm",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8mm",
              }}
            >
              <div>
                <div style={styles.infoLabel}>Permanent Address</div>
                <div style={{ ...styles.infoValue, fontSize: "12px" }}>
                  {admissionData?.currentAddress || "N/A"}
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6mm",
                  }}
                >
                  <div>
                    <div style={styles.infoLabel}>District</div>
                    <div style={styles.infoValue}>
                      {admissionData?.currentDistrict || "N/A"}
                    </div>
                  </div>

                  <div>
                    <div style={styles.infoLabel}>Province</div>
                    <div style={styles.infoValue}>
                      {admissionData?.currentProvince || "N/A"}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "6mm" }}>
                  <div style={styles.infoLabel}>Guardian Phone</div>
                  <div style={styles.infoValue}>
                    {admissionData?.guardianPhone || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACADEMIC PROGRAM */}
          <div style={styles.subSectionHeader}>Program Information</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8mm",
              marginBottom: "15mm",
            }}
          >
            <div
              style={{
                backgroundColor: "#e3f2fd",
                border: "1px solid #bbdefb",
                borderRadius: "6px",
                padding: "8mm 6mm",
                textAlign: "center",
              }}
            >
              <div style={{ ...styles.infoLabel, fontSize: "10px" }}>
                Program Applied
              </div>
              <div
                style={{
                  ...styles.infoValue,
                  fontSize: "14px",
                  color: "#1565c0",
                  marginTop: "4px",
                }}
              >
                {admissionData?.applyingForProgram || "N/A"}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#f3e5f5",
                border: "1px solid #e1bee7",
                borderRadius: "6px",
                padding: "8mm 6mm",
                textAlign: "center",
              }}
            >
              <div style={{ ...styles.infoLabel, fontSize: "10px" }}>
                Academic Class
              </div>
              <div
                style={{
                  ...styles.infoValue,
                  fontSize: "14px",
                  color: "#7b1fa2",
                  marginTop: "4px",
                }}
              >
                {admissionData?.academicDepartment || "N/A"}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#e8f5e8",
                border: "1px solid #c8e6c9",
                borderRadius: "6px",
                padding: "8mm 6mm",
                textAlign: "center",
              }}
            >
              <div style={{ ...styles.infoLabel, fontSize: "10px" }}>
                Application Date
              </div>
              <div
                style={{
                  ...styles.infoValue,
                  fontSize: "14px",
                  color: "#2e7d32",
                  marginTop: "4px",
                }}
              >
                {formatDate(admissionData?.createdAt)}
              </div>
            </div>
          </div>

          {/* PAGE FOOTER */}
          <div style={styles.footer}>
            CONFIDENTIAL DOCUMENT • CISD • PAGE 1 OF 2
          </div>

          <div style={styles.pageNumber}>Page 1</div>
        </div>
      </div>
    );

    /* ================= PAGE 2 ================= */
    const Page2 = () => (
      <div style={{ ...styles.pageContainer, paddingBottom: "25mm" }}>
        {/* HEADER */}
        <div
          style={{
            ...styles.headerSection,
            backgroundColor: "#1565c0",
            padding: "12mm 15mm 8mm",
          }}
        >
          <div style={styles.universityName}>Academic Records</div>
          <div style={styles.documentTitle}>EDUCATIONAL QUALIFICATIONS</div>
        </div>

        {/* CONTENT */}
        <div style={styles.contentSection}>
          {/* SECTION HEADER */}
          <div style={styles.sectionHeader}>Educational Background</div>

          {/* EDUCATION TABLE */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "15mm",
            }}
          >
            <thead>
              <tr>
                <th style={styles.tableHeader}>Degree / Certificate</th>
                <th style={styles.tableHeader}>Institution / Board</th>
                <th style={styles.tableHeader}>Academic Period</th>
                <th style={styles.tableHeader}>Marks (Obtained/Total)</th>
                <th style={styles.tableHeader}>Percentage (%)</th>
              </tr>
            </thead>
            <tbody>
              {admissionData?.educationDetails?.length ? (
                admissionData.educationDetails.map((edu, index) => (
                  <tr key={index}>
                    <td style={styles.tableCell}>
                      <div style={{ fontWeight: "bold", fontSize: "12px" }}>
                        {edu.educationProgram || "N/A"}
                      </div>
                    </td>
                    <td style={styles.tableCell}>{edu.institution || "N/A"}</td>
                    <td style={styles.tableCell}>
                      {formatEducationPeriod(edu.startDate, edu.endDate)}
                    </td>
                    <td style={styles.tableCell}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ fontWeight: "bold", color: "#1a237e" }}>
                          {edu.obtainedMarks || "0"}
                        </span>
                        <span style={{ margin: "0 4px", color: "#9e9e9e" }}>
                          /
                        </span>
                        <span>{edu.totalMarks || "0"}</span>
                      </div>
                    </td>
                    <td
                      style={{
                        ...styles.tableCell,
                        fontWeight: "bold",
                        color:
                          edu.percentage >= 60
                            ? "#2e7d32"
                            : edu.percentage >= 50
                            ? "#ff9800"
                            : "#d32f2f",
                      }}
                    >
                      {edu.percentage || "0"}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      ...styles.tableCell,
                      textAlign: "center",
                      padding: "20px",
                      color: "#9e9e9e",
                    }}
                  >
                    No educational records available
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* FEE CHALLAN STATUS */}
          <div
            style={{
              ...styles.sectionHeader,
              marginTop: "20mm",
              marginBottom: "8mm",
            }}
          >
            Fee Payment Status
          </div>

          {challanData ? (
            <div
              style={{
                backgroundColor: "#f1f8e9",
                border: "1px solid #c5e1a5",
                borderRadius: "8px",
                padding: "12mm",
                marginBottom: "15mm",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10mm",
                  marginBottom: "8mm",
                }}
              >
                <div>
                  <div style={styles.infoLabel}>Challan Number</div>
                  <div
                    style={{
                      ...styles.infoValue,
                      fontSize: "16px",
                      color: "#1b5e20",
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    #{challanData.challanNo}
                  </div>
                </div>

                <div>
                  <div style={styles.infoLabel}>Challan Type</div>
                  <div
                    style={{
                      ...styles.infoValue,
                      fontSize: "14px",
                      color: "#1b5e20",
                    }}
                  >
                    {challanData.type || "Tuition Fee"}
                  </div>
                </div>

                <div>
                  <div style={styles.infoLabel}>Due Date</div>
                  <div
                    style={{
                      ...styles.infoValue,
                      fontSize: "14px",
                      color: "#1b5e20",
                    }}
                  >
                    {formatDate(challanData.dueDate)}
                  </div>
                </div>

                <div>
                  <div style={styles.infoLabel}>Status</div>
                  <div
                    style={{
                      ...styles.infoValue,
                      fontSize: "12px",
                      fontWeight: "bold",
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      backgroundColor:
                        challanData.status === "paid"
                          ? "#c8e6c9"
                          : challanData.status === "pending"
                          ? "#fff9c4"
                          : "#ffcdd2",
                      color:
                        challanData.status === "paid"
                          ? "#2e7d32"
                          : challanData.status === "pending"
                          ? "#ff8f00"
                          : "#c62828",
                    }}
                  >
                    {challanData.status?.toUpperCase() || "UNKNOWN"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderTop: "2px dashed #a5d6a7",
                  paddingTop: "8mm",
                  marginTop: "8mm",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={styles.infoLabel}>Account Number</div>
                    <div
                      style={{
                        ...styles.infoValue,
                        fontSize: "13px",
                        fontFamily: "'Courier New', monospace",
                        color: "#37474f",
                      }}
                    >
                      {challanData.accountNumber || "Not specified"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        ...styles.infoLabel,
                        fontSize: "12px",
                        textTransform: "uppercase",
                      }}
                    >
                      Total Amount
                    </div>
                    <div
                      style={{
                        ...styles.infoValue,
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#1b5e20",
                      }}
                    >
                      Rs. {challanData.amount?.toLocaleString() || "0"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#f5f5f5",
                border: "2px dashed #e0e0e0",
                borderRadius: "8px",
                padding: "15mm",
                textAlign: "center",
                marginBottom: "15mm",
                color: "#9e9e9e",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>💰</div>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                No Fee Challans
              </div>
              <div style={{ fontSize: "12px", marginTop: "4px" }}>
                No fee challan has been generated for this application
              </div>
            </div>
          )}

          {/* DECLARATION AND SIGNATURES */}
          <div style={styles.sectionHeader}>Declaration & Signatures</div>

          <div
            style={{
              backgroundColor: "#fff8e1",
              border: "1px solid #ffe082",
              borderRadius: "6px",
              padding: "10mm",
              marginBottom: "15mm",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                lineHeight: "1.6",
                textAlign: "justify",
              }}
            >
              <strong>DECLARATION:</strong> I hereby certify that all
              information provided in this admission application is true,
              complete, and accurate to the best of my knowledge. I understand
              that any false statement or omission may lead to disqualification
              or cancellation of admission at any stage. I agree to abide by all
              rules, regulations, and policies of the National Excellence
              Institute.
            </div>
          </div>

          {/* SIGNATURES */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20mm",
            }}
          >
            <div style={{ width: "45%", textAlign: "center" }}>
              <div style={styles.signatureArea}></div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                Applicant's Signature
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#757575",
                  marginTop: "4px",
                }}
              >
                {admissionData?.fullName || "N/A"}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#bdbdbd",
                  marginTop: "2px",
                }}
              >
                Date: {formatDate(admissionData?.createdAt)}
              </div>
            </div>

            <div style={{ width: "45%", textAlign: "center" }}>
              <div style={styles.signatureArea}></div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                Admission Officer
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#757575",
                  marginTop: "4px",
                }}
              >
                CISD
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#bdbdbd",
                  marginTop: "2px",
                }}
              >
                Date: {formatDate(new Date())}
              </div>
            </div>
          </div>

          {/* FINAL NOTES */}
          <div
            style={{
              borderTop: "2px solid #e0e0e0",
              paddingTop: "8mm",
              fontSize: "10px",
              color: "#757575",
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
              THIS IS A COMPUTER-GENERATED DOCUMENT
            </div>
            <div>
              Application ID: {admissionData?._id?.slice(-12)} • Generated on:{" "}
              {new Date().toLocaleString()} • Document Version: 1.0
            </div>
          </div>

          {/* PAGE FOOTER */}
          <div style={styles.footer}>
            CONFIDENTIAL DOCUMENT • CISD • PAGE 2 OF 2
          </div>

          <div style={styles.pageNumber}>Page 2</div>
        </div>
      </div>
    );

    /* ================= MAIN RETURN ================= */
    return (
      <div
        ref={ref}
        style={{
          fontFamily: "'Helvetica', 'Arial', sans-serif",
          lineHeight: "1.4",
        }}
      >
        <Page1 />
        <Page2 />
      </div>
    );
  }
);

export default ProfilePDFTemplate;
