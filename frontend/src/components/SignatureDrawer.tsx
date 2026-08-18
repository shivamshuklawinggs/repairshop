import React, { useRef, useEffect, useState } from "react";
import {
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Paper,
  Stack,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import SaveIcon from "@mui/icons-material/Save";

interface SignatureDrawerProps {
  open?: boolean;
  onClose?: () => void;
  onSave?: (dataUrl: string) => void;
  title?: string;
  width?: number;
  height?: number;
  defaultSignature?: string; // 👈 Base64 data URL (e.g. from DB)
}

const SignatureDrawer: React.FC<SignatureDrawerProps> = ({
  open = false,
  onClose = () => {},
  onSave = () => {},
  title = "Add Signature",
  width = 400,
  height = 100,
  defaultSignature, // 👈 received from props
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [last, setLast] = useState({ x: 0, y: 0 });

  // 🖊️ Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#101721";
  }, [width, height, open]);

  // 🖼️ Load default signature (on open or defaultSignature change)
  useEffect(() => {
    if (defaultSignature && open && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const img = new Image();
      img.onload = () => {
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(img, 0, 0, width, height);
        }
      };
      img.src = defaultSignature;
    }
  }, [defaultSignature, open, width, height]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !canvasRef.current) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLast({ x, y });
    setIsDrawing(true);
    canvasRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    setLast({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current)
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const save = () => {
    if (!canvasRef.current) return;

    const exportCanvas = document.createElement("canvas");
    const targetWidth = 400;
    const targetHeight = 150;
    exportCanvas.width = targetWidth;
    exportCanvas.height = targetHeight;

    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    exportCtx.fillStyle = "white";
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvasRef.current, 0, 0, targetWidth, targetHeight);

    let dataUrl = exportCanvas.toDataURL("image/jpeg", 0.3);

    // Compress if >1KB
    const maxBytes = 1024;
    let quality = 0.3;
    while (dataUrl.length > maxBytes * 1.37 && quality > 0.05) {
      quality -= 0.05;
      dataUrl = exportCanvas.toDataURL("image/jpeg", quality);
    }

    onSave(dataUrl);
  };

  // 🚫 Prevent mobile scroll while drawing
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      if (isDrawing) e.preventDefault();
    };
    document.addEventListener("touchmove", handler, { passive: false });
    return () => document.removeEventListener("touchmove", handler);
  }, [isDrawing]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true, sx: { zIndex: 2000 } }}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }}
    >
      <AppBar
        position="static"
        color="inherit"
        elevation={1}
        sx={{ borderBottom: "1px solid #ddd", py:0.5, boxShadow:'none' }}
      >
        <Toolbar style={{minHeight:'auto'}}>
          <Typography variant="h6" sx={{ flexGrow: 1}}>
            {title}
          </Typography>
          <IconButton color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, width: { xs: "100vw", sm: "400px", md: "400px" } }}>
        <Paper
          variant="outlined"
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 0,
            border:'none,'
          }}
        >
          <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
            Sign using your mouse, stylus, or finger
          </Typography>

          <Box
            sx={{
              border: "1px solid #ccc",
              borderRadius: 1,
              overflow: "hidden",
              width: "100%",
              height: height,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "white",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ display: "block", width: "100%", height: "100%" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CleaningServicesIcon />}
              onClick={clear}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={save}
            >
              Save
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                save();
                onClose();
              }}
            >
              Save & Close
            </Button>
          </Stack>
        </Paper>

        <Divider sx={{ mt: 2.5}} />
        <Typography variant="caption" color="text.secondary" sx={{textAlign:'center', display:'block', pt:1.5}}>
          Your signature will be saved securely and used for official documents only.
        </Typography>
      </Box>
    </Drawer>
  );
};

export default SignatureDrawer;
