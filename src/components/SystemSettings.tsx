import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import * as api from "../lib/server-functions";
import { settingsSchema } from "../lib/workspace-schemas";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function SystemSettings() {
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings(),
  });
  const integrations = useQuery({
    queryKey: ["integrations"],
    queryFn: () => api.getIntegrations(),
  });
  if (settings.isPending)
    return <p role="status">Loading workspace settings…</p>;
  if (!settings.data)
    return <p role="alert">Could not load workspace settings. Try again.</p>;
  return (
    <SettingsForm initial={settings.data} integrations={integrations.data} />
  );
}
function SettingsForm({
  initial,
  integrations,
}: {
  initial: z.infer<typeof settingsSchema>;
  integrations: Awaited<ReturnType<typeof api.getIntegrations>> | undefined;
}) {
  const save = useMutation({
    mutationFn: (data: z.infer<typeof settingsSchema>) =>
      api.saveSettings({ data }),
  });
  const form = useForm({
    defaultValues: initial,
    validators: { onSubmit: settingsSchema },
    onSubmit: async ({ value }) => {
      await save.mutateAsync(value);
    },
  });
  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h2 className="text-2xl font-semibold">Workspace settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Give your AI context and decide which internal actions it can
          complete.
        </p>
      </header>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit().catch(() => {});
        }}
      >
        <form.Field name="companyName">
          {(field) => (
            <div>
              <label htmlFor="company-name" className="block text-sm mb-2">
                Company name
              </label>
              <Input
                id="company-name"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                maxLength={160}
                placeholder="Your startup"
              />
            </div>
          )}
        </form.Field>
        <form.Field name="companyDescription">
          {(field) => (
            <div>
              <label htmlFor="company-context" className="block text-sm mb-2">
                What are you building?
              </label>
              <textarea
                id="company-context"
                className="w-full rounded-md border border-input bg-background p-3 text-sm"
                rows={5}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                maxLength={4000}
                placeholder="Describe your product, customers, and current priorities."
              />
            </div>
          )}
        </form.Field>
        <form.Field name="autonomy">
          {(field) => (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium mb-3">
                Internal task permissions
              </legend>
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  className="mt-1"
                  name="autonomy"
                  checked={field.state.value === "review"}
                  onChange={() => field.handleChange("review")}
                />
                <span>
                  <span className="block text-sm">Review every task</span>
                  <span className="block mt-1 text-sm text-muted-foreground">
                    Approve a proposed task before it is created.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  className="mt-1"
                  name="autonomy"
                  checked={field.state.value === "internal"}
                  onChange={() => field.handleChange("internal")}
                />
                <span>
                  <span className="block text-sm">
                    Allow internal task creation
                  </span>
                  <span className="block mt-1 text-sm text-muted-foreground">
                    Active rules can create tasks automatically. AI drafts still
                    require review.
                  </span>
                </span>
              </label>
            </fieldset>
          )}
        </form.Field>
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save settings"}
          </Button>
          {save.isSuccess && (
            <p role="status" className="text-sm">
              Workspace settings saved.
            </p>
          )}
        </div>
      </form>
      <section className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold">Connections</h3>
        <dl className="mt-4 divide-y divide-border">
          <div className="flex flex-wrap justify-between gap-3 py-3">
            <dt>AI provider</dt>
            <dd>
              {integrations?.ai
                ? `${integrations.provider} · ${integrations.model}`
                : "Not connected"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 py-3">
            <dt>Banking</dt>
            <dd>
              {integrations?.banking ? "Plaid configured" : "Not connected"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 py-3">
            <dt>Scheduled rules</dt>
            <dd>
              {integrations?.scheduled ? "Every 15 minutes" : "Manual checks"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 py-3">
            <dt>Customer delivery</dt>
            <dd>Drafts only</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
