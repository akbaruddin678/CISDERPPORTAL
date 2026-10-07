import FeeHead from "../model/FeeStructure/FeeHead.js";

const REQUIRED_FEE_HEADS = [
  // --- ACADEMIC (Tuition) ---
  { name: "Tuition Fee", slug: "tuition-fee", type: "ACADEMIC", isRefundable: false },
  { name: "Maintenance Fund", slug: "maintenance-fund", type: "ACADEMIC", isRefundable: false },
  { name: "Laboratory Fund", slug: "laboratory-fund", type: "ACADEMIC", isRefundable: false },
  { name: "Institutional Security", slug: "institutional-security", type: "ACADEMIC", isRefundable: true },
  { name: "Library Fund", slug: "library-fund", type: "ACADEMIC", isRefundable: false },
  { name: "Sports/ECA Fund", slug: "sports-eca-fund", type: "ACADEMIC", isRefundable: false },

  
  // NEW: Re-Admission
  { name: "Re-Admission Fee", slug: "re-admission-fee", type: "READMISSION", isRefundable: false },
  // --- ADMISSION (One-Time) ---
  { name: "Registration Fee", slug: "registration-fee", type: "ADMISSION", isRefundable: false },
  { name: "Processing Fee", slug: "processing-fee", type: "ADMISSION", isRefundable: false },
  { name: "Admission Fee", slug: "admission-fee", type: "ADMISSION", isRefundable: false },
  { name: "Mid-Term Exam Fee", slug: "mid-term-fee", type: "EXAM", isRefundable: false },
  { name: "Exam Fee", slug: "exam-fee", type: "EXAM", isRefundable: false },
  // --- GRADUATION (billed at degree clearance) ---
  { name: "Degree Issuance Fee", slug: "degree-issuance-fee", type: "MISCELLANEOUS", isRefundable: false },
];

export const initializeFeeHeads = async () => {
  try {
    
    
    for (const head of REQUIRED_FEE_HEADS) {
     
      await FeeHead.findOneAndUpdate(
        { slug: head.slug }, 
        { $set: head },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    
    
  } catch (error) {
    console.error(" Error Seeding Fee Heads:", error);
  }
};