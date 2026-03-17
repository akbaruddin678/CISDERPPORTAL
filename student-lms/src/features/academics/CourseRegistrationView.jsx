import React from "react";
import StudentRegistrationPortal from "./StudentRegistrationPortal";
import {
  useGetAvailableCoursesQuery,
  useRegisterForCoursesMutation,
} from "./academicApi";
import { useNavigate } from "react-router-dom";

const CourseRegistrationView = () => {
  const navigate = useNavigate();

  // 1. Fetch data automatically using the student's auth token
  const { data: coursesRes, isLoading } = useGetAvailableCoursesQuery();
  const [registerCourses, { isLoading: isSubmitting }] =
    useRegisterForCoursesMutation();

  const availableCourses = coursesRes?.data || [];

  // 2. Handle Submission
  const handleSubmit = async (selectedCourseIds) => {
    try {
      await registerCourses(selectedCourseIds).unwrap();
      alert("Registration Successful!");
      navigate("/dashboard"); // Redirect after success
    } catch (error) {
      alert(error?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <StudentRegistrationPortal
      availableCourses={availableCourses}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onSubmitRegistration={handleSubmit}
    />
  );
};

export default CourseRegistrationView;
