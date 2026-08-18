import { useEffect, useState, useCallback } from "react";
import { STATUS, Joyride, Step, type EventData } from "react-joyride";
import { useTheme, useMediaQuery } from "@mui/material";

const steps: Step[] = [
  {
    target: ".company-select-tour",
    content:
      "Welcome! Select your company from the dropdown to switch workspaces. Data updates automatically for the selected company.",
    placement: "bottom",
    skipBeacon: true,
  },
  {
    target: ".menu-dashboard-tour",
    content:
      "Welcome to your Dashboard. Here you can view key invoices, loads, and other important information at a glance.",
    placement: "bottom",
    skipBeacon: true,
  },
  {
    target: ".menu-company-tour",
    content:
      "Need to manage another business? Go to Company and create a new company, update details and manage from one account.",
    placement: "right",
    skipBeacon: true,
  },
];

const STORAGE_KEY = "crmTourCompleted";

const TourGuide = () => {
  const [run, setRun] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Hide on md and below

  useEffect(() => {
    // Don't run on mobile
    if (isMobile) return;

    if (localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => {
      setRun(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isMobile]);

  const handleEvent = useCallback((data: EventData) => {
    const { status } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      localStorage.setItem(STORAGE_KEY, "true");
      setRun(false);
    }
  }, []);

  // Don't render Joyride on mobile
  if (isMobile) {
    return null;
  }

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      onEvent={handleEvent}
      options={{
        zIndex: 10000,
        primaryColor: "#101721",
        backgroundColor: "#101721",
        textColor: "#ffffff",
        showProgress: true,
      }}
      styles={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        tooltip: {
          borderRadius: 8,
          padding: 15,
          fontSize: "13.6px",
          fontWeight: 100,
        },
        buttonPrimary: {
          backgroundColor: "#fff",
          fontSize: "12px",
          color: "#101721",
          borderRadius: 4,
          fontWeight: 500,
          padding: "7px 12px",
        },
        buttonBack: {
          color: "#fff",
          fontWeight: 500,
          fontSize: "12px",
        },
        buttonSkip: {
          color: "#fff",
          fontWeight: 500,
          fontSize: "12px",
        },
        buttonClose: {
          color: "#fff",
          right: "7px",
          top: "5px",
        },
        arrow: {
          color: "#101721",
          boxShadow: "none",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip",
      }}
    />
  );
};

export default TourGuide;