import React from "react";
import { useFeeAnalyticsController } from "../controller/useFeeAnalyticsController";
import { FeeAnalyticsView } from "../view/FeeAnalyticsView";

const FeeAnalyticsContainer = () => {
  const controller = useFeeAnalyticsController();

  return <FeeAnalyticsView {...controller} />;
};

export default FeeAnalyticsContainer;
