import {
  Wallet,
  PieChart,
  Receipt,
  UserSquare2,
  Award,
  FilePlus2,
  Printer,
  Building2,
  BarChart3,
  CalendarRange,
  AlarmClock,
  CreditCard,
  LucideAirVent,
  BanknoteArrowDown,
  TrendingUp,
} from "lucide-react";

export const accountantLinks = () => {
  return [
    {
      title: "Student Profiles",
      subtitle: "Academic & Financial Dossier",
      path: "/student-dossier",
      description:
        "Search and view comprehensive academic and financial records for any student.",
      icon: UserSquare2,
      accent: "#7c3aed",
      bg: "#f5f3ff",
    },
     {
      title: "New Admission",
      subtitle: "List of New Students Registered",
      path: "/student-admission",
      description:
        "View and check the admission details of newly registered students.",
      icon: UserSquare2,
      accent: "#7c3aed",
      bg: "#f5f3ff",
    },
    {
      title: "Revenue Explorer",
      subtitle: "Class → Program → Section → Student",
      path: "/revenue-explorer",
      description:
        "Drill down from whole-class monthly revenue into programs, sections, and individual students — with Tuition/Exam/Admission/Misc broken out separately and one-click links into Fee Setup, Installments, and Challan Management for any student.",
      icon: TrendingUp,
      accent: "#0f766e",
      bg: "#f0fdfa",
    },
    {
      title: "Fee Structure",
      subtitle: "Tuition & Admission Fees",
      path: "/student-fee-management",
      description:
        "Configure base tuition, admission, and miscellaneous fee structures per program.",
      icon: Wallet,
      accent: "#4f46e5",
      bg: "#eef2ff",
    },
    {
      title: "Installment Plans",
      subtitle: "Split Payment Setup",
      path: "/student-installment-management",
      description:
        "Define and manage installment schedules and payment splits for students.",
      icon: PieChart,
      accent: "#0284c7",
      bg: "#e0f2fe",
    },
    {
      title: "Challan Management",
      subtitle: "Track & Process",
      path: "/student-challan-management",
      description:
        "Track, modify, void, and manually process individual student challans.",
      icon: Receipt,
      accent: "#059669",
      bg: "#ecfdf5",
    },

    {
      title: "Scholarships & Aid",
      subtitle: "Financial Discounts",
      path: "/scholarship-plans-management",
      description:
        "Assign, track, and manage student financial aid and discount programs.",
      icon: Award,
      accent: "#d97706",
      bg: "#fffbeb",
    },
    {
      title: "Challan Requests",
      subtitle: "Incoming Queue",
      path: "/challan-request",
      description:
        "Review and approve incoming requests from students for new fee challans.",
      icon: FilePlus2,
      accent: "#0891b2",
      bg: "#ecfeff",
    },
    {
      title: "Bulk Challan Print",
      subtitle: "Challan Generation",
      path: "/generate-challan-list",
      description:
        "Bulk generate and print official fee challans for entire sessions.",
      icon: Printer,
      accent: "#4f46e5",
      bg: "#eef2ff",
    },
    {
      title: "Fines & Due Dates",
      subtitle: "Penalty Management",
      path: "/fine-managements",
      description:
        "Set and manage fine policies, due date configurations, and grace periods.",
      icon: AlarmClock,
      accent: "#e11d48",
      bg: "#fff1f2",
    },
    {
      title: "Late Fine",
      subtitle: "Fine After Due Date",
      path: "/late-fine-settings",
      description:
        "Choose how much fine is imposed after the due date. Select 0 for no fine.",
      icon: AlarmClock,
      accent: "#e11d48",
      bg: "#fff1f2",
    },
    {
      title: "Departmental Challans",
      subtitle: "By Class",
      path: "/department-challans",
      description:
        "Track challans, student involvement, and financial recovery by class.",
      icon: Building2,
      accent: "#7c3aed",
      bg: "#f5f3ff",
    },
    {
      title: "Analytics Reports",
      subtitle: "Deep Financial Insights",
      path: "/challan-reports",
      description:
        "Generate deep financial analytics, recovery metrics, and audit-ready reports.",
      icon: BarChart3,
      accent: "#1e293b",
      bg: "#f8fafc",
    },
    {
      title: "Monthly Reports",
      subtitle: "Month-by-Month Revenue",
      path: "/monthly-challan-reports",
      description:
        "Analyze monthly revenue collection, pending dues, and trend comparisons.",
      icon: CalendarRange,
      accent: "#db2777",
      bg: "#fdf2f8",
    },
    {
      title: "Payment Records",
      subtitle: "Fund Allocation & Expenses",
      path: "/payments-records",
      description:
        "Track institutional fund allocations, expenses, and incoming payment records.",
      icon: CreditCard,
      accent: "#059669",
      bg: "#ecfdf5",
    },
    {
      title: "Left Cases",
      subtitle: "Manage Student Withdrawal",
      path: "/left-caseses",
      description:
        "Manage All those Student Here that have withdraw or leave the CISD",
      icon: BanknoteArrowDown,
      accent: "#dc2626",
      bg: "#fef2f2",
    },
  ];
};
