import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Tabs, Tab, Paper, Chip, Button } from "@mui/material";
import {
  Drafts,
  AssignmentTurnedIn,
  CheckCircleOutline,
  ReceiptLong,
  Paid,
  ErrorOutline,
  PersonOff,
  BarChart,
  DeleteSweep,
  PersonAdd,
  VerifiedUser,
} from "@mui/icons-material";

import { useIncompleteAdmissionsController } from "../controller/useIncompleteAdmissionsController";
import { useCompleteAdmissionsController } from "../controller/useCompleteAdmissionsController";
import { useAdmissionPipelineController } from "../controller/useAdmissionPipelineController";
import { useAdmissionStatsController } from "../controller/useAdmissionStatsController";
import { useAdmissionTrashController } from "../controller/useAdmissionTrashController";

import IncompleteAdmissionsView from "./pipeline/IncompleteAdmissionsView";
import CompleteAdmissionsView from "./pipeline/CompleteAdmissionsView";
import PipelineBucketView from "./pipeline/PipelineBucketView";
import AdmissionStatsView from "./pipeline/AdmissionStatsView";
import AdmissionTrashView from "./pipeline/AdmissionTrashView";

const TAB_CONFIG = [
  { label: "Incomplete", icon: <Drafts fontSize="small" /> },
  { label: "Complete", icon: <AssignmentTurnedIn fontSize="small" /> },
  { label: "Accepted", icon: <CheckCircleOutline fontSize="small" /> },
  { label: "Challan Generated", icon: <ReceiptLong fontSize="small" /> },
  { label: "Fee Paid", icon: <Paid fontSize="small" /> },
  { label: "Admission Complete", icon: <VerifiedUser fontSize="small" /> },
  { label: "Fee Overdue", icon: <ErrorOutline fontSize="small" /> },
  { label: "Cancelled — Non-Payment", icon: <PersonOff fontSize="small" /> },
  { label: "Stats", icon: <BarChart fontSize="small" /> },
  { label: "Trash", icon: <DeleteSweep fontSize="small" /> },
];

const AdmissionListView = () => {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  const incomplete = useIncompleteAdmissionsController();
  const complete = useCompleteAdmissionsController();
  const pipeline = useAdmissionPipelineController();
  const trash = useAdmissionTrashController();
  const stats = useAdmissionStatsController({
    draftCount: incomplete.pagination.total,
    submittedCount: complete.pagination.total,
    buckets: pipeline.buckets,
    trashCount: trash.trashRecords.length,
  });

  const tabCounts = [
    incomplete.pagination.total,
    complete.pagination.total,
    pipeline.buckets.accepted.length,
    pipeline.buckets.challanGenerated.length,
    pipeline.buckets.feePaid.length,
    pipeline.buckets.admissionComplete.length,
    pipeline.buckets.feeOverdue.length,
    pipeline.buckets.cancelledNonPayment.length,
    null,
    trash.trashRecords.length,
  ];

  return (
    <Box
      sx={{
        bgcolor: "white",
        borderRadius: 3,
        boxShadow: "0px 4px 20px rgba(0,0,0,0.05)",
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 3, pt: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 1 }}>
          <Box component="span" sx={{ fontWeight: 800, fontSize: 20 }}>Admission Process</Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<PersonAdd fontSize="small" />}
            onClick={() => navigate("/admission-office/manual-admission")}
            sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#059669", "&:hover": { bgcolor: "#047857" } }}
          >
            Manual Admission
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          {TAB_CONFIG.map((tab, i) => (
            <Tab
              key={tab.label}
              icon={tab.icon}
              iconPosition="start"
              label={
                tabCounts[i] !== null ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {tab.label}
                    <Chip label={tabCounts[i]} size="small" sx={{ height: 18, fontSize: 11 }} />
                  </Box>
                ) : (
                  tab.label
                )
              }
              sx={{ minHeight: 48, textTransform: "none", fontWeight: 600 }}
            />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ p: 3 }}>
        {activeTab === 0 && <IncompleteAdmissionsView {...incomplete} />}
        {activeTab === 1 && <CompleteAdmissionsView {...complete} />}
        {activeTab === 2 && (
          <PipelineBucketView
            {...pipeline}
            title="Accepted"
            description="Accepted applications — admission fee challan not yet generated."
            students={pipeline.buckets.accepted}
            showPrintChallan={false}
            allowDelete
            allowScopeChoice
            showScholarship
            showResendEmail
          />
        )}
        {activeTab === 3 && (
          <PipelineBucketView
            {...pipeline}
            title="Challan Generated"
            description="Accepted students with a fee challan generated, awaiting payment."
            students={pipeline.buckets.challanGenerated}
            showPrintChallan
            allowDelete
            allowScopeChoice
          />
        )}
        {activeTab === 4 && (
          <PipelineBucketView
            {...pipeline}
            title="Fee Paid"
            description="Accepted students whose admission fee has been paid."
            students={pipeline.buckets.feePaid}
            showPrintChallan
            allowDelete={false}
            showComplete
          />
        )}
        {activeTab === 5 && (
          <PipelineBucketView
            {...pipeline}
            title="Admission Complete"
            description="Fee paid, or an approved scholarship with no admission fee ever billed."
            students={pipeline.buckets.admissionComplete}
            showPrintChallan
            allowDelete={false}
            showComplete
            showScholarship
          />
        )}
        {activeTab === 6 && (
          <PipelineBucketView
            {...pipeline}
            title="Fee Overdue"
            description="Accepted students whose admission fee challan is overdue — cancelled automatically for non-payment 3 days after the due date if still unpaid."
            students={pipeline.buckets.feeOverdue}
            showPrintChallan
            allowDelete
          />
        )}
        {activeTab === 7 && (
          <PipelineBucketView
            {...pipeline}
            title="Cancelled — Non-Payment"
            description="Applications auto-cancelled after 3 unpaid days past the admission fee's due date. Re-admit to give them another chance."
            students={pipeline.buckets.cancelledNonPayment}
            showPrintChallan={false}
            allowDelete={false}
            showReAdmit
            onReAdmit={pipeline.reAdmitStudent}
            isReAdmitting={pipeline.isReAdmitting}
          />
        )}
        {activeTab === 8 && <AdmissionStatsView {...stats} />}
        {activeTab === 9 && <AdmissionTrashView {...trash} />}
      </Box>
    </Box>
  );
};

export default AdmissionListView;
