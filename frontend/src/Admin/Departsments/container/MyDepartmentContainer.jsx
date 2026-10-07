import React from "react";
import useMyDepartmentController from "../controller/useMyDepartmentController";
import MyDepartmentView from "../view/MyDepartmentView";

const MyDepartmentContainer = () => {
  const controllerProps = useMyDepartmentController();

  return <MyDepartmentView {...controllerProps} />;
};

export default MyDepartmentContainer;
