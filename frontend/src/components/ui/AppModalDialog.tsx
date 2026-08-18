// src/components/mui/Dialog.tsx

import Modal ,{ModalProps} from "@mui/material/Modal";

export default function AppModalDialog(props: ModalProps) {
  const handleClose: ModalProps["onClose"] = (event, reason) => {
    const shouldClose = window.confirm(
      "You have unsaved changes. Close this dialog?"
    );

    if (!shouldClose) return;

    props.onClose?.(event, reason);
  };
  return <Modal {...props} onClose={handleClose} />;
}