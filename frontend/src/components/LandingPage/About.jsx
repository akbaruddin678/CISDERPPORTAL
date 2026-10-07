import React from "react";
import cisdLogo from "../../assets/cisd-logo.png";

const About = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Main heading */}
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          ABOUT CISD – CISD, ISLAMABAD
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left column - Image */}
          <div>
            <div className="rounded-lg overflow-hidden">
              <img src={cisdLogo} alt="About CISD" className="w-full h-auto" />
            </div>
          </div>

          {/* Right column - Text and stats */}
          <div className="space-y-8">
            {/* Description text */}
            <div>
              <p className="text-gray-700 leading-relaxed">
                CISD (CISD) is a progressive,
                HEC-recognized higher education institution based in Sector
                B-17, Islamabad, offering a diverse portfolio of academic
                degrees and internationally aligned skill-based training
                programs. Established by the CAM Foundation (Registered under
                Trust Act-II 1882), CISD is committed to providing accessible,
                career-focused, and transformative education to empower
                Pakistan's youth and drive national development.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Individual Program */}
              {/* <div className="text-center p-6 border border-gray-200 rounded-lg">
                <div className="text-4xl font-bold text-[#E81D3A] mb-2">90</div>
                <div className="text-lg font-semibold text-gray-800">
                  Individual Program
                </div>
              </div> */}

              {/* Satisfied Parents */}
              {/* <div className="text-center p-6 border border-gray-200 rounded-lg">
                <div className="text-4xl font-bold text-[#E81D3A] mb-2">
                  100%
                </div>
                <div className="text-lg font-semibold text-gray-800">
                  Satisfied Parents
                </div>
              </div> */}

              {/* Award Winner */}
              {/* <div className="text-center p-6 border border-gray-200 rounded-lg">
                <div className="text-4xl font-bold text-[#E81D3A] mb-2">
                  5K+
                </div>
                <div className="text-lg font-semibold text-gray-800">
                  Award Winner
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
