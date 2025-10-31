import { toast as sonnerToast } from "sonner";
import { addEvent, setSpanAttributes } from "@/lib/telemetry";

type ToastOptions = {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
};

/**
 * Custom toast hook with OpenTelemetry integration
 *
 * Automatically records toast events in the active telemetry span
 * for better observability of user notifications.
 */
export function useToast() {
  const success = (message: string, options?: ToastOptions) => {
    // Record toast event in telemetry
    addEvent("toast.shown", {
      "toast.type": "success",
      "toast.message": message,
      "toast.description": options?.description || "",
    });

    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  };

  const error = (message: string, options?: ToastOptions) => {
    // Record toast event in telemetry
    addEvent("toast.shown", {
      "toast.type": "error",
      "toast.message": message,
      "toast.description": options?.description || "",
    });

    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 6000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  };

  const loading = (message: string, options?: Omit<ToastOptions, "action">) => {
    // Record toast event in telemetry
    addEvent("toast.shown", {
      "toast.type": "loading",
      "toast.message": message,
      "toast.description": options?.description || "",
    });

    return sonnerToast.loading(message, {
      description: options?.description,
      duration: options?.duration ?? Infinity,
    });
  };

  const info = (message: string, options?: ToastOptions) => {
    // Record toast event in telemetry
    addEvent("toast.shown", {
      "toast.type": "info",
      "toast.message": message,
      "toast.description": options?.description || "",
    });

    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  };

  const warning = (message: string, options?: ToastOptions) => {
    // Record toast event in telemetry
    addEvent("toast.shown", {
      "toast.type": "warning",
      "toast.message": message,
      "toast.description": options?.description || "",
    });

    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  };

  const dismiss = (toastId?: string | number) => {
    // Record toast dismissal in telemetry
    addEvent("toast.dismissed", {
      "toast.id": toastId ? String(toastId) : "all",
    });

    sonnerToast.dismiss(toastId);
  };

  const promise = <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    // Record promise toast in telemetry
    addEvent("toast.promise.started", {
      "toast.loading.message": loading,
    });

    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  };

  return {
    success,
    error,
    loading,
    info,
    warning,
    dismiss,
    promise,
  };
}
