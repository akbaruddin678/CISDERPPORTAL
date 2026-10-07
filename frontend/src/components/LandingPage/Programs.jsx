import React, { useState } from "react";
import {
  BookOpen,
  Users,
  Award,
  UserCheck,
  GraduationCap,
  Stethoscope,
  Pill,
  Brain,
  User,
  Book,
  Heart,
  Cpu,
  FlaskConical,
  Microscope,
} from "lucide-react";

const Programs = () => {
  const [activeTab, setActiveTab] = useState("undergraduate");

  // Undergraduate Degrees Programs
  const undergraduatePrograms = [
    { name: "BS Nursing", icon: Stethoscope },
    { name: "Doctor of Pharmacy (Pharm-D)", icon: Pill },
    { name: "Doctor of Physical Therapy (DPT)", icon: Heart },
    { name: "BS English", icon: User },
    { name: "BS Psychology", icon: Brain },
    { name: "BS Computer Science (BSCS)", icon: Cpu },
  ];

  // Technical & Allied Health Diploma Programs
  const technicalPrograms = [
    { name: "Diploma in Nursing", icon: Stethoscope },
    { name: "Medical Laboratory Technology", icon: Microscope },
    { name: "Radiology & Imaging Technology", icon: FlaskConical },
    { name: "Operation Theater Technology", icon: Heart },
    { name: "Dental Hygiene", icon: User },
    { name: "Pharmacy Technician", icon: Pill },
    { name: "Physical Therapy Assistant", icon: Heart },
    { name: "Healthcare Administration", icon: Book },
  ];

  return (
    <div className="min-h-screen bg-white p-8">
      {/* First Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Best Online Courses
        </h1>
        <h2 className="text-3xl font-bold text-[#E81D3A] mb-2">
          Academic Excellence at CISD
        </h2>
        <p className="text-2xl font-semibold text-gray-700">
          Build Your Future Here!
        </p>
      </div>

      {/* Description and Button (Image Removed) */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="space-y-8">
          {/* Description */}
          <div>
            <p className="text-xl text-gray-700 leading-relaxed">
              Our programs are designed to help students discover their
              strengths, gain practical experience, and graduate with confidence
              in the fields of medicine, engineering, and technology.
            </p>
          </div>

          {/* CTA Button */}
          <div>
            <button className="bg-[#E81D3A] hover:bg-[#d01932] text-white font-bold py-3 px-8 rounded-md text-lg transition-colors">
              GET ADMISSION
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row - Horizontal */}
      <div className="max-w-6xl mx-auto mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Programs */}
          <div className="p-6 border border-gray-200 rounded-lg text-center">
            <div className="text-4xl font-bold text-[#E81D3A] mb-2">10+</div>
            <div className="flex items-center justify-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-600" />
              <div className="text-xl font-semibold text-gray-800">
                Programs
              </div>
            </div>
          </div>

          {/* Teachers */}
          <div className="p-6 border border-gray-200 rounded-lg text-center">
            <div className="text-4xl font-bold text-[#E81D3A] mb-2">200+</div>
            <div className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <div className="text-xl font-semibold text-gray-800">
                Teachers
              </div>
            </div>
          </div>

          {/* Certification */}
          <div className="p-6 border border-gray-200 rounded-lg text-center">
            <div className="text-4xl font-bold text-[#E81D3A] mb-2">100%</div>
            <div className="flex items-center justify-center gap-2">
              <Award className="w-5 h-5 text-gray-600" />
              <div className="text-xl font-semibold text-gray-800">
                Certification
              </div>
            </div>
          </div>

          {/* Membership */}
          <div className="p-6 border border-gray-200 rounded-lg text-center">
            <div className="text-4xl font-bold text-[#E81D3A] mb-2">9k+</div>
            <div className="flex items-center justify-center gap-2">
              <UserCheck className="w-5 h-5 text-gray-600" />
              <div className="text-xl font-semibold text-gray-800">
                Membership
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Programs Section */}
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            PROGRAMS THAT SHAPE CAREERS
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            CISD offers a wide range of degree and diploma programs approved by
            government authorities and aligned with current job market demands.
          </p>
        </div>

        {/* Tab Buttons - ONLY 2 TABS */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center">
          <button
            onClick={() => setActiveTab("undergraduate")}
            className={`px-8 py-4 rounded-lg text-lg font-bold transition-colors ${
              activeTab === "undergraduate"
                ? "bg-[#E81D3A] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 justify-center">
              <GraduationCap className="w-6 h-6" />
              Undergraduate Degrees (BS)
            </div>
          </button>

          <button
            onClick={() => setActiveTab("technical")}
            className={`px-8 py-4 rounded-lg text-lg font-bold transition-colors ${
              activeTab === "technical"
                ? "bg-[#E81D3A] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 justify-center">
              <Stethoscope className="w-6 h-6" />
              Technical & Allied Health Diplomas
            </div>
          </button>
        </div>

        {/* Program Content based on Active Tab */}
        <div className="mb-8">
          {activeTab === "undergraduate" && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-[#E81D3A]" />
                Undergraduate Degree Programs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {undergraduatePrograms.map((program, index) => {
                  const Icon = program.icon;
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-[#E81D3A]/10 p-2 rounded-lg">
                          <Icon className="w-6 h-6 text-[#E81D3A]" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg">
                          {program.name}
                        </h4>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Comprehensive program with modern curriculum and
                        practical training.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "technical" && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <Stethoscope className="w-8 h-8 text-[#E81D3A]" />
                Technical & Allied Health Diploma Programs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {technicalPrograms.map((program, index) => {
                  const Icon = program.icon;
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-[#E81D3A]/10 p-2 rounded-lg">
                          <Icon className="w-6 h-6 text-[#E81D3A]" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg">
                          {program.name}
                        </h4>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Specialized diploma program focused on practical skills
                        and hands-on training.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Additional Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            * All programs are approved by relevant government authorities and
            accredited institutions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Programs;