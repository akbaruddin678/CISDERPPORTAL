import { useSelector } from "react-redux";
import { BookOpen, Award, Clock } from "lucide-react";

const DashboardView = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">
        Welcome back, {user?.name?.split(" ")[0]}! 👋
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">
              Enrolled Courses
            </p>
            <p className="text-2xl font-bold text-slate-900">6</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Current CGPA</p>
            <p className="text-2xl font-bold text-slate-900">3.84</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Upcoming Exams</p>
            <p className="text-2xl font-bold text-slate-900">2</p>
          </div>
        </div>
      </div>

      {/* Courses Area */}
      <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">
        Your Courses
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((course) => (
          <div
            key={course}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 flex flex-col justify-end">
              <span className="text-white/80 text-sm font-bold tracking-wider">
                CS-10{course}
              </span>
              <h3 className="text-white text-lg font-bold leading-tight">
                Introduction to Programming
              </h3>
            </div>
            <div className="p-6">
              <p className="text-slate-500 text-sm mb-4">Prof. Sarah Jenkins</p>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "65%" }}
                ></div>
              </div>
              <p className="text-xs text-right text-slate-500 font-medium">
                65% Completed
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardView;
