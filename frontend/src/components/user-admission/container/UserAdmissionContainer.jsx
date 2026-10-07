import React from "react";
import useUserAdmissionController from "../controller/useUserAdmissionController";
import UserAdmissionView from "../view/UserAdmissionView";

const UserAdmissionContainer = () => {
  const controller = useUserAdmissionController();

  return (
    <>
      <UserAdmissionView {...controller} />
    </>
  );
};

export default UserAdmissionContainer;