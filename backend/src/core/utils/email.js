import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email, token) => {
  try {
    const domain = "https://cisd.cisdportal.online";
    const verificationUrl = `${domain}/verify-email?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: "CISD Admissions <admissions@cisd.mail.cisdportal.online>",
      to: email,
      subject: "Verify your CISD Account", // Slightly less aggressive subject
      // TAGS help Resend categorize reputation
      tags: [
        {
          name: "category",
          value: "verification",
        },
      ],
      // 1. ADD THIS: Plain text version is MANDATORY for good deliverability
      text: `Hello! Thank you for registering with CISD. Please verify your email by clicking the following link: ${verificationUrl} \n\nIf you did not request this, please ignore this email.`,

      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: #1e3a8a; color: #ffffff; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
            .button { display: block; width: 200px; margin: 30px auto; padding: 15px 0; background-color: #d97706; color: #ffffff; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
            .warning { background-color: #fffbeb; border-left: 4px solid #d97706; padding: 10px; margin: 20px 0; font-size: 14px; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;">CISD</h1>
            </div>
            <div class="content">
              <h2>Hello, Applicant!</h2>
              <p>Thank you for registering with CISD. To ensure the security of your account, please verify your email address.</p>

              <div class="warning">
                Please verify your account within <strong>10 minutes</strong> — unverified registrations are removed automatically after that so the email address can be used to sign up again.
              </div>

              <a href="${verificationUrl}" class="button">Verify Email Now</a>

              <p style="text-align: center; font-size: 14px; color: #666;">
                Or copy this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #1e3a8a;">${verificationUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CISD. All rights reserved.</p>
              <p>Islamabad, Pakistan</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

// Sent once an applicant's admission is ACCEPTED — carries the formal
// admission letter (see core/utils/pdf/admissionLetterPdf.js) as a PDF
// attachment, plus the first admission fee challan as a second attachment
// when one has already been generated. `content` is base64-encoded rather
// than passed as a raw Buffer since that's the one attachment format
// guaranteed to work across Resend SDK versions.
export const sendAdmissionAcceptanceEmail = async (
  email,
  { fullName, pdfBuffer, challanPdfBuffer },
) => {
  try {
    const challanNote = challanPdfBuffer
      ? " Your first admission fee challan is also attached — please pay it to confirm your admission."
      : " To confirm your admission, please pay the first admission fee challan once it is generated — it will be available on the Student Portal and emailed to you.";

    const { data, error } = await resend.emails.send({
      from: "CISD Admissions <admissions@cisd.mail.cisdportal.online>",
      to: email,
      subject: "Congratulations! Your Admission to CISD has been Accepted",
      tags: [
        {
          name: "category",
          value: "admission_accepted",
        },
      ],
      text: `Dear ${fullName},\n\nCongratulations! Your application for admission to CISD has been accepted. Please find your official admission letter attached.${challanNote}\n\nWe look forward to welcoming you to our academic community.\n\nCISD Admissions`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: #1e3a8a; color: #ffffff; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
            .badge { display: inline-block; background-color: #d97706; color: #ffffff; padding: 6px 16px; border-radius: 999px; font-weight: bold; font-size: 13px; letter-spacing: 0.5px; margin-bottom: 16px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
            .note { background-color: #eef2ff; border-left: 4px solid #1e3a8a; padding: 10px; margin: 20px 0; font-size: 14px; color: #1e3a8a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;">CISD</h1>
            </div>
            <div class="content">
              <span class="badge">ADMISSION ACCEPTED</span>
              <h2>Congratulations, ${fullName}!</h2>
              <p>We are delighted to inform you that your application for admission to CISD has been <strong>accepted</strong>.</p>
              <p>Your official admission letter is attached to this email as a PDF — it includes your program, session, and registration number.</p>
              <div class="note">
                ${
                  challanPdfBuffer
                    ? "Your first admission fee challan is also attached to this email — please pay it to confirm your admission. It is also visible on the Student Portal."
                    : "To confirm your admission, please pay the first admission fee challan once it is generated — it will be visible on the Student Portal as well as sent to you by email."
                }
              </div>
              <p>Once again, congratulations — we look forward to welcoming you to our academic community.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CISD. All rights reserved.</p>
              <p>Islamabad, Pakistan</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: "CISD-Admission-Letter.pdf",
          content: pdfBuffer.toString("base64"),
        },
        ...(challanPdfBuffer
          ? [
              {
                filename: "CISD-Admission-Fee-Challan.pdf",
                content: challanPdfBuffer.toString("base64"),
              },
            ]
          : []),
      ],
    });

    if (error) {
      console.error("Resend Error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

export const sendPasswordResetOtpEmail = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "CISD Admissions <admissions@cisd.mail.cisdportal.online>",
      to: email,
      subject: "Your CISD Password Reset Code",
      tags: [
        {
          name: "category",
          value: "password_reset",
        },
      ],
      text: `Your CISD password reset code is: ${otp}\n\nThis code expires in 10 minutes. If you did not request a password reset, please ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: #1e3a8a; color: #ffffff; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; color: #333333; line-height: 1.6; text-align: center; }
            .otp-box { display: inline-block; margin: 20px 0; padding: 16px 32px; background-color: #eef2ff; border: 2px dashed #1e3a8a; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e3a8a; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
            .warning { background-color: #fffbeb; border-left: 4px solid #d97706; padding: 10px; margin: 20px 0; font-size: 14px; color: #92400e; text-align: left; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;">CISD</h1>
            </div>
            <div class="content">
              <h2>Password Reset Code</h2>
              <p>Use the code below to reset your password.</p>
              <div class="otp-box">${otp}</div>
              <div class="warning">
                This code expires in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email — your password will not be changed.
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CISD. All rights reserved.</p>
              <p>Islamabad, Pakistan</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

export const sendRegistrationOtpEmail = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "CISD Admissions <admissions@cisd.mail.cisdportal.online>",
      to: email,
      subject: "Verify Your Email — CISD Account Creation",
      tags: [
        {
          name: "category",
          value: "registration_otp",
        },
      ],
      text: `Your CISD email verification code is: ${otp}\n\nThis code expires in 10 minutes. If you did not request to create an account, please ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: #1e3a8a; color: #ffffff; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; color: #333333; line-height: 1.6; text-align: center; }
            .otp-box { display: inline-block; margin: 20px 0; padding: 16px 32px; background-color: #eef2ff; border: 2px dashed #1e3a8a; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e3a8a; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
            .warning { background-color: #fffbeb; border-left: 4px solid #d97706; padding: 10px; margin: 20px 0; font-size: 14px; color: #92400e; text-align: left; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;">CISD</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email</h2>
              <p>Use the code below to verify your email and create your account.</p>
              <div class="otp-box">${otp}</div>
              <div class="warning">
                This code expires in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CISD. All rights reserved.</p>
              <p>Islamabad, Pakistan</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

// Shared minimal wrapper for the three HR alert emails below — they're
// all "same layout, different subject/message" so this avoids repeating
// the HTML shell three times. Mirrors sendRegistrationOtpEmail's markup
// style (same header color, footer, fonts) for visual consistency.
const sendHrAlertEmail = async ({ to, subject, category, heading, bodyHtml }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "CISD HR <hr@cisd.mail.cisdportal.online>",
      to,
      subject,
      tags: [{ name: "category", value: category }],
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: #1e3a8a; color: #ffffff; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;">CISD — HR</h1>
            </div>
            <div class="content">
              <h2>${heading}</h2>
              ${bodyHtml}
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CISD. All rights reserved.</p>
              <p>Islamabad, Pakistan</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

// Verification code for the public, no-login /teacher-onboarding page
// (existing employees self-registering into the ERP) — deliberately its
// own email, not sendRegistrationOtpEmail, since that one's copy talks
// about "Account Creation" and no account is created by this flow at all.
export const sendOnboardingOtpEmail = async (to, otp) =>
  sendHrAlertEmail({
    to,
    subject: "Verify Your Email — Staff Onboarding",
    category: "onboarding_otp",
    heading: "Verify Your Email",
    bodyHtml: `<p>Your verification code for the staff onboarding application is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p><p>This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>`,
  });

export const sendProbationEndingEmail = async (to, { name, endDate }) =>
  sendHrAlertEmail({
    to,
    subject: `Probation Period Ending Soon — ${name}`,
    category: "hr_probation_ending",
    heading: "Probation Period Ending Soon",
    bodyHtml: `<p><strong>${name}</strong>'s probation period ends on <strong>${new Date(endDate).toLocaleDateString()}</strong>.</p><p>Please initiate the confirmation or termination process before this date.</p>`,
  });

export const sendDocumentExpiryEmail = async (to, { name, docType, expiryDate }) =>
  sendHrAlertEmail({
    to,
    subject: `Document Expiring Soon — ${docType}`,
    category: "hr_document_expiry",
    heading: "Document Expiring Soon",
    bodyHtml: `<p>The document <strong>${docType}</strong> for <strong>${name}</strong> expires on <strong>${new Date(expiryDate).toLocaleDateString()}</strong>.</p><p>Please arrange for a renewed copy to be uploaded before it expires.</p>`,
  });

export const sendContractEndingEmail = async (to, { name, endDate }) =>
  sendHrAlertEmail({
    to,
    subject: `Contract Ending Soon — ${name}`,
    category: "hr_contract_ending",
    heading: "Contract Ending Soon",
    bodyHtml: `<p><strong>${name}</strong>'s current contract ends on <strong>${new Date(endDate).toLocaleDateString()}</strong>.</p><p>Please review for renewal, extension, or offboarding.</p>`,
  });

// =========================================================
// Leave request workflow — Teacher submits -> HOD reviews -> HR reviews.
// =========================================================

const formatLeaveDates = (startDate, endDate) =>
  `${new Date(startDate).toLocaleDateString()} — ${new Date(endDate).toLocaleDateString()}`;

export const sendLeaveSubmittedForReviewEmail = async (
  to,
  { employeeName, leaveType, startDate, endDate, totalDays },
) =>
  sendHrAlertEmail({
    to,
    subject: `Leave Request Awaiting Your Review — ${employeeName}`,
    category: "leave_submitted",
    heading: "New Leave Request To Review",
    bodyHtml: `<p><strong>${employeeName}</strong> has requested <strong>${leaveType}</strong> leave for <strong>${formatLeaveDates(startDate, endDate)}</strong> (${totalDays} day${totalDays === 1 ? "" : "s"}).</p><p>Please review this request in the portal.</p>`,
  });

const LEAVE_DECISION_COPY = {
  Approved_HOD: {
    subject: "Leave Request Approved by HOD",
    heading: "Your Leave Was Approved by the HOD",
    lead: "Your leave request has been approved by your Head of Department and forwarded to HR for final sign-off.",
  },
  Approved_HR: {
    subject: "Leave Request Approved",
    heading: "Your Leave Was Approved",
    lead: "Your leave request has been fully approved.",
  },
  Rejected: {
    subject: "Leave Request Rejected",
    heading: "Your Leave Request Was Rejected",
    lead: "Your leave request was not approved.",
  },
};

export const sendLeaveDecisionEmail = async (
  to,
  { stage, decision, leaveType, startDate, endDate, remarks },
) => {
  const copy = LEAVE_DECISION_COPY[decision] || LEAVE_DECISION_COPY.Rejected;
  const stageLabel = stage === "hod" ? "HOD" : "HR";
  return sendHrAlertEmail({
    to,
    subject: copy.subject,
    category: "leave_decision",
    heading: copy.heading,
    bodyHtml: `<p>${copy.lead}</p><p><strong>${leaveType}</strong> leave for <strong>${formatLeaveDates(startDate, endDate)}</strong>.</p>${
      remarks ? `<p><strong>${stageLabel} remarks:</strong> ${remarks}</p>` : ""
    }`,
  });
};

// =========================================================
// Onboarding post-submission triggers
// =========================================================

// Sent once, right after HR completes onboarding — carries a link to the
// new "Set Your Password" page, reusing the existing resetToken mechanism
// (the same field/flow used for self-service password resets) so no new
// backend verification machinery is needed.
export const sendWelcomeSetPasswordEmail = async (email, { name, setPasswordUrl }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "CISD HR <hr@cisd.mail.cisdportal.online>",
      to: email,
      subject: "Welcome to CISD — Set Your Password",
      tags: [{ name: "category", value: "hr_welcome_set_password" }],
      text: `Hello ${name},\n\nWelcome to CISD! Your employee portal account has been created. Please set your password using the link below:\n\n${setPasswordUrl}\n\nThis link expires in 72 hours. If you did not expect this email, please contact HR.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: #1e3a8a; color: #ffffff; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
            .button { display: block; width: 220px; margin: 30px auto; padding: 15px 0; background-color: #d97706; color: #ffffff; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
            .warning { background-color: #fffbeb; border-left: 4px solid #d97706; padding: 10px; margin: 20px 0; font-size: 14px; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;">CISD</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${name}!</h2>
              <p>Your employee portal account has been created by HR. To get started, please set your password using the button below.</p>
              <a href="${setPasswordUrl}" class="button">Set Your Password</a>
              <p style="text-align: center; font-size: 14px; color: #666;">
                Or copy this link into your browser:<br>
                <a href="${setPasswordUrl}" style="color: #1e3a8a;">${setPasswordUrl}</a>
              </p>
              <div class="warning">
                This link expires in <strong>72 hours</strong>. If you did not expect this email, please contact HR.
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CISD. All rights reserved.</p>
              <p>Islamabad, Pakistan</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

export const sendItProvisioningEmail = async (itEmail, { name, designation, departmentName, joiningDate, biometricId }) =>
  sendHrAlertEmail({
    to: itEmail,
    subject: `New Hire IT Provisioning — ${name}`,
    category: "hr_it_provisioning",
    heading: "New Hire — IT Provisioning Needed",
    bodyHtml: `
      <p>A new employee has been onboarded and needs IT provisioning:</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Designation:</strong> ${designation || "—"}</li>
        <li><strong>Department:</strong> ${departmentName || "—"}</li>
        <li><strong>Joining Date:</strong> ${joiningDate ? new Date(joiningDate).toLocaleDateString() : "—"}</li>
        <li><strong>Biometric/RFID ID on file:</strong> ${biometricId || "Not provided"}</li>
      </ul>
      <p>Please prepare a laptop/workstation and network access as applicable.</p>
    `,
  });

export const sendHodNewHireEmail = async (hodEmail, { name, designation, departmentName }) =>
  sendHrAlertEmail({
    to: hodEmail,
    subject: `New Team Member — ${name}`,
    category: "hr_hod_new_hire",
    heading: "New Team Member Active",
    bodyHtml: `<p><strong>${name}</strong> (${designation || "Staff"}) has been onboarded and is now active in ${departmentName ? `<strong>${departmentName}</strong>` : "your department"}.</p>`,
  });
