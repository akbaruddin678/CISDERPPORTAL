// Initialize sample data for the survey system
import { addUser, addDepartment } from './userStorage';
import { addSurvey } from './surveyStorage';

export const initializeSampleData = () => {
  // Check if data already exists
  const existingUsers = JSON.parse(localStorage.getItem('survey_users') || '[]');
  if (existingUsers.length > 0) {
    return; // Data already initialized
  }

  // Add sample departments
  const departments = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Engineering',
    'Business',
    'Economics',
    'Literature',
    'History',
    'Psychology',
    'Sociology'
  ];

  departments.forEach(dept => addDepartment(dept));

  // Add sample admin
  addUser({
    username: 'admin',
    password: 'admin123',
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@survey.com',
    role: 'admin',
    department: 'Administration',
    isActive: true
  });

  // Add sample teachers
  const teachers = [
    {
      username: 'teacher1',
      password: 'teacher123',
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@university.edu',
      role: 'teacher',
      department: 'Computer Science',
      isActive: true
    },
    {
      username: 'teacher2',
      password: 'teacher123',
      firstName: 'Prof. Michael',
      lastName: 'Chen',
      email: 'michael.chen@university.edu',
      role: 'teacher',
      department: 'Mathematics',
      isActive: true
    },
    {
      username: 'teacher3',
      password: 'teacher123',
      firstName: 'Dr. Emily',
      lastName: 'Davis',
      email: 'emily.davis@university.edu',
      role: 'teacher',
      department: 'Physics',
      isActive: true
    }
  ];

  teachers.forEach(teacher => addUser(teacher));

  // Add sample students
  const students = [
    {
      username: 'student1',
      password: 'student123',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@student.edu',
      role: 'student',
      department: 'Computer Science',
      isActive: true
    },
    {
      username: 'student2',
      password: 'student123',
      firstName: 'Alice',
      lastName: 'Brown',
      email: 'alice.brown@student.edu',
      role: 'student',
      department: 'Computer Science',
      isActive: true
    },
    {
      username: 'student3',
      password: 'student123',
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@student.edu',
      role: 'student',
      department: 'Mathematics',
      isActive: true
    },
    {
      username: 'student4',
      password: 'student123',
      firstName: 'Carol',
      lastName: 'Taylor',
      email: 'carol.taylor@student.edu',
      role: 'student',
      department: 'Physics',
      isActive: true
    },
    {
      username: 'student5',
      password: 'student123',
      firstName: 'David',
      lastName: 'Anderson',
      email: 'david.anderson@student.edu',
      role: 'student',
      department: 'Computer Science',
      isActive: true
    }
  ];

  students.forEach(student => addUser(student));

  // Add sample surveys
  const sampleSurveys = [
    {
      title: 'Course Feedback Survey',
      description: 'Please provide feedback about your course experience this semester.',
      questions: [
        {
          id: 'q1',
          questionText: 'How would you rate the course content?',
          type: 'rating',
          required: true
        },
        {
          id: 'q2',
          questionText: 'What aspects of the course did you find most helpful?',
          type: 'checkbox',
          options: ['Lectures', 'Assignments', 'Discussions', 'Resources'],
          required: true
        },
        {
          id: 'q3',
          questionText: 'Any additional comments or suggestions?',
          type: 'paragraph',
          required: false
        }
      ],
      departments: ['Computer Science', 'Mathematics'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      title: 'Student Satisfaction Survey',
      description: 'Help us improve the student experience by sharing your thoughts.',
      questions: [
        {
          id: 'q1',
          questionText: 'How satisfied are you with the overall academic experience?',
          type: 'rating',
          required: true
        },
        {
          id: 'q2',
          questionText: 'Which services do you use most frequently?',
          type: 'multiple',
          options: ['Library', 'Cafeteria', 'Gym', 'Study Rooms'],
          required: true
        },
        {
          id: 'q3',
          questionText: 'What improvements would you suggest?',
          type: 'paragraph',
          required: false
        }
      ],
      departments: ['Computer Science', 'Physics', 'Mathematics'],
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];

  sampleSurveys.forEach(survey => addSurvey(survey));

 
};
