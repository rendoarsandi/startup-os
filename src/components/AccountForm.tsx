import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createAccount } from "../lib/server-functions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function AccountForm() {
  const [open, setOpen] = useState(false);
  const save = useMutation({
    mutationFn: (value: { name: string; balance: string }) =>
      createAccount({
        data: {
          name: value.name.trim(),
          type: "checking",
          currency: "USD",
          balance: Math.round(Number(value.balance) * 100),
        },
      }),
    onSuccess: () => {
      form.reset();
      setOpen(false);
    },
  });
  const form = useForm({
    defaultValues: { name: "", balance: "0" },
    onSubmit: async ({ value }) => {
      await save.mutateAsync(value);
    },
  });
  return (
    <div className="space-y-3">
      <Button variant="outline" onClick={() => setOpen(!open)}>
        {open ? "Close account form" : "Add manual account"}
      </Button>
      {open && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit().catch(() => {});
          }}
        >
          <p className="text-sm text-muted-foreground">
            Enter your current USD balance. New manual transactions update this
            balance.
          </p>
          <form.Field name="name">
            {(field) => (
              <div>
                <label htmlFor="account-name" className="block text-sm mb-1">
                  Account name
                </label>
                <Input
                  id="account-name"
                  required
                  maxLength={160}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Operating account"
                />
              </div>
            )}
          </form.Field>
          <form.Field name="balance">
            {(field) => (
              <div>
                <label htmlFor="account-balance" className="block text-sm mb-1">
                  Current balance (USD)
                </label>
                <Input
                  id="account-balance"
                  type="number"
                  required
                  step="0.01"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </div>
            )}
          </form.Field>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save account"}
          </Button>
          {save.error && (
            <p role="alert" className="text-sm text-destructive">
              {save.error.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
