import React from "react";
import { useParams } from "react-router-dom";
import useAdmissionDetailsController from "../controller/useAdmissionDetailsController";
import AdmissionDetailView from "../view/AdmissionDetailView";

// AdmissionDetailsContainer.jsx
const AdmissionDetailsContainer = () => {
  const { admissionId } = useParams();
  
  
  
  const { 
    data, 
    loading, 
    error, 
    refetch,
    departments = [], // Add default value
    programs = [],    // Add default value
    semesters = [],   // Add default value
    sessions = [],    // Add default value
    loadingCatalog,
    loadingSemesters,
    promoteStudent,
    fetchSemestersByProgram
  } = useAdmissionDetailsController(admissionId);

  // Safe mapping with fallbacks
  const safeDepartments = Array.isArray(departments) ? departments : [];
  const safePrograms = Array.isArray(programs) ? programs : [];
  const safeSemesters = Array.isArray(semesters) ? semesters : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];

 


  // Handle promote action
  const handlePromote = async (promotionData) => {
   
    try {
      const result = await promoteStudent(promotionData);
     
      return result;
    } catch (error) {
     
      throw error;
    }
  };



  return (
    <AdmissionDetailView
      // Admission data
      admissionData={data ? { success: true, data } : null}
      isLoading={loading}
      isError={error}
      refetch={refetch}
      
      // Catalog data - use safe arrays
      departments={safeDepartments}
      programs={safePrograms}
      semesters={safeSemesters}
      sessions={safeSessions}
      loadingCatalog={loadingCatalog}
      loadingSemesters={loadingSemesters}
      
      // Actions
      onPromote={handlePromote}
      fetchSemestersByProgram={fetchSemestersByProgram}
    />
  );
};

export default AdmissionDetailsContainer;