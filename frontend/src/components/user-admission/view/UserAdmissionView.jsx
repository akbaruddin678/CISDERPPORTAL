import React, { useState } from "react";
import StepperIndicator from "./StepperIndicator";
import PersonalInfoForm from "./PersonalInfoForm";
import EducationInfoForm from "./EducationInfoForm";
import DocumentUploadForm from "./DocumentUploadForm";
import DeclarationForm from "./DeclarationForm";
import ReviewForm from "./ReviewForm";

const UserAdmissionView = ({
  step,
  totalSteps,
  goNext,
  goBack,
  submitting,
  declaration,
  personalInfo,
  educationDetails,
  documentUpload, // Contains: control, errors, setValue, watch, getValues...
  handleFinalSubmit,
}) => {
  const [showReview, setShowReview] = useState(false);

  // --- HELPER: Safely extract data for Review Form ---
  const getSafeData = (controller) => {
    // If controller is missing or doesn't have getValues, return empty object
    if (!controller || typeof controller.getValues !== "function") return {};
    return controller.getValues();
  };

  const handleReviewAndSubmit = async () => {
    const isValid = await declaration.validateStep();
    if (!isValid) return;

    const data = getSafeData(declaration);
    if (data.agreeDeclaration !== "yes") return;

    setShowReview(true);
  };

  const handleConfirmSubmit = () => {
    setShowReview(false);
    handleFinalSubmit();
  };

  const stepTitles = {
    1: "Personal Info",
    2: "Education",
    3: "Documents",
    4: "Declaration",
  };

  // Full Page Loader
  const FullPageLoader = () => (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-white font-medium">Processing...</p>
    </div>
  );

  // --- SHOW REVIEW FORM ---
  if (showReview) {
    return (
      <>
        {submitting && <FullPageLoader />}
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden p-8">
            <ReviewForm
              personalInfo={getSafeData(personalInfo)}
              educationDetails={getSafeData(educationDetails)}
              documentUpload={getSafeData(documentUpload)}
              declaration={getSafeData(declaration)}
              onConfirm={handleConfirmSubmit}
              onCancel={() => setShowReview(false)}
              submitting={submitting}
            />
          </div>
        </div>
      </>
    );
  }

  // --- MAIN WIZARD ---
  return (
    <>
      {submitting && <FullPageLoader />}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-8 py-6 text-white flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Admission Application</h1>
              <p className="text-blue-100 text-sm mt-1">
                Step {step}: {stepTitles[step]}
              </p>
            </div>
            <div className="hidden md:block bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
              {step < totalSteps ? "Draft" : "Finalizing"}
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <StepperIndicator currentStep={step} totalSteps={totalSteps} />
            </div>

            <div className="min-h-[400px]">
              {step === 1 && (
                <PersonalInfoForm
                  control={personalInfo.control}
                  errors={personalInfo.errors}
                  watch={personalInfo.watch}
                  setValue={personalInfo.setValue}
                  getValues={personalInfo.getValues}
                />
              )}
              {step === 2 && (
                <EducationInfoForm
                  control={educationDetails.control}
                  errors={educationDetails.errors}
                  fields={educationDetails.fields}
                  addEducation={educationDetails.addEducation}
                  removeEducation={educationDetails.removeEducation}
                  watch={educationDetails.watch}
                  setValue={educationDetails.setValue}
                />
              )}
              {step === 3 && (
                <DocumentUploadForm
                  control={documentUpload.control}
                  errors={documentUpload.errors}
                  watch={documentUpload.watch}
                  setValue={documentUpload.setValue}
                  getValues={documentUpload.getValues}
                  educationDetails={
                    getSafeData(educationDetails).educationDetails || []
                  }
                />
              )}
              {step === 4 && (
                <DeclarationForm
                  control={declaration.control}
                  errors={declaration.errors}
                  watch={declaration.watch}
                  setValue={declaration.setValue}
                />
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between">
              <div>
                {step > 1 && (
                  <button
                    onClick={goBack}
                    disabled={submitting}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                )}
              </div>
              <button
                onClick={step === totalSteps ? handleReviewAndSubmit : goNext}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md disabled:opacity-50"
                disabled={submitting}
              >
                {step === totalSteps ? "Review & Submit" : "Save & Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserAdmissionView;
