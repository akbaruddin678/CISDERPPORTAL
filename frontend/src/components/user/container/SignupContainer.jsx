import React from "react";
import useSignUpStateController from "../controller/useSignUpStateController";
import SignUpView from "../view/SignupView";

const SignUpContainer = () => {
  const controller = useSignUpStateController();

  return <SignUpView {...controller} />;
};

export default SignUpContainer;
