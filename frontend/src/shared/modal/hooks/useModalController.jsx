import { useState } from "react";

export const useModalController = () => {
  const [modalState, setmodalState] = useState({
    isOpen: false,
    name: "",
  });

  const openModal = ({ name }) => {
    setmodalState({
      isOpen: true,
      name: name,
    });
  };
  const closeModal = () => {
    setmodalState({
      isOpen: false,
      name: "",
    });
  };

  return {
    openModal,
    closeModal,
    modalState,
  };
};
