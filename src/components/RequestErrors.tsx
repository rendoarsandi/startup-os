import {
  useMutationState,
  useQueryClient,
  useIsFetching,
} from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { Button } from "./ui/button";

export function RequestErrors() {
  const client = useQueryClient();
  const failures = useMutationState({
    filters: { status: "error" },
    select: (mutation) => mutation.state.error?.message,
  });
  useIsFetching();
  const queryFailure = useSyncExternalStore(
    (callback) => client.getQueryCache().subscribe(callback),
    () =>
      client
        .getQueryCache()
        .getAll()
        .find((query) => query.state.status === "error")?.state.error
        ?.message ?? "",
    () => "",
  );
  const message = failures.at(-1) || queryFailure;
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm"
    >
      <p className="flex-1 min-w-0">{message}</p>
      <Button
        variant="outline"
        onClick={() => {
          client.getMutationCache().clear();
          void client.refetchQueries({ type: "active" });
        }}
      >
        Try again
      </Button>
    </div>
  );
}
