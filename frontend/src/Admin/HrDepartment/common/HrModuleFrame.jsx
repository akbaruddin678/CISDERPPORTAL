import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import "./hrWorkspace.css";

const HrModuleFrame = ({ title, children }) => {
  const location = useLocation();

  return (
    <div className="hr-workspace">
      <nav className="hr-workspace__context" aria-label="Human resources module breadcrumb">
        <div className="hr-workspace__context-inner">
          <Link to="/" className="hr-workspace__home">
            <LayoutDashboard size={15} aria-hidden="true" />
            <span>Human resources</span>
          </Link>
          <ChevronRight size={14} className="hr-workspace__separator" aria-hidden="true" />
          <span className="hr-workspace__current" aria-current="page">{title}</span>
          {location.pathname !== "/" && <Link to="/" className="hr-workspace__all-modules">All HR modules</Link>}
        </div>
      </nav>
      <main className="hr-workspace__content">{children}</main>
    </div>
  );
};

export default HrModuleFrame;
