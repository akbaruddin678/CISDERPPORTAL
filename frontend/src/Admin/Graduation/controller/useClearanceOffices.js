import { useEffect, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {
  useGetOfficesQuery,
  useCreateOfficeMutation,
  useUpdateOfficeMutation,
  useSearchOfficerCandidatesQuery,
} from "../api/graduationApi";
import { errorText, useToast } from "../common/graduationHelpers";

const useClearanceOffices = () => {
  const [toast, notify] = useToast();
  const { data, isFetching, error } = useGetOfficesQuery();
  const [createOffice, { isLoading: isCreating }] = useCreateOfficeMutation();
  const [updateOffice, { isLoading: isUpdating }] = useUpdateOfficeMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  // Officer picker: which office is currently adding someone, and the search.
  const [pickerOfficeId, setPickerOfficeId] = useState(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(pickerQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [pickerQuery]);
  const { data: candidatesRes, isFetching: isSearching } = useSearchOfficerCandidatesQuery(
    pickerOfficeId && debounced.length >= 2 ? debounced : skipToken,
  );

  const offices = data?.data || [];

  const save = async (fn, payload, okMessage) => {
    try {
      await fn(payload).unwrap();
      notify(okMessage);
      return true;
    } catch (err) {
      notify(errorText(err), "error");
      return false;
    }
  };

  return {
    toast,
    offices,
    isLoading: isFetching && !offices.length,
    errorMessage: error ? errorText(error) : "",
    isBusy: isCreating || isUpdating,

    showForm,
    openForm: () => setShowForm(true),
    closeForm: () => {
      setShowForm(false);
      setForm({ name: "", description: "" });
    },
    form,
    setFormField: (key, value) => setForm((prev) => ({ ...prev, [key]: value })),
    submitForm: async () => {
      const ok = await save(createOffice, form, "Office added.");
      if (ok) {
        setShowForm(false);
        setForm({ name: "", description: "" });
      }
    },

    toggleActive: (office) =>
      save(updateOffice, { id: office._id, isActive: !office.isActive }, office.isActive ? "Office deactivated." : "Office activated."),

    pickerOfficeId,
    openPicker: (id) => {
      setPickerOfficeId(id);
      setPickerQuery("");
    },
    closePicker: () => {
      setPickerOfficeId(null);
      setPickerQuery("");
    },
    pickerQuery,
    setPickerQuery,
    pickerResults: candidatesRes?.data || [],
    isSearching,
    addOfficer: async (office, user) => {
      const ids = [...office.officers.map((o) => o._id), user._id];
      const ok = await save(updateOffice, { id: office._id, officerUserIds: ids }, `${user.email} can now clear ${office.name}.`);
      if (ok) {
        setPickerOfficeId(null);
        setPickerQuery("");
      }
    },
    removeOfficer: (office, userId) =>
      save(
        updateOffice,
        { id: office._id, officerUserIds: office.officers.map((o) => o._id).filter((id) => id !== userId) },
        "Officer removed.",
      ),
  };
};

export default useClearanceOffices;
