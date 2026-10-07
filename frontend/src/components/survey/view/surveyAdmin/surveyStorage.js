// Survey Storage Utility Functions

// Get all surveys from localStorage
export const getSurveys = () => {
  try {
    const surveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    // Ensure each survey has the required properties with proper defaults
    return surveys.map(survey => ({
      id: survey.id || `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: survey.title || 'Untitled Survey',
      description: survey.description || '',
      questions: survey.questions || [],
      isActive: survey.isActive !== undefined ? survey.isActive : true,
      responses: survey.responses || [],
      departments: survey.departments || [],
      assignedTo: survey.assignedTo || { teachers: false, students: true },
      createdAt: survey.createdAt || new Date().toISOString(),
      updatedAt: survey.updatedAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error getting surveys:', error);
    return [];
  }
};

// Save surveys to localStorage
const saveSurveys = (surveys) => {
  try {
    localStorage.setItem('surveys', JSON.stringify(surveys));
    return true;
  } catch (error) {
    console.error('Error saving surveys:', error);
    throw new Error('Failed to save surveys to storage');
  }
};

// Add a new survey
export const addSurvey = (survey) => {
  try {
    const surveys = getSurveys();
    const newSurvey = {
      ...survey,
      id: `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: survey.isActive !== undefined ? survey.isActive : true,
      responses: survey.responses || [],
    };
    
    surveys.push(newSurvey);
    saveSurveys(surveys);
   
    return newSurvey;
  } catch (error) {
    console.error('Error adding survey:', error);
    throw error;
  }
};

// Update survey
export const updateSurvey = (id, updates) => {
  try {
    const surveys = getSurveys();
    const surveyIndex = surveys.findIndex(s => s.id === id);
    
    if (surveyIndex !== -1) {
      const updatedSurvey = {
        ...surveys[surveyIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
        id: surveys[surveyIndex].id, // Preserve original ID
        createdAt: surveys[surveyIndex].createdAt, // Preserve creation date
      };
      
      surveys[surveyIndex] = updatedSurvey;
      saveSurveys(surveys);
     
      return updatedSurvey;
    }
    
    console.warn('❌ Survey not found for update:', id);
    return null;
  } catch (error) {
    console.error('Error updating survey:', error);
    throw error;
  }
};

// Get survey by ID
export const getSurveyById = (id) => {
  try {
    const surveys = getSurveys();
    const survey = surveys.find(s => s.id === id);
    
    if (!survey) {
      console.warn('❌ Survey not found:', id);
      return null;
    }
    
    return survey;
  } catch (error) {
    console.error('Error getting survey by ID:', error);
    return null;
  }
};

// Toggle survey active status
export const toggleSurveyStatus = (id) => {
  try {
    const surveys = getSurveys();
    const surveyIndex = surveys.findIndex(s => s.id === id);
    
    if (surveyIndex !== -1) {
      surveys[surveyIndex].isActive = !surveys[surveyIndex].isActive;
      surveys[surveyIndex].updatedAt = new Date().toISOString();
      saveSurveys(surveys);
      
     
      return surveys;
    }
    
    console.warn('❌ Survey not found for status toggle:', id);
    return surveys;
  } catch (error) {
    console.error('Error toggling survey status:', error);
    throw error;
  }
};

// Delete a survey
export const deleteSurvey = (id) => {
  try {
    const surveys = getSurveys();
    const surveyToDelete = surveys.find(s => s.id === id);
    const filteredSurveys = surveys.filter(s => s.id !== id);
    
    saveSurveys(filteredSurveys);
  
    return filteredSurveys;
  } catch (error) {
    console.error('Error deleting survey:', error);
    throw error;
  }
};

// Get surveys by department and role
export const getSurveysByDepartmentAndRole = (department, role) => {
  try {
    const surveys = getSurveys();
    return surveys.filter(survey => {
      const hasDepartment = survey.departments?.length === 0 || survey.departments?.includes(department);
      const isAssigned = role === 'teacher' ? 
        survey.assignedTo?.teachers : 
        survey.assignedTo?.students;
      
      return hasDepartment && isAssigned && survey.isActive;
    });
  } catch (error) {
    console.error('Error getting surveys by department and role:', error);
    return [];
  }
};

// Get survey responses for teacher view
export const getSurveyResponsesForTeacher = (surveyId, teacherDepartment) => {
  try {
    const surveys = getSurveys();
    const survey = surveys.find(s => s.id === surveyId);
    
    if (!survey || !survey.departments?.includes(teacherDepartment)) {
      return [];
    }
    
    return survey.responses || [];
  } catch (error) {
    console.error('Error getting survey responses for teacher:', error);
    return [];
  }
};

// Add response to a survey
export const addSurveyResponse = (surveyId, response) => {
  try {
    const surveys = getSurveys();
    const surveyIndex = surveys.findIndex(s => s.id === surveyId);
    
    if (surveyIndex !== -1 && surveys[surveyIndex].isActive) {
      if (!surveys[surveyIndex].responses) {
        surveys[surveyIndex].responses = [];
      }
      
      const newResponse = {
        ...response,
        id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: new Date().toISOString()
      };
      
      surveys[surveyIndex].responses.push(newResponse);
      surveys[surveyIndex].updatedAt = new Date().toISOString();
      saveSurveys(surveys);
      
     
      return newResponse;
    }
    
    console.warn('❌ Survey not found or inactive for response:', surveyId);
    return null;
  } catch (error) {
    console.error('Error adding survey response:', error);
    throw error;
  }
};

// Get student responses
export const getStudentResponses = (studentId) => {
  try {
    const responses = JSON.parse(localStorage.getItem('studentResponses') || '{}');
    return responses[studentId] || [];
  } catch (error) {
    console.error('Error getting student responses:', error);
    return [];
  }
};

// Save student response
export const saveStudentResponse = (studentId, surveyId, answers) => {
  try {
    const responses = JSON.parse(localStorage.getItem('studentResponses') || '{}');
    const studentResponses = responses[studentId] || [];
    
    // Remove existing response for this survey
    const filteredResponses = studentResponses.filter(r => r.surveyId !== surveyId);
    
    const newResponse = {
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      surveyId,
      answers,
      submittedAt: new Date().toISOString()
    };
    
    responses[studentId] = [...filteredResponses, newResponse];
    localStorage.setItem('studentResponses', JSON.stringify(responses));
    
    // Also add to survey responses
    const surveys = getSurveys();
    const surveyIndex = surveys.findIndex(s => s.id === surveyId);
    if (surveyIndex !== -1 && surveys[surveyIndex].isActive) {
      if (!surveys[surveyIndex].responses) {
        surveys[surveyIndex].responses = [];
      }
      
      const existingResponseIndex = surveys[surveyIndex].responses.findIndex(
        r => r.studentId === studentId
      );
      
      if (existingResponseIndex !== -1) {
        surveys[surveyIndex].responses[existingResponseIndex] = {
          studentId,
          ...newResponse
        };
      } else {
        surveys[surveyIndex].responses.push({
          studentId,
          ...newResponse
        });
      }
      
      saveSurveys(surveys);
    }
    
 
    return newResponse;
  } catch (error) {
    console.error('Error saving student response:', error);
    return null;
  }
};

// Get survey statistics for teacher
export const getTeacherSurveyStats = (department) => {
  try {
    const surveys = getSurveysByDepartmentAndRole(department, 'teacher');
    const totalSurveys = surveys.length;
    const activeSurveys = surveys.filter(s => s.isActive).length;
    const totalResponses = surveys.reduce((total, survey) => total + (survey.responses?.length || 0), 0);
    const completedSurveys = surveys.filter(survey => 
      survey.responses && survey.responses.length > 0
    ).length;
    
    return {
      totalSurveys,
      activeSurveys,
      completedSurveys,
      totalResponses,
      completionRate: totalSurveys > 0 ? Math.round((completedSurveys / totalSurveys) * 100) : 0
    };
  } catch (error) {
    console.error('Error getting teacher survey stats:', error);
    return {
      totalSurveys: 0,
      activeSurveys: 0,
      completedSurveys: 0,
      totalResponses: 0,
      completionRate: 0
    };
  }
};

// Get active surveys only
export const getActiveSurveys = () => {
  try {
    const surveys = getSurveys();
    return surveys.filter(survey => survey.isActive);
  } catch (error) {
    console.error('Error getting active surveys:', error);
    return [];
  }
};

// Get survey statistics for admin dashboard
export const getAdminSurveyStats = () => {
  try {
    const surveys = getSurveys();
    const totalSurveys = surveys.length;
    const activeSurveys = surveys.filter(s => s.isActive).length;
    const totalResponses = surveys.reduce((total, survey) => total + (survey.responses?.length || 0), 0);
    
    // Calculate responses per survey
    const responsesPerSurvey = totalSurveys > 0 ? (totalResponses / totalSurveys).toFixed(1) : 0;
    
    // Get recent surveys (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSurveys = surveys.filter(survey => 
      new Date(survey.createdAt) > thirtyDaysAgo
    ).length;
    
    return {
      totalSurveys,
      activeSurveys,
      totalResponses,
      responsesPerSurvey,
      recentSurveys,
      inactiveSurveys: totalSurveys - activeSurveys
    };
  } catch (error) {
    console.error('Error getting admin survey stats:', error);
    return {
      totalSurveys: 0,
      activeSurveys: 0,
      totalResponses: 0,
      responsesPerSurvey: 0,
      recentSurveys: 0,
      inactiveSurveys: 0
    };
  }
};

// Duplicate a survey
export const duplicateSurvey = (id) => {
  try {
    const surveys = getSurveys();
    const originalSurvey = surveys.find(s => s.id === id);
    
    if (!originalSurvey) {
      console.warn('❌ Survey not found for duplication:', id);
      return null;
    }
    
    const duplicatedSurvey = {
      ...originalSurvey,
      id: `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${originalSurvey.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [],
      isActive: false // Keep duplicated survey inactive by default
    };
    
    // Remove the ID from questions to avoid conflicts
    duplicatedSurvey.questions = duplicatedSurvey.questions?.map(question => ({
      ...question,
      id: `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })) || [];
    
    surveys.push(duplicatedSurvey);
    saveSurveys(surveys);
    
  
    return duplicatedSurvey;
  } catch (error) {
    console.error('Error duplicating survey:', error);
    throw error;
  }
};

