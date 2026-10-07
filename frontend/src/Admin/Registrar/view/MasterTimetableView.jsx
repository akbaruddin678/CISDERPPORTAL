import React from "react";
import { RefreshCw, ChevronDown, Calendar, X, Clock, Plus, DoorOpen } from "lucide-react";

const DEPT_PALETTE = [
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
];

const colorForDept = (dept, allDepts) => {
  const idx = allDepts.indexOf(dept);
  return DEPT_PALETTE[idx % DEPT_PALETTE.length] || "bg-slate-100 text-slate-700 border-slate-200";
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>{React.createElement(Icon, { size: 20, className: "text-white" })}</div>
    <div><p className="text-xs text-slate-500 font-medium">{label}</p><p className="text-2xl font-bold text-slate-900">{value}</p></div>
  </div>
);

const EntryModal = ({ entry, onClose, onDelete, isDeleting, allowManage = true }) => {
  if (!entry) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-slate-900">{entry.courseTitle}</h2>
            <p className="text-sm font-mono text-slate-500">{entry.courseCode}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={16} className="text-slate-500" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[["Day", entry.day], ["Slot", entry.slot], ["Room", entry.room], ["Room capacity", entry.roomCapacity || "—"], ["Section", entry.section], ["Faculty", entry.faculty], ["Department", entry.department], ["Session", entry.termName]].map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-xs text-slate-500">{k}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          {allowManage && (
            <button onClick={() => onDelete(entry.id)} disabled={isDeleting}
              className="w-full py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 transition-colors font-medium disabled:opacity-50">
              {isDeleting ? "Removing..." : "Remove From Timetable"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateEntryModal = ({ onClose, form, setForm, days, slots, assignmentOptions, isFetchingAssignments, roomOptions, isFetchingRooms, handleCreateEntry, isCreating }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Schedule Timetable Entry</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
      </div>
      <div className="p-6 space-y-3">
        <div>
          <label className="text-xs text-slate-500 font-medium">Course Assignment</label>
          <select
            value={form.courseAssignmentId} disabled={isFetchingAssignments}
            onChange={(e) => setForm((f) => ({ ...f, courseAssignmentId: e.target.value }))}
            className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white"
          >
            <option value="">{isFetchingAssignments ? "Loading..." : "Select a class"}</option>
            {assignmentOptions.map((a) => (
              <option key={a._id} value={a._id}>
                {a.courseId?.code} · {a.courseId?.title} ({a.section}) — {a.programId?.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 font-medium">Day</label>
            <select value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white">
              {days.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Time Slot</label>
            <select value={form.slot} onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white">
              {slots.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium">Room</label>
          <select
            value={form.roomId} disabled={isFetchingRooms}
            onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
            className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white"
          >
            <option value="">{isFetchingRooms ? "Loading..." : "Select a room"}</option>
            {roomOptions.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name} (capacity {r.capacity})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">Saving is blocked when the enrolled section exceeds the room's capacity.</p>
        </div>
        <button onClick={handleCreateEntry} disabled={isCreating}
          className="w-full py-2.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors font-medium disabled:opacity-50 mt-2">
          {isCreating ? "Scheduling..." : "Schedule Entry"}
        </button>
      </div>
    </div>
  </div>
);

const MasterTimetableView = ({
  grid, days, slots, isLoading, error, deptFilter, setDeptFilter, selectedDay, setSelectedDay,
  departments, selectedEntry, isModalOpen, stats, refetch, handleViewEntry, handleCloseModal,
  handleDeleteEntry, isDeleting, isCreateOpen, openCreateModal, closeCreateModal, form, setForm,
  assignmentOptions, isFetchingAssignments, roomOptions, isFetchingRooms, handleCreateEntry, isCreating,

  title = "Master Timetable",
  subtitle = "University-wide weekly schedule view across all departments.",
  allowCreate = true,
  // Optional extra dropdown filters (Exam module) — [{ label, value }], only
  // rendered when the corresponding options array is provided.
  programOptions = null,
  programFilter = "",
  setProgramFilter = () => {},
  termOptions = null,
  termFilter = "",
  setTermFilter = () => {},
  statLabels = {
    total: "Total Slots",
    departments: "Departments",
    faculty: "Faculty Active",
    rooms: "Rooms In Use",
  },
}) => {
  const activeDays = selectedDay === "All" ? days : days.filter((d) => d === selectedDay);
  const deptList = departments.filter((d) => d !== "All");

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {[
              { value: deptFilter,   onChange: setDeptFilter,   options: departments },
              { value: selectedDay,  onChange: setSelectedDay,  options: ["All", ...days] },
            ].map(({ value, onChange, options }, i) => (
              <div key={i} className="relative">
                <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none pl-3 pr-7 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white cursor-pointer">
                  {options.map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            ))}
            {programOptions && (
              <div className="relative">
                <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="appearance-none pl-3 pr-7 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white cursor-pointer">
                  <option value="">All Programs</option>
                  {programOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
            {termOptions && (
              <div className="relative">
                <select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} className="appearance-none pl-3 pr-7 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white cursor-pointer">
                  <option value="">All Sessions</option>
                  {termOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
            <button onClick={refetch} disabled={isLoading} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 disabled:opacity-50">
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
            {allowCreate && (
              <button onClick={openCreateModal} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Plus size={16} /> New Entry
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Calendar}  label={statLabels.total}       value={stats.total}       color="bg-violet-500" />
          <StatCard icon={Calendar}  label={statLabels.departments} value={stats.departments} color="bg-blue-500" />
          <StatCard icon={Clock}     label={statLabels.faculty}     value={stats.faculty}     color="bg-amber-500" />
          <StatCard icon={DoorOpen}  label={statLabels.rooms}       value={stats.rooms}       color="bg-teal-500" />
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md"><p className="text-red-700 text-sm">{error}</p></div>}

        {deptList.length > 0 && (
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs text-slate-500 font-medium">Legend:</span>
            {deptList.map((dept) => (
              <div key={dept} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded border ${colorForDept(dept, deptList)}`} />
                <span className="text-xs text-slate-600">{dept}</span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-white w-32 border-r border-slate-700">Time Slot</th>
                  {activeDays.map((d) => (
                    <th key={d} className="px-4 py-3 text-center font-semibold text-white border-r border-slate-700 last:border-r-0">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={activeDays.length + 1} className="px-6 py-12 text-center text-slate-500">Loading timetable...</td></tr>
                ) : slots.map((slot, si) => (
                  <tr key={slot} className={si % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-2 text-xs font-mono text-slate-500 border-r border-slate-200 whitespace-nowrap align-top">{slot}</td>
                    {activeDays.map((day) => {
                      const cellEntries = grid[day]?.[slot] || [];
                      return (
                        <td key={day} className="px-2 py-2 border-r border-slate-200 last:border-r-0 align-top min-w-[140px]">
                          {cellEntries.length ? (
                            <div className="space-y-1.5">
                              {cellEntries.map((entry) => (
                                <button key={entry.id} onClick={() => handleViewEntry(entry)} className={`w-full text-left px-2 py-1.5 rounded-lg border text-xs cursor-pointer hover:opacity-80 transition-opacity ${colorForDept(entry.department, deptList)}`}>
                                  <p className="font-bold truncate">{entry.courseCode} · Sec {entry.section}</p>
                                  <p className="truncate opacity-80">{entry.courseTitle}</p>
                                  <p className="truncate opacity-70 mt-0.5">{entry.faculty}</p>
                                  <p className="opacity-60">Room: {entry.room}</p>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="h-16 flex items-center justify-center">
                              <span className="text-slate-200 text-xs">—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && <EntryModal entry={selectedEntry} onClose={handleCloseModal} onDelete={handleDeleteEntry} isDeleting={isDeleting} allowManage={allowCreate} />}
      {allowCreate && isCreateOpen && (
        <CreateEntryModal
          onClose={closeCreateModal} form={form} setForm={setForm} days={days} slots={slots}
          assignmentOptions={assignmentOptions} isFetchingAssignments={isFetchingAssignments}
          roomOptions={roomOptions} isFetchingRooms={isFetchingRooms}
          handleCreateEntry={handleCreateEntry} isCreating={isCreating}
        />
      )}
    </div>
  );
};

export default MasterTimetableView;
