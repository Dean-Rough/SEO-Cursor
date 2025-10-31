"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      theme="dark"
      toastOptions={{
        style: {
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#f4f4f5",
          backdropFilter: "blur(12px)",
        },
        className: "toast-nocturnal",
      }}
    />
  );
}
