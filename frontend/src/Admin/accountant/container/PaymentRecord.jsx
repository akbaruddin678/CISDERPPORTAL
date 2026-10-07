import React from "react";
import PaymentRecordController from "../controller/PaymentRecordController";
import PaymentRecordView from "../view/PaymentRecordView";

const PaymentRecordContainer = () => {
  return (
    <PaymentRecordController>
      {(props) => <PaymentRecordView {...props} />}
    </PaymentRecordController>
  );
};

export default PaymentRecordContainer;
