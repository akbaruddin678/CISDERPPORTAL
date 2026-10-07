import mongoose from "mongoose"; 
import StudentProfile from "../../student/models/StudentProfile.js";

/**
 * Generate student ID in format: FA2021CS5001
 * Format: SessionCode + Year + DepartmentCode + SequentialNumber
 */
export const generateStudentId = async (departmentId, termId) => {
  try {
    
    // Get the latest student for this department and term to find the next sequential number
    const latestStudent = await StudentProfile.findOne({
      departmentId: new mongoose.Types.ObjectId(departmentId),
      termId: new mongoose.Types.ObjectId(termId)
    })
    .sort({ createdAt: -1 })
    .select('studentId')
    .lean();

    let sequentialNumber = 5001; // Starting number

    if (latestStudent && latestStudent.studentId) {
      // Extract the sequential number from existing student ID
      const existingId = latestStudent.studentId;
      const numberPart = existingId.slice(-4); // Last 4 digits
      const parsedNumber = parseInt(numberPart);
      
      if (!isNaN(parsedNumber)) {
        sequentialNumber = parsedNumber + 1;
      }
    }

    // Get department and term details
    const Department = mongoose.model('Department');
    const Term = mongoose.model('Term');
    
    const [department, term] = await Promise.all([
      Department.findById(departmentId).select('code').lean(),
      Term.findById(termId).select('name startDate').lean()
    ]);

    if (!department) {
      throw new Error('Department not found');
    }
    if (!term) {
      throw new Error('Term not found');
    }



    // Extract session code (e.g., "FA" from "Fall 2021")
    const sessionCode = getSessionCode(term.name);
    
    // Extract year from term start date or name
    const year = getYearFromTerm(term);
    
    // Get department code (e.g., "CS" for Computer Science)
    const deptCode = department.code.toUpperCase();
    
    // Format: FA2021CS5001
    const generatedId = `${sessionCode}${year}${deptCode}${sequentialNumber.toString().padStart(4, '0')}`;
  
    
    return generatedId;
  } catch (error) {
    console.error('Error generating student ID:', error);
    throw error;
  }
};

/**
 * Extract session code from term name
 */
const getSessionCode = (termName) => {
  if (!termName) return 'FA'; // Default to Fall
  
  const termMap = {
    'fall': 'FA',
    'spring': 'SP', 
    'summer': 'SU',
    'autumn': 'AU',
    'winter': 'WI'
  };

  const termLower = termName.toLowerCase();
  for (const [key, code] of Object.entries(termMap)) {
    if (termLower.includes(key)) {
      return code;
    }
  }
  
  // Default to first two letters if no match
  return termName.substring(0, 2).toUpperCase();
};

/**
 * Extract year from term
 */
const getYearFromTerm = (term) => {
  if (term.startDate) {
    return new Date(term.startDate).getFullYear().toString();
  }
  
  // Extract year from term name if startDate is not available
  const yearMatch = term.name.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    return yearMatch[1];
  }
  
  // Default to current year
  return new Date().getFullYear().toString();
};

export default generateStudentId;