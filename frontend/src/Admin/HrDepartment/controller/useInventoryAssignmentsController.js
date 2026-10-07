import { useMemo, useState } from "react";
import {
  useGetAllStaffQuery,
  useGetInventoryItemsQuery,
  useGetInventoryAssignmentsQuery,
  useAssignInventoryItemMutation,
  useReturnInventoryItemMutation,
} from "../api/HrApi";

const emptyIssueForm = {
  staffId: "",
  itemId: "",
  quantity: 1,
  expectedReturnDate: "",
  conditionAtIssue: "",
  remarks: "",
};

export const useInventoryAssignmentsController = () => {
  const [tab, setTab] = useState("Active"); // "Active" | "History"
  const [staffQuery, setStaffQuery] = useState("");
  const [itemQuery, setItemQuery] = useState("");

  const { data: staffRes, isFetching: isFetchingStaff } = useGetAllStaffQuery();
  const staff = useMemo(() => staffRes?.data || [], [staffRes]);

  const { data: itemsRes, isFetching: isFetchingItems } = useGetInventoryItemsQuery({});
  const items = useMemo(() => itemsRes?.data || [], [itemsRes]);
  const assignableItems = useMemo(() => items.filter((i) => i.availableQuantity > 0), [items]);

  const { data: assignmentsRes, isFetching: isFetchingAssignments, refetch } = useGetInventoryAssignmentsQuery(
    tab === "Active" ? { status: "Active" } : {},
    { refetchOnMountOrArgChange: true },
  );
  const allAssignments = useMemo(() => assignmentsRes?.data || [], [assignmentsRes]);
  const assignments = useMemo(
    () => (tab === "History" ? allAssignments.filter((a) => a.status !== "Active") : allAssignments),
    [allAssignments, tab],
  );

  const staffResults = useMemo(() => {
    const q = staffQuery.trim().toLowerCase();
    if (!q) return [];
    return staff
      .filter((s) => {
        const name = s.personalInfo?.name?.toLowerCase() || "";
        const empId = s.employeeId?.toLowerCase() || "";
        return name.includes(q) || empId.includes(q);
      })
      .slice(0, 8);
  }, [staff, staffQuery]);

  const itemResults = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    const pool = assignableItems;
    if (!q) return pool.slice(0, 8);
    return pool
      .filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || (i.sku || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [assignableItems, itemQuery]);

  const [issueForm, setIssueForm] = useState(emptyIssueForm);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [issueError, setIssueError] = useState("");
  const [issueSuccess, setIssueSuccess] = useState("");

  const [assignInventoryItem, { isLoading: isIssuing }] = useAssignInventoryItemMutation();
  const [returnInventoryItem, { isLoading: isReturning }] = useReturnInventoryItemMutation();

  const pickStaff = (s) => {
    setSelectedStaff(s);
    setIssueForm((f) => ({ ...f, staffId: s._id }));
    setStaffQuery("");
  };
  const pickItem = (i) => {
    setSelectedItem(i);
    setIssueForm((f) => ({ ...f, itemId: i._id, quantity: 1 }));
    setItemQuery("");
  };
  const clearStaff = () => {
    setSelectedStaff(null);
    setIssueForm((f) => ({ ...f, staffId: "" }));
  };
  const clearItem = () => {
    setSelectedItem(null);
    setIssueForm((f) => ({ ...f, itemId: "" }));
  };
  const updateIssueField = (field, value) => setIssueForm((f) => ({ ...f, [field]: value }));

  const submitIssue = async () => {
    setIssueError("");
    setIssueSuccess("");
    if (!issueForm.staffId || !issueForm.itemId) {
      setIssueError("Please select both a staff member and an item.");
      return;
    }
    const qty = Number(issueForm.quantity) || 1;
    if (selectedItem && qty > selectedItem.availableQuantity) {
      setIssueError(`Only ${selectedItem.availableQuantity} unit(s) available.`);
      return;
    }
    try {
      const res = await assignInventoryItem({
        itemId: issueForm.itemId,
        staffId: issueForm.staffId,
        quantity: qty,
        expectedReturnDate: issueForm.expectedReturnDate || undefined,
        conditionAtIssue: issueForm.conditionAtIssue || undefined,
        remarks: issueForm.remarks || undefined,
      }).unwrap();
      setIssueSuccess(res?.message || "Item issued.");
      setIssueForm(emptyIssueForm);
      setSelectedStaff(null);
      setSelectedItem(null);
    } catch (e) {
      setIssueError(e?.data?.message || "Failed to issue item.");
    }
  };

  const [returnTarget, setReturnTarget] = useState(null);
  const [returnForm, setReturnForm] = useState({ status: "Returned", conditionAtReturn: "", remarks: "" });
  const [returnError, setReturnError] = useState("");

  const openReturnModal = (assignment) => {
    setReturnTarget(assignment);
    setReturnForm({ status: "Returned", conditionAtReturn: "", remarks: "" });
    setReturnError("");
  };
  const closeReturnModal = () => setReturnTarget(null);
  const updateReturnField = (field, value) => setReturnForm((f) => ({ ...f, [field]: value }));

  const submitReturn = async () => {
    if (!returnTarget) return;
    setReturnError("");
    try {
      await returnInventoryItem({ id: returnTarget._id, ...returnForm }).unwrap();
      setReturnTarget(null);
    } catch (e) {
      setReturnError(e?.data?.message || "Failed to process return.");
    }
  };

  return {
    tab,
    setTab,
    assignments,
    isLoadingAssignments: isFetchingAssignments,
    refetch,

    staffQuery,
    setStaffQuery,
    staffResults,
    selectedStaff,
    pickStaff,
    clearStaff,
    isFetchingStaff,

    itemQuery,
    setItemQuery,
    itemResults,
    selectedItem,
    pickItem,
    clearItem,
    isFetchingItems,

    issueForm,
    updateIssueField,
    submitIssue,
    isIssuing,
    issueError,
    issueSuccess,

    returnTarget,
    returnForm,
    openReturnModal,
    closeReturnModal,
    updateReturnField,
    submitReturn,
    isReturning,
    returnError,
  };
};
