import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import "./registrarWorkspace.css";

const RegistrarModuleFrame = ({ title, children }) => {
  const location = useLocation();

  return (
    <div className="registrar-workspace">
      <nav className="registrar-workspace__context" aria-label="Registrar module breadcrumb">
        <div className="registrar-workspace__context-inner">
          <Link to="/registrar/dashboard" className="registrar-workspace__home">
            <LayoutDashboard size={15} aria-hidden="true" />
            <span>Registrar</span>
          </Link>
          <ChevronRight size={14} className="registrar-workspace__separator" aria-hidden="true" />
          <span className="registrar-workspace__current" aria-current="page">{title}</span>
          {location.pathname !== "/registrar/dashboard" && (
            <Link to="/registrar/dashboard" className="registrar-workspace__all-modules">
              All registrar modules
            </Link>
          )}
        </div>
      </nav>
      <main className="registrar-workspace__content">{children}</main>
    </div>
  );
};

export default RegistrarModuleFrame;
