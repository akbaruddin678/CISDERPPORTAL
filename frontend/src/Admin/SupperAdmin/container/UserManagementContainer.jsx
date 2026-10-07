import React from "react";
import { useUserManagementController } from "../controller/useUserManagementController";
import { UserManagementView } from "../view/users/UserManagementView"; 

const UserManagementContainer = () => {
  const controller = useUserManagementController();
  return <UserManagementView {...controller} />;
};

export default UserManagementContainer;
