import React from "react";
import {
  Calendar,
  Users,
  Trophy,
  BookOpen,
  Mic,
  Camera,
  Heart,
  FlaskConical,
  Stethoscope,
  Cpu,
  Atom,
  Brain,
  GraduationCap,
} from "lucide-react";

const CampusLife = () => {
  // Campus activities related to programs
  const campusActivities = [
    {
      title: "Medical Simulation Labs",
      description: "Hands-on training for Nursing, Pharmacy, and DPT students in state-of-the-art simulation centers.",
      icon: Stethoscope,
      programs: ["BS Nursing", "Doctor of Pharmacy", "DPT", "Diploma in Nursing"],
    },
    {
      title: "Tech Innovation Hub",
      description: "Dedicated space for Computer Science and Physics students to work on projects and research.",
      icon: Cpu,
      programs: ["BS Computer Science", "BS Physics"],
    },
    {
      title: "Psychology Clinic",
      description: "Real-world counseling experience for Psychology students under faculty supervision.",
      icon: Brain,
      programs: ["BS Psychology"],
    },
    {
      title: "Teaching Practicum",
      description: "Classroom experience and teaching practice for Education students in partner schools.",
      icon: BookOpen,
      programs: ["BS Education"],
    },
    {
      title: "Research Symposium",
      description: "Annual showcase of student research across all programs with industry partnerships.",
      icon: FlaskConical,
      programs: ["All Programs"],
    },
  ];

  // Student clubs and organizations
  const studentClubs = [
    {
      name: "Medical Students Association",
      members: "300+",
      forPrograms: ["BS Nursing", "Pharm-D", "DPT", "Diploma Programs"],
    },
    {
      name: "Tech & Innovation Club",
      members: "150+",
      forPrograms: ["BSCS", "BS Physics"],
    },
    {
      name: "Future Educators Society",
      members: "120+",
      forPrograms: ["BS Education"],
    },
    {
      name: "Psychology Research Group",
      members: "90+",
      forPrograms: ["BS Psychology"],
    },
    {
      name: "English Literary Society",
      members: "80+",
      forPrograms: ["BS English"],
    },
  ];

  // Campus facilities
  const campusFacilities = [
    {
      name: "Modern Library",
      description: "24/7 access with digital resources, study rooms, and program-specific collections",
      capacity: "500 seats",
      icon: BookOpen,
    },
    {
      name: "Sports Complex",
      description: "Indoor gym, basketball court, and fitness center for student wellness",
      capacity: "Multi-sport facility",
      icon: Trophy,
    },
    {
      name: "Student Center",
      description: "Hub for student activities, club meetings, and social events",
      capacity: "Various event spaces",
      icon: Users,
    },
    {
      name: "Cafeteria & Food Court",
      description: "Multiple dining options with healthy meal choices",
      capacity: "300+ seating",
      icon: Heart,
    },
  ];

  // Upcoming events
  const upcomingEvents = [
    {
      date: "March 15, 2024",
      title: "Health Sciences Career Fair",
      description: "Connect with hospitals and healthcare providers",
      forPrograms: "Medical & Allied Health Programs",
      icon: Stethoscope,
    },
    {
      date: "March 22, 2024",
      title: "Tech Innovation Challenge",
      description: "Annual coding and project competition",
      forPrograms: "Computer Science & Technology Programs",
      icon: Cpu,
    },
    {
      date: "April 5, 2024",
      title: "Education Conference",
      description: "Workshops for future educators",
      forPrograms: "BS Education",
      icon: GraduationCap,
    },
    {
      date: "April 12, 2024",
      title: "Psychology Symposium",
      description: "Research presentations and guest speakers",
      forPrograms: "BS Psychology",
      icon: Brain,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Campus Life at CISD
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience a vibrant campus life that complements your academic journey. 
          From program-specific activities to general campus events, there's always something happening.
        </p>
      </div>

      {/* Program-Specific Activities */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-[#E81D3A]" />
          Program-Specific Activities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campusActivities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#E81D3A]/10 p-2 rounded-lg">
                    <Icon className="w-6 h-6 text-[#E81D3A]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {activity.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">{activity.description}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Relevant Programs:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activity.programs.map((program, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                      >
                        {program}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Organizations */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <Users className="w-8 h-8 text-[#E81D3A]" />
          Student Organizations & Clubs
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {studentClubs.map((club, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {club.name}
                </h3>
                <span className="bg-[#E81D3A] text-white text-sm font-bold px-3 py-1 rounded-full">
                  {club.members} members
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  For students in:
                </p>
                <div className="flex flex-wrap gap-2">
                  {club.forPrograms.map((program, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
                    >
                      {program}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campus Facilities */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-[#E81D3A]" />
          Campus Facilities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {campusFacilities.map((facility, index) => {
            const Icon = facility.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center"
              >
                <div className="inline-block bg-[#E81D3A]/10 p-3 rounded-full mb-4">
                  <Icon className="w-8 h-8 text-[#E81D3A]" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {facility.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {facility.description}
                </p>
                <div className="text-sm text-gray-700 font-medium">
                  Capacity: {facility.capacity}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-[#E81D3A]" />
          Campus Events
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {upcomingEvents.map((event, index) => {
            const Icon = event.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-[#E81D3A]/10 p-3 rounded-lg">
                    <Icon className="w-6 h-6 text-[#E81D3A]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        {event.title}
                      </h3>
                      <span className="text-sm font-semibold text-[#E81D3A] bg-[#E81D3A]/10 px-3 py-1 rounded-full">
                        {event.date}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{event.description}</p>
                    <div className="text-sm font-medium text-gray-700">
                      <span className="font-bold">For:</span> {event.forPrograms}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campus Life CTA */}
      <div className="max-w-6xl mx-auto mt-16 bg-gradient-to-r from-[#E81D3A] to-[#c21830] rounded-xl p-8 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Join Our Vibrant Campus Community
        </h2>
        <p className="text-lg mb-6 max-w-2xl mx-auto">
          Whether you're in medical sciences, technology, education, or humanities, 
          you'll find your place in our diverse and supportive campus environment.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-[#E81D3A] hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors">
            View Campus Tour
          </button>
          <button className="bg-transparent border-2 border-white hover:bg-white/10 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            Contact Student Affairs
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampusLife;