import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useGetCampaignsQuery, useCreateCampaignMutation } from "../api/admissionCampaignApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// Simplified on purpose: a campaign is just a named 10-day admission
// window. No seats/eligibility config, no scoring — the public landing
// page announces whichever campaign is currently active.
export const useAdmissionCampaignsController = () => {
  const { openAlert } = useGlobalAlert();

  const { data: campaignsRes, isFetching, refetch } = useGetCampaignsQuery();
  const campaigns = useMemo(() => extractArray(campaignsRes), [campaignsRes]);

  const [createCampaign, { isLoading: isCreating }] = useCreateCampaignMutation();

  const [title, setTitle] = useState("");

  const stats = useMemo(
    () => ({
      total: campaigns.length,
      active: campaigns.filter((c) => c.isActive).length,
    }),
    [campaigns],
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      return openAlert({ message: "Please enter a session title.", severity: "warning" });
    }
    try {
      await createCampaign({ title: title.trim() }).unwrap();
      openAlert({ message: "Admission campaign created.", severity: "success" });
      setTitle("");
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to create campaign.", severity: "error" });
    }
  };

  return {
    campaigns,
    isFetching,
    refetch,
    stats,
    title,
    setTitle,
    handleCreate,
    isCreating,
  };
};
