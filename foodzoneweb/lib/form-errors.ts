import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "./api";
import { toast } from "./toast-store";

/**
 * Map an API error onto a react-hook-form. 422 validation errors are attached
 * to their fields; everything else surfaces as a toast.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): void {
  if (error instanceof ApiError && error.status === 422 && error.errors) {
    for (const [field, messages] of Object.entries(error.errors)) {
      setError(field as Path<T>, { type: "server", message: messages[0] });
    }
    return;
  }
  toast.error(error instanceof ApiError ? error.message : "Something went wrong.");
}
