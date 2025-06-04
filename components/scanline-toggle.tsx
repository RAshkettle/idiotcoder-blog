"use client";

import { Settings } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScanlineToggle() {
  const [scanlinesEnabled, setScanlinesEnabled] = useState(true);

  useEffect(() => {
    // Load saved preference from localStorage
    const saved = localStorage.getItem("scanlines-enabled");
    if (saved !== null) {
      setScanlinesEnabled(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Apply/remove scanlines based on user preference
    const body = document.body;
    if (scanlinesEnabled) {
      body.classList.add("crt-effects");
    } else {
      body.classList.remove("crt-effects");
    }

    // Save preference
    localStorage.setItem("scanlines-enabled", JSON.stringify(scanlinesEnabled));
  }, [scanlinesEnabled]);

  const toggleScanlines = () => {
    setScanlinesEnabled(!scanlinesEnabled);
  };

  return (
    <button
      onClick={toggleScanlines}
      className="rts-button-square p-1 w-8 h-8 flex items-center justify-center ml-2"
      title={scanlinesEnabled ? "Disable scan lines" : "Enable scan lines"}
    >
      <Settings className="w-4 h-4 text-amber-400" />
    </button>
  );
}
