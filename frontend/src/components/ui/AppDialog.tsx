// src/components/mui/Dialog.tsx

import MuiDialog, { DialogProps } from "@mui/material/Dialog";

export default function AppDialog(props: DialogProps) {
  const handleClose: DialogProps["onClose"] = (event, reason) => {
    const shouldClose = window.confirm(
      "You have unsaved changes. Close this dialog?"
    );

    if (!shouldClose) return;

    props.onClose?.(event, reason);
  };

  return <MuiDialog {...props} onClose={handleClose} />;
}