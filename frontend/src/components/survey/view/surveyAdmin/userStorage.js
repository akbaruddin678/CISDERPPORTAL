// User Management Storage System
const USERS_KEY = 'survey_users';
const DEPARTMENTS_KEY = 'survey_departments';
const PROGRAMS_KEY = 'survey_programs';
const SEMESTERS_KEY = 'survey_semesters';

// Default data
const DEFAULT_DEPARTMENTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Engineering',
  'Business Administration',
  'Economics',
  'Literature',
  'History',
  'Psychology',
  'Sociology'
];

const DEFAULT_PROGRAMS = [
  'BSc Computer Science',
  'BSc Mathematics',
  'BSc Physics',
  'BSc Chemistry',
  'BSc Biology',
  'BSc Engineering',
  'BBA Business Administration',
  'BA Economics',
  'BA Literature',
  'BA History',
  'BA Psychology',
  'BA Sociology'
];

const DEFAULT_SEMESTERS = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8'
];

// Initialize storage
const initializeStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    // Create some default users for testing
    const defaultUsers = [
      {
        id: 'user_1',
        username: 'admin',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@university.edu',
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'user_2',
        username: 'teacher1',
        password: 'teacher123',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@university.edu',
        role: 'teacher',
        department: 'Computer Science',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'user_3',
        username: 'student1',
        password: 'student123',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@university.edu',
        role: 'student',
        department: 'Computer Science',
        program: 'BSc Computer Science',
        semester: 'Semester 4',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
  
  if (!localStorage.getItem(DEPARTMENTS_KEY)) {
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(DEFAULT_DEPARTMENTS));
  }
  
  if (!localStorage.getItem(PROGRAMS_KEY)) {
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(DEFAULT_PROGRAMS));
  }
  
  if (!localStorage.getItem(SEMESTERS_KEY)) {
    localStorage.setItem(SEMESTERS_KEY, JSON.stringify(DEFAULT_SEMESTERS));
  }
};

// User Management Functions
export const getUsers = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
};

export const addUser = (userData) => {
  const users = getUsers();
  
  // Check if username already exists
  const existingUser = users.find(user => user.username === userData.username);
  if (existingUser) {
    throw new Error('Username already exists');
  }
  
  const newUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...userData,
    createdAt: new Date().toISOString(),
    isActive: userData.isActive !== undefined ? userData.isActive : true
  };
  
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
};

export const updateUser = (userId, userData) => {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Check if username conflicts with other users
  const usernameConflict = users.find((user, index) => 
    index !== userIndex && user.username === userData.username
  );
  
  if (usernameConflict) {
    throw new Error('Username already exists');
  }
  
  users[userIndex] = { 
    ...users[userIndex], 
    ...userData,
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users[userIndex];
};

export const deleteUser = (userId) => {
  const users = getUsers();
  const filteredUsers = users.filter(user => user.id !== userId);
  
  if (filteredUsers.length === users.length) {
    throw new Error('User not found');
  }
  
  localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));
  return true;
};

export const getUserById = (userId) => {
  const users = getUsers();
  return users.find(user => user.id === userId);
};

export const authenticateUser = (username, password) => {
  const users = getUsers();
  return users.find(user => 
    user.username === username && 
    user.password === password && 
    user.isActive
  );
};

// Department Management Functions
export const getDepartments = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(DEPARTMENTS_KEY)) || [];
};

export const addDepartment = (departmentName) => {
  const departments = getDepartments();
  const trimmedName = departmentName.trim();
  
  if (!trimmedName) {
    throw new Error('Department name cannot be empty');
  }
  
  if (departments.includes(trimmedName)) {
    throw new Error('Department already exists');
  }
  
  departments.push(trimmedName);
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
  return departments;
};

export const deleteDepartment = (departmentName) => {
  const departments = getDepartments();
  const filteredDepartments = departments.filter(dept => dept !== departmentName);
  
  if (filteredDepartments.length === departments.length) {
    throw new Error('Department not found');
  }
  
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(filteredDepartments));
  return filteredDepartments;
};

// Program Management Functions
export const getPrograms = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(PROGRAMS_KEY)) || [];
};

export const addProgram = (programName) => {
  const programs = getPrograms();
  const trimmedName = programName.trim();
  
  if (!trimmedName) {
    throw new Error('Program name cannot be empty');
  }
  
  if (programs.includes(trimmedName)) {
    throw new Error('Program already exists');
  }
  
  programs.push(trimmedName);
  localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs));
  return programs;
};

// Semester Management Functions
export const getSemesters = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(SEMESTERS_KEY)) || [];
};

export const addSemester = (semesterName) => {
  const semesters = getSemesters();
  const trimmedName = semesterName.trim();
  
  if (!trimmedName) {
    throw new Error('Semester name cannot be empty');
  }
  
  if (semesters.includes(trimmedName)) {
    throw new Error('Semester already exists');
  }
  
  semesters.push(trimmedName);
  localStorage.setItem(SEMESTERS_KEY, JSON.stringify(semesters));
  return semesters;
};

// User Filtering Functions
export const getUsersByDepartment = (department) => {
  const users = getUsers();
  return users.filter(user => user.department === department);
};

export const getUsersByRole = (role) => {
  const users = getUsers();
  return users.filter(user => user.role === role);
};

export const getActiveUsers = () => {
  const users = getUsers();
  return users.filter(user => user.isActive);
};

// Search Functions
export const searchUsers = (searchTerm) => {
  const users = getUsers();
  const term = searchTerm.toLowerCase();
  
  return users.filter(user => 
    user.firstName.toLowerCase().includes(term) ||
    user.lastName.toLowerCase().includes(term) ||
    user.email.toLowerCase().includes(term) ||
    user.username.toLowerCase().includes(term) ||
    user.department?.toLowerCase().includes(term) ||
    user.program?.toLowerCase().includes(term) ||
    user.semester?.toLowerCase().includes(term)
  );
};

// Survey Assignment Functions
export const assignSurveyToDepartment = (surveyId, department) => {
  const users = getUsersByDepartment(department);
  const students = users.filter(user => user.role === 'student' && user.isActive);
  
  return students.map(student => ({
    studentId: student.id,
    surveyId,
    assignedAt: new Date().toISOString(),
    status: 'assigned',
    completed: false
  }));
};

export const getSurveyAssignments = (surveyId) => {
  const assignments = JSON.parse(localStorage.getItem(`survey_assignments_${surveyId}`)) || [];
  return assignments;
};

export const saveSurveyAssignments = (surveyId, assignments) => {
  localStorage.setItem(`survey_assignments_${surveyId}`, JSON.stringify(assignments));
};

// Statistics Functions
export const getUserStats = () => {
  const users = getUsers();
  const activeUsers = users.filter(user => user.isActive);
  
  const stats = {
    total: users.length,
    active: activeUsers.length,
    inactive: users.length - activeUsers.length,
    students: activeUsers.filter(user => user.role === 'student').length,
    teachers: activeUsers.filter(user => user.role === 'teacher').length,
    admins: activeUsers.filter(user => user.role === 'admin').length,
    departments: [...new Set(activeUsers.map(user => user.department).filter(Boolean))].length,
    programs: [...new Set(activeUsers.map(user => user.program).filter(Boolean))].length
  };
  
  return stats;
};

// Data Export/Import Functions
export const exportUsersData = () => {
  const users = getUsers();
  const departments = getDepartments();
  const programs = getPrograms();
  const semesters = getSemesters();
  
  return {
    users,
    departments,
    programs,
    semesters,
    exportedAt: new Date().toISOString()
  };
};

export const importUsersData = (data) => {
  if (data.users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
  }
  if (data.departments) {
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(data.departments));
  }
  if (data.programs) {
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(data.programs));
  }
  if (data.semesters) {
    localStorage.setItem(SEMESTERS_KEY, JSON.stringify(data.semesters));
  }
  
  return true;
};

// Validation Functions
export const validateUserData = (userData) => {
  const errors = [];
  
  if (!userData.username?.trim()) {
    errors.push('Username is required');
  }
  
  if (!userData.password?.trim()) {
    errors.push('Password is required');
  }
  
  if (!userData.firstName?.trim()) {
    errors.push('First name is required');
  }
  
  if (!userData.lastName?.trim()) {
    errors.push('Last name is required');
  }
  
  if (!userData.role) {
    errors.push('Role is required');
  }
  
  if (userData.role === 'student') {
    if (!userData.department) {
      errors.push('Department is required for students');
    }
    if (!userData.program) {
      errors.push('Program is required for students');
    }
    if (!userData.semester) {
      errors.push('Semester is required for students');
    }
  }
  
  if (userData.role === 'teacher' && !userData.department) {
    errors.push('Department is required for teachers');
  }
  
  return errors;
};

// Initialize on import
initializeStorage();