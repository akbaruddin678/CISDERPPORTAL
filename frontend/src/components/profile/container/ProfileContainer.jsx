import React from "react";
import useProfileController from "../controller/useProfileController";
import ProfileView from "../view/ProfileView";
import AdminProfile from "../../../Admin/shared/view/AdminProfile";

const ProfileContainer = () => {
  const controller = useProfileController();
 
  if (controller?.userData?.roles[0] === "applicant") {
    return <ProfileView {...controller} />;
  }

  return <AdminProfile userData={controller.userData} />;
};

export default ProfileContainer;
