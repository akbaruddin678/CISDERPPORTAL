import React from "react";
import LinkCard from "../../../shared/LinkCard/container/CardContainer.jsx";
import {
  Boxes,
  Layers,
  AlertTriangle,
  PackageCheck,
  DoorOpen,
  Armchair,
  Pencil,
  MonitorSmartphone,
  UserCog,
} from "lucide-react";

const StatTile = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-xl ${bg} ${color} flex-shrink-0`}>
      <Icon size={20} strokeWidth={2.25} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-1.5 truncate">{label}</p>
    </div>
  </div>
);

const MODULES = [
  {
    title: "Rooms & Spaces",
    description: "Classrooms, labs, offices and halls — capacity, location, and usage.",
    path: "/hr/inventory/rooms",
    category: "Room",
    icon: <DoorOpen size={24} strokeWidth={2} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    accent: "bg-blue-600",
  },
  {
    title: "Furniture & Fixtures",
    description: "Tables, chairs, cabinets and other fixed assets across campus.",
    path: "/hr/inventory/furniture",
    category: "Furniture",
    icon: <Armchair size={24} strokeWidth={2} />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    accent: "bg-amber-600",
  },
  {
    title: "Stationery & Consumables",
    description: "Pens, paper, markers and other supplies — with stock and reorder alerts.",
    path: "/hr/inventory/stationery",
    category: "Stationery",
    icon: <Pencil size={24} strokeWidth={2} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    accent: "bg-emerald-600",
  },
  {
    title: "Equipment & Electronics",
    description: "Computers, projectors, printers and other trackable equipment.",
    path: "/hr/inventory/equipment",
    category: "Electronics",
    icon: <MonitorSmartphone size={24} strokeWidth={2} />,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    accent: "bg-indigo-600",
  },
  {
    title: "Staff Asset Assignment",
    description: "Issue items against a staff record and track returns, losses, and damage.",
    path: "/hr/inventory/assignments",
    icon: <UserCog size={24} strokeWidth={2} />,
    color: "text-rose-600",
    bg: "bg-rose-50",
    accent: "bg-rose-600",
  },
];

const InventoryDashboardView = ({ stats, isLoading }) => {
  return (
    <div className="min-h-screen bg-slate-100 py-10 px-6 sm:px-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-300 pb-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              Inventory Management
            </h1>
            <p className="text-base text-slate-600 font-medium max-w-2xl">
              Every institutional asset — from rooms to ballpoint pens — tracked in one place, and issued against staff records.
            </p>
          </div>
        </header>

        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 mb-3">
            Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatTile icon={Boxes} label="Item Types" value={isLoading ? "—" : stats.totalItemTypes} color="text-blue-600" bg="bg-blue-100" />
            <StatTile icon={Layers} label="Total Units" value={isLoading ? "—" : stats.totalUnits} color="text-slate-600" bg="bg-slate-200" />
            <StatTile icon={PackageCheck} label="Assigned Units" value={isLoading ? "—" : stats.assignedUnits} color="text-emerald-600" bg="bg-emerald-100" />
            <StatTile icon={UserCog} label="Active Assignments" value={isLoading ? "—" : stats.activeAssignments} color="text-indigo-600" bg="bg-indigo-100" />
            <StatTile icon={AlertTriangle} label="Low Stock Alerts" value={isLoading ? "—" : stats.lowStockCount} color="text-red-600" bg="bg-red-100" />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 mb-3">
            Manage Inventory
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULES.map((mod) => (
              <div key={mod.path} className="h-full relative">
                <LinkCard
                  title={mod.title}
                  description={mod.description}
                  path={mod.path}
                  icon={mod.icon}
                  color={mod.color}
                  bg={mod.bg}
                  accent={mod.accent}
                />
                {mod.category && !isLoading && stats.byCategory?.[mod.category] && (
                  <span className="absolute top-4 right-4 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    {stats.byCategory[mod.category].count} item{stats.byCategory[mod.category].count === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default InventoryDashboardView;
