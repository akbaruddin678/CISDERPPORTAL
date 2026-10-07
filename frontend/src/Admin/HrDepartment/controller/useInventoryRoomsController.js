import { useMemo, useState } from "react";
import {
  useGetInventoryLocationTreeQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
} from "../api/HrApi";
import { useGetDepartmentsQuery } from "../../../components/catalog/api/catalogApi";

const emptyBuildingForm = { name: "", description: "", location: "" };
const emptyFloorForm = { name: "", description: "" };
const emptyRoomForm = { name: "", description: "", capacity: "", roomType: "Classroom", condition: "Good", location: "", departmentId: "" };

// Drives the Rooms & Spaces screen's Building -> Floor -> Room browser —
// all three levels live in the same InventoryItem collection (category
// "Building"/"Floor"/"Room", linked via parentId), so this controller is
// the one place that knows how to create/edit/delete at each level and
// keep the drill-down selection in sync when something is removed.
export const useInventoryRoomsController = () => {
  const { data: treeRes, isFetching, refetch } = useGetInventoryLocationTreeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const tree = treeRes?.data?.tree || [];
  const orphanRooms = treeRes?.data?.orphanRooms || [];

  const { data: deptRes } = useGetDepartmentsQuery();
  const departments = deptRes?.data || (Array.isArray(deptRes) ? deptRes : []);

  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [selectedFloorId, setSelectedFloorId] = useState(null);

  const selectedBuilding = useMemo(
    () => tree.find((b) => b._id === selectedBuildingId) || null,
    [tree, selectedBuildingId],
  );
  const selectedFloor = useMemo(
    () => selectedBuilding?.floors?.find((f) => f._id === selectedFloorId) || null,
    [selectedBuilding, selectedFloorId],
  );

  const [createInventoryItem, { isLoading: isCreating }] = useCreateInventoryItemMutation();
  const [updateInventoryItem, { isLoading: isUpdating }] = useUpdateInventoryItemMutation();
  const [deleteInventoryItem, { isLoading: isDeleting }] = useDeleteInventoryItemMutation();

  // modal: { level: "building"|"floor"|"room", mode: "create"|"edit", target }
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyBuildingForm);
  const [formError, setFormError] = useState("");

  const openCreateBuilding = () => {
    setModal({ level: "building", mode: "create" });
    setForm(emptyBuildingForm);
    setFormError("");
  };
  const openEditBuilding = (b) => {
    setModal({ level: "building", mode: "edit", target: b });
    setForm({ name: b.name, description: b.description || "", location: b.location || "" });
    setFormError("");
  };
  const openCreateFloor = () => {
    setModal({ level: "floor", mode: "create" });
    setForm(emptyFloorForm);
    setFormError("");
  };
  const openEditFloor = (f) => {
    setModal({ level: "floor", mode: "edit", target: f });
    setForm({ name: f.name, description: f.description || "" });
    setFormError("");
  };
  const openCreateRoom = () => {
    setModal({ level: "room", mode: "create" });
    setForm(emptyRoomForm);
    setFormError("");
  };
  const openEditRoom = (r) => {
    setModal({ level: "room", mode: "edit", target: r });
    setForm({
      name: r.name,
      description: r.description || "",
      capacity: r.roomDetails?.capacity ?? "",
      roomType: r.roomDetails?.roomType || "Classroom",
      condition: r.condition || "Good",
      location: r.location || "",
      departmentId: r.departmentId?._id || r.departmentId || "",
    });
    setFormError("");
  };
  const closeModal = () => {
    setModal(null);
    setFormError("");
  };
  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submitModal = async () => {
    if (!form.name?.trim()) {
      setFormError("Name is required.");
      return;
    }
    try {
      if (modal.level === "building") {
        const payload = {
          name: form.name.trim(),
          category: "Building",
          description: form.description,
          location: form.location,
          totalQuantity: 1,
        };
        if (modal.mode === "edit") await updateInventoryItem({ id: modal.target._id, ...payload }).unwrap();
        else await createInventoryItem(payload).unwrap();
      } else if (modal.level === "floor") {
        const payload = {
          name: form.name.trim(),
          category: "Floor",
          description: form.description,
          parentId: selectedBuildingId,
          totalQuantity: 1,
        };
        if (modal.mode === "edit") await updateInventoryItem({ id: modal.target._id, ...payload }).unwrap();
        else await createInventoryItem(payload).unwrap();
      } else if (modal.level === "room") {
        const payload = {
          name: form.name.trim(),
          category: "Room",
          description: form.description,
          parentId: selectedFloorId,
          condition: form.condition,
          location: form.location,
          departmentId: form.departmentId || undefined,
          roomDetails: {
            capacity: form.capacity ? Number(form.capacity) : undefined,
            roomType: form.roomType,
          },
          totalQuantity: 1,
        };
        if (modal.mode === "edit") await updateInventoryItem({ id: modal.target._id, ...payload }).unwrap();
        else await createInventoryItem(payload).unwrap();
      }
      closeModal();
    } catch (e) {
      setFormError(e?.data?.message || "Something went wrong. Please try again.");
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await deleteInventoryItem(deleteTarget._id).unwrap();
      if (deleteTarget._id === selectedBuildingId) setSelectedBuildingId(null);
      if (deleteTarget._id === selectedFloorId) setSelectedFloorId(null);
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(e?.data?.message || "Failed to delete.");
    }
  };

  return {
    isLoading: isFetching,
    refetch,
    tree,
    orphanRooms,
    departments,

    selectedBuildingId,
    setSelectedBuildingId,
    selectedBuilding,
    selectedFloorId,
    setSelectedFloorId,
    selectedFloor,

    modal,
    form,
    formError,
    updateField,
    openCreateBuilding,
    openEditBuilding,
    openCreateFloor,
    openEditFloor,
    openCreateRoom,
    openEditRoom,
    closeModal,
    submitModal,
    isSaving: isCreating || isUpdating,

    deleteTarget,
    setDeleteTarget,
    deleteError,
    confirmDelete,
    isDeleting,
  };
};
