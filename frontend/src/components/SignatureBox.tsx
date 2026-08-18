import React, { useRef, useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  Divider,
} from "@mui/material";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import { useSearchParams } from "react-router-dom";
// import SaveIcon from "@mui/icons-material/Save";

interface SignatureBoxProps {
  onSave?: (dataUrl: string) => void;
  title?: string;
  width?: number | string;
  height?: number;
  defaultSignature?: string; // Base64 data URL
}

const SignatureBox: React.FC<SignatureBoxProps> = ({
  onSave = () => {},
  title = "Add Signature",
  width = "100%",
  height = 150,
  defaultSignature,
}) => {
  const [searChParams]=useSearchParams()
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [last, setLast] = useState({ x: 0, y: 0 });

  // 🖊️ Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    canvas.width = rect.width * ratio;
    canvas.height = height * ratio;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#2f2f2f"; // graphite-like gray
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.85;
  }, [height]);

  // 🖼️ Load default signature
  useEffect(() => {
    if (defaultSignature && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const img = new Image();
      img.onload = () => {
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      };
      img.src = defaultSignature;
    }
  }, [defaultSignature]);

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

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Optional: stylus pressure support (if device supports it)
  const pressure = e.pressure ? e.pressure : 0.3;
  ctx.lineWidth = 1.5 + pressure * 3; // smooth pressure-based width

  // Smooth curve instead of sharp line
  const midX = (last.x + x) / 2;
  const midY = (last.y + y) / 2;

  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.quadraticCurveTo(last.x, last.y, midX, midY);
  ctx.stroke();

  setLast({ x, y });
};




  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current)
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    save()
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
    // const maxBytes = 1024;
    // let quality = 0.3;
    // while (dataUrl.length > maxBytes * 1.37 && quality > 0.05) {
    //   quality -= 0.05;
    //   dataUrl = exportCanvas.toDataURL("image/jpeg", quality);
    // }

    onSave(dataUrl);
  };
    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    canvasRef.current?.releasePointerCapture(e.pointerId);
    save()
  };
  // 🚫 Prevent mobile scroll while drawing
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      if (isDrawing) e.preventDefault();
    };
    document.addEventListener("touchmove", handler, { passive: false });
    return () => document.removeEventListener("touchmove", handler);
  }, [isDrawing]);
  if(searChParams.get("signature")){

    return (
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 500,
          bgcolor: "#fafafa",
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 1, fontWeight: 600, color: "primary.main" }}
        >
          {title}
        </Typography>
  
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1, textAlign: "center" }}
        >
          Sign below using your mouse, stylus, or finger
        </Typography>
  
        <Box
          sx={{
            border: "2px dashed #ccc",
            borderRadius: 2,
            overflow: "hidden",
            width: "100%",
            height,
            bgcolor: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "border-color 0.3s",
            "&:hover": { borderColor: "primary.main" },
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              cursor: "crosshair",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </Box>
  
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mt: 2, width: "100%", justifyContent: "center" }}
        >
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<CleaningServicesIcon />}
            onClick={clear}
            sx={{
              flex: 1,
              minWidth: 120,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Clear
          </Button>
          {/* <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={save}
            sx={{
              flex: 1,
              minWidth: 120,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Save
          </Button> */}
        </Stack>
  
        <Divider sx={{ my: 2, width: "100%" }} />
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ textAlign: "center" }}
        >
          Your signature will be stored securely and used for official documents
          only.
        </Typography>
      </Paper>
    );
  }
};

export default SignatureBox;