// Search surveys by title or description
export const searchSurveys = (query) => {
  try {
    const surveys = getSurveys();
    const lowercaseQuery = query.toLowerCase();
    
    return surveys.filter(survey => 
      survey.title.toLowerCase().includes(lowercaseQuery) ||
      survey.description.toLowerCase().includes(lowercaseQuery)
    );
  } catch (error) {
    console.error('Error searching surveys:', error);
    return [];
  }
};

// Get surveys by status
export const getSurveysByStatus = (isActive) => {
  try {
    const surveys = getSurveys();
    return surveys.filter(survey => survey.isActive === isActive);
  } catch (error) {
    console.error('Error getting surveys by status:', error);
    return [];
  }
};

// Clear all data (for testing/development)
export const clearAllData = () => {
  try {
    localStorage.removeItem('surveys');
    localStorage.removeItem('studentResponses');
  
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

// Export all data for backup
export const exportAllData = () => {
  try {
    const surveys = getSurveys();
    const studentResponses = JSON.parse(localStorage.getItem('studentResponses') || '{}');
    
    return {
      surveys,
      studentResponses,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
};

// Import data from backup
export const importData = (data) => {
  try {
    if (data.surveys) {
      localStorage.setItem('surveys', JSON.stringify(data.surveys));
    }
    if (data.studentResponses) {
      localStorage.setItem('studentResponses', JSON.stringify(data.studentResponses));
    }
    
  
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};