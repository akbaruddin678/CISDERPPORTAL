import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import "./examWorkspace.css";

const ExamModuleFrame = ({ title, children }) => {
  const location = useLocation();

  return (
    <div className="exam-workspace">
      <nav className="exam-workspace__context" aria-label="Exam module breadcrumb">
        <div className="exam-workspace__context-inner">
          <Link to="/exam/dashboard" className="exam-workspace__home">
            <LayoutDashboard size={15} aria-hidden="true" />
            <span>Examinations</span>
          </Link>
          <ChevronRight size={14} className="exam-workspace__separator" aria-hidden="true" />
          <span className="exam-workspace__current" aria-current="page">{title}</span>
          {location.pathname !== "/exam/dashboard" && (
            <Link to="/exam/dashboard" className="exam-workspace__all-modules">
              All exam modules
            </Link>
          )}
        </div>
      </nav>
      <main className="exam-workspace__content">{children}</main>
    </div>
  );
};

export default ExamModuleFrame;
