import React from "react";
import { useAdminHomeController } from "../controller/useAdminHomeController";
import AdminHomeView from "../view/AdminHomeView";

const AdminHomeContainer = () => {
  const controller = useAdminHomeController();
  return <AdminHomeView {...controller} />;
};

export default AdminHomeContainer;
