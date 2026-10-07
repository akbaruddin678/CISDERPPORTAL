import React from "react";
import { useVoucherStateController } from "../controller/useVoucherStateController";
import VoucherView from "../view/VoucherView";

const VoucherContainer = () => {
  const state = useVoucherStateController();
  return <VoucherView {...state} />;
};

export default VoucherContainer;
