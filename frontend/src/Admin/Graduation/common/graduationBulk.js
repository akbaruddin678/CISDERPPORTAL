// What each desk can do to many clearances at once. `eligible(row)` decides
// which selected rows the action applies to (the server re-checks everything);
// `remark` is "required" | "optional"; `confirmable` lets the shared remark
// double as the confirmation for items the system couldn't verify.
export const BULK_ACTIONS = {
  hod_submit: {
    key: "hod_submit",
    label: "Submit to Exam Office",
    verb: "Submit",
    tone: "primary",
    remark: "optional",
    confirmable: true,
    eligible: (r) => r.permissions?.hod,
    blurb: "Sends each clearance to the Examination Office.",
  },
  exam_approve: {
    key: "exam_approve",
    label: "Approve",
    verb: "Approve",
    tone: "primary",
    remark: "optional",
    confirmable: true,
    eligible: (r) => r.permissions?.exam,
    blurb: "Approves each transcript and opens the auxiliary offices.",
  },
  exam_reject: {
    key: "exam_reject",
    label: "Return to HOD",
    verb: "Return",
    tone: "danger",
    remark: "required",
    eligible: (r) => r.permissions?.exam,
    blurb: "Sends each clearance back to the Head of Department.",
  },
  office_approve: {
    key: "office_approve",
    label: "Mark cleared",
    verb: "Clear",
    tone: "primary",
    remark: "optional",
    eligible: (r) => r.permissions?.officeKeys?.length > 0,
    blurb: "Confirms none of your office's property or dues is outstanding.",
  },
  office_reject: {
    key: "office_reject",
    label: "Not cleared",
    verb: "Withhold",
    tone: "danger",
    remark: "required",
    eligible: (r) => r.permissions?.officeKeys?.length > 0,
    blurb: "Marks each student as not cleared by your office.",
  },
  finance_approve: {
    key: "finance_approve",
    label: "Approve",
    verb: "Approve",
    tone: "primary",
    remark: "optional",
    needsFeeReceived: true,
    eligible: (r) => r.permissions?.finance,
    blurb: "Clears each student's fees and sends them to the Registrar.",
  },
  finance_reject: {
    key: "finance_reject",
    label: "Withhold",
    verb: "Withhold",
    tone: "danger",
    remark: "required",
    eligible: (r) => r.permissions?.finance,
    blurb: "Withholds finance clearance for each student.",
  },
  registrar_finalize: {
    key: "registrar_finalize",
    label: "Final approval",
    verb: "Graduate",
    tone: "primary",
    remark: "optional",
    eligible: (r) => r.permissions?.registrar,
    blurb: "Graduates each student and adds them to the graduate list.",
  },
  registrar_reject: {
    key: "registrar_reject",
    label: "Withhold",
    verb: "Withhold",
    tone: "danger",
    remark: "required",
    eligible: (r) => r.permissions?.registrar,
    blurb: "Withholds final approval for each student.",
  },
  cancel: {
    key: "cancel",
    label: "Cancel clearance",
    verb: "Cancel",
    tone: "danger",
    remark: "required",
    eligible: (r) => r.permissions?.cancel,
    blurb: "Cancels each clearance. This cannot be undone.",
  },
};

// Buttons offered per desk, in order.
export const BULK_ACTIONS_BY_MODE = {
  hod: ["hod_submit", "cancel"],
  exam: ["exam_approve", "exam_reject"],
  desk: ["office_approve", "office_reject"],
  finance: ["finance_approve", "finance_reject"],
  registrar: ["registrar_finalize", "registrar_reject", "cancel"],
};

// The server takes a limited number per request; the screen splits bigger
// selections into batches and adds the results together.
export const BULK_BATCH_SIZE = 25;
