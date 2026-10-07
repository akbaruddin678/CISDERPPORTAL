import React from "react";
import LoginView from "../view/LoginView";
import useLoginStateController from "../controller/useLoginStateController";

const LoginContainer = () => {
  const { onSubmit, control, errors, loginLoading, AlertComponent } =
    useLoginStateController();

  return (
    <>
      <LoginView
        onSubmit={onSubmit}
        control={control}
        errors={errors}
        loginLoading={loginLoading}
      />
      <AlertComponent />
    </>
  );
};

export default LoginContainer;
