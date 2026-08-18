// tokenExpiryHandler.ts
import { useAppSelector } from "@/redux/store";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

type JwtPayload = {
  exp: number;
};

let warningTimer: NodeJS.Timeout;
let expireTimer: NodeJS.Timeout;

export const startTokenExpiryWatcher = ( onLogout: () => void) => {
     const token=useAppSelector((state) => state.user.token);
  if (!token) return;

  // clear old timers (important if token refresh happens)
  if (warningTimer) clearTimeout(warningTimer);
  if (expireTimer) clearTimeout(expireTimer);

  const decoded: JwtPayload = jwtDecode(token);

  const expTime = decoded.exp * 1000;
  const now = Date.now();

  const timeLeft = expTime - now;
  const warningTime = 2 * 60 * 1000; // 2 min

  // ⚠️ warning toast
  if (timeLeft > warningTime) {
    warningTimer = setTimeout(() => {
      toast.warn("⚠️ Session will expire in 2 minutes!");
    }, timeLeft - warningTime);
  }

  // ❌ expire toast + logout
  if (timeLeft > 0) {
    expireTimer = setTimeout(() => {
      toast.error("Session expired. Please login again.");
      onLogout();
    }, timeLeft);
  } else {
    toast.error("Session expired. Please login again.");
    onLogout();
  }
};