import { useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useGetRoomsQuery, useCreateRoomMutation, useUpdateRoomMutation } from "../api/roomApi";

export const useRoomController = () => {
  const { openAlert } = useGlobalAlert();
  const { data, isFetching, refetch } = useGetRoomsQuery();
  const rooms = data?.data || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState({ name: "", capacity: 40 });

  const openCreateDialog = () => {
    setEditingRoom(null);
    setForm({ name: "", capacity: 40 });
    setIsDialogOpen(true);
  };
  const openEditDialog = (room) => {
    setEditingRoom(room);
    setForm({ name: room.name, capacity: room.capacity });
    setIsDialogOpen(true);
  };
  const closeDialog = () => setIsDialogOpen(false);

  const [createRoom, { isLoading: isCreating }] = useCreateRoomMutation();
  const [updateRoom, { isLoading: isUpdating }] = useUpdateRoomMutation();

  const handleSave = async () => {
    if (!form.name.trim() || Number(form.capacity) < 1) {
      return openAlert({ message: "Enter a room name and a valid capacity.", severity: "warning" });
    }
    try {
      if (editingRoom) {
        await updateRoom({ id: editingRoom._id, name: form.name.trim(), capacity: Number(form.capacity) }).unwrap();
        openAlert({ message: "Room updated.", severity: "success" });
      } else {
        await createRoom({ name: form.name.trim(), capacity: Number(form.capacity) }).unwrap();
        openAlert({ message: "Room created.", severity: "success" });
      }
      closeDialog();
    } catch (err) {
      openAlert({ message: err.data?.message || "Failed to save room.", severity: "error" });
    }
  };

  const handleToggleActive = async (room) => {
    try {
      await updateRoom({ id: room._id, isActive: !room.isActive }).unwrap();
    } catch (err) {
      openAlert({ message: err.data?.message || "Failed to update room.", severity: "error" });
    }
  };

  return {
    rooms,
    isFetching,
    refetch,
    isDialogOpen,
    editingRoom,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    form,
    setForm,
    handleSave,
    isSaving: isCreating || isUpdating,
    handleToggleActive,
  };
};

export default useRoomController;
