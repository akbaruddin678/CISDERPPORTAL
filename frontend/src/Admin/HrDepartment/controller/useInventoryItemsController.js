import { useMemo, useState } from "react";
import {
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useGetInventoryLocationTreeQuery,
} from "../api/HrApi";

const emptyForm = (category) => ({
  name: "",
  category,
  description: "",
  sku: "",
  unit: "piece",
  totalQuantity: 1,
  isConsumable: false,
  minThreshold: 0,
  condition: "New",
  location: "",
  roomId: "",
  serialNumber: "",
  purchaseDate: "",
  purchaseCost: "",
  vendor: "",
  warrantyExpiry: "",
  notes: "",
});

// Powers the Furniture/Stationery/Equipment category screens — same
// controller, same view, just a different fixed `category` so each screen
// only ever sees/creates its own kind of item. Rooms themselves are managed
// by the dedicated Building -> Floor -> Room browser (useInventoryRoomsController)
// since they need hierarchy, not a flat list — but every item here can be
// pinned to one of those rooms via `roomId`.
export const useInventoryItemsController = (category) => {
  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const { data, isFetching, refetch } = useGetInventoryItemsQuery(
    { category, search: search || undefined, lowStockOnly: lowStockOnly ? "true" : undefined },
    { refetchOnMountOrArgChange: true },
  );
  const items = useMemo(() => data?.data || [], [data]);
  const filteredItems = useMemo(() => {
    if (!conditionFilter) return items;
    return items.filter((i) => i.condition === conditionFilter);
  }, [items, conditionFilter]);

  // Flattened room picker options, with a "Building / Floor / Room" label
  // so a room can be told apart from an identically-named one elsewhere.
  const { data: locationRes } = useGetInventoryLocationTreeQuery();
  const roomOptions = useMemo(() => {
    const tree = locationRes?.data?.tree || [];
    const rooms = [];
    tree.forEach((b) => {
      (b.floors || []).forEach((f) => {
        (f.rooms || []).forEach((r) => {
          rooms.push({ ...r, breadcrumbLabel: `${b.name} / ${f.name} / ${r.name}` });
        });
      });
    });
    return rooms;
  }, [locationRes]);

  const [createInventoryItem, { isLoading: isCreating }] = useCreateInventoryItemMutation();
  const [updateInventoryItem, { isLoading: isUpdating }] = useUpdateInventoryItemMutation();
  const [deleteInventoryItem, { isLoading: isDeleting }] = useDeleteInventoryItemMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm(category));
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm(category));
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);
    setForm({
      ...emptyForm(category),
      ...item,
      totalQuantity: item.totalQuantity ?? 1,
      minThreshold: item.minThreshold ?? 0,
      purchaseDate: item.purchaseDate ? item.purchaseDate.slice(0, 10) : "",
      warrantyExpiry: item.warrantyExpiry ? item.warrantyExpiry.slice(0, 10) : "",
      departmentId: item.departmentId?._id || item.departmentId || "",
      roomId: item.roomId?._id || item.roomId || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormError("");
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submitForm = async () => {
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    const qty = Number(form.totalQuantity);
    if (!Number.isFinite(qty) || qty < 0) {
      setFormError("Total quantity must be a valid non-negative number.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      category,
      description: form.description,
      sku: form.sku || undefined,
      unit: form.unit || "piece",
      totalQuantity: qty,
      isConsumable: category === "Stationery" ? Boolean(form.isConsumable) : false,
      minThreshold: Number(form.minThreshold) || 0,
      condition: form.condition,
      location: form.location,
      roomId: form.roomId || null,
      notes: form.notes,
    };
    if (["Furniture", "Electronics", "Equipment"].includes(category)) {
      payload.serialNumber = form.serialNumber || undefined;
      payload.purchaseDate = form.purchaseDate || undefined;
      payload.purchaseCost = form.purchaseCost ? Number(form.purchaseCost) : undefined;
      payload.vendor = form.vendor || undefined;
      payload.warrantyExpiry = form.warrantyExpiry || undefined;
    }

    try {
      if (editingId) {
        await updateInventoryItem({ id: editingId, ...payload }).unwrap();
      } else {
        await createInventoryItem(payload).unwrap();
      }
      closeModal();
    } catch (e) {
      setFormError(e?.data?.message || "Something went wrong. Please try again.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await deleteInventoryItem(deleteTarget._id).unwrap();
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(e?.data?.message || "Failed to delete item.");
    }
  };

  return {
    items: filteredItems,
    totalCount: items.length,
    isLoading: isFetching,
    refetch,
    search,
    setSearch,
    conditionFilter,
    setConditionFilter,
    lowStockOnly,
    setLowStockOnly,
    roomOptions,

    modalOpen,
    editingId,
    form,
    formError,
    updateField,
    openCreateModal,
    openEditModal,
    closeModal,
    submitForm,
    isSaving: isCreating || isUpdating,

    deleteTarget,
    setDeleteTarget,
    deleteError,
    confirmDelete,
    isDeleting,
  };
};
