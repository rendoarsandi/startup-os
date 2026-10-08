import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import * as api from "../../lib/server-functions";
import { ruleSchema } from "../../lib/workspace-schemas";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";

const initialRule: z.input<typeof ruleSchema> = {
  name: "",
  triggerType: "low_stock",
  triggerValue: "5",
  actionType: "auto_task",
  active: true,
};
const statusLabel = {
  running: "Running",
  awaiting_approval: "Needs review",
  completed: "Completed",
  failed: "Failed",
  dismissed: "Dismissed",
  approved: "Draft approved",
};

export function AutopilotSection() {
  const [creating, setCreating] = useState(false);
  const rules = useQuery({
    queryKey: ["autopilotRules"],
    queryFn: () => api.listRules(),
  });
  const runs = useQuery({
    queryKey: ["automationRuns"],
    queryFn: () => api.listRuns(),
    refetchInterval: 15_000,
  });
  const integrations = useQuery({
    queryKey: ["integrations"],
    queryFn: () => api.getIntegrations(),
  });
  const save = useMutation({
    mutationFn: (data: z.input<typeof ruleSchema>) => api.saveRule({ data }),
    onSuccess: () => {
      form.reset();
      setCreating(false);
    },
  });
  const toggle = useMutation({
    mutationFn: (data: { id: string; active: boolean }) =>
      api.toggleRule({ data }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteRule({ data: { id } }),
  });
  const checks = useMutation({ mutationFn: () => api.runChecks() });
  const review = useMutation({
    mutationFn: (data: {
      id: string;
      decision: "approve" | "dismiss" | "retry";
    }) => api.reviewRun({ data }),
  });
  const form = useForm({
    defaultValues: initialRule,
    validators: { onSubmit: ruleSchema },
    onSubmit: async ({ value }) => {
      await save.mutateAsync(value);
    },
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold">Automation</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Delegate recurring work. Review what your AI prepares and track
            every task it completes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={
              checks.isPending || !rules.data?.some((rule) => rule.active)
            }
            onClick={() => checks.mutate()}
          >
            {checks.isPending ? "Checking your records…" : "Run checks"}
          </Button>
          <Button onClick={() => setCreating(!creating)}>
            {creating ? "Close rule form" : "Create rule"}
          </Button>
        </div>
      </header>
      {integrations.data && !integrations.data.ai && (
        <p className="rounded-lg border border-border p-4 text-sm">
          AI is not connected yet. Task rules work now; AI drafts and audits
          need a connection configured by your workspace administrator.
        </p>
      )}
      {integrations.data && (
        <p className="text-sm text-muted-foreground">
          {integrations.data.scheduled
            ? "Active rules run every 15 minutes."
            : "Rules run when you select Run checks in this environment."}{" "}
          Customer replies are saved as drafts for review.
        </p>
      )}
      {checks.isSuccess && (
        <p role="status" className="text-sm">
          Matched {checks.data.matched} records and created{" "}
          {checks.data.created} new runs. Previously processed records are
          skipped.
        </p>
      )}
      {creating && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-4">Create a rule</h3>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit().catch(() => {});
            }}
          >
            <form.Field name="name">
              {(field) => (
                <div className="sm:col-span-2">
                  <label htmlFor="rule-name" className="block text-sm mb-2">
                    Rule name
                  </label>
                  <Input
                    id="rule-name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    required
                    maxLength={160}
                    placeholder="Create a task when stock is low"
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="triggerType">
              {(field) => (
                <div>
                  <label htmlFor="rule-trigger" className="block text-sm mb-2">
                    When
                  </label>
                  <select
                    id="rule-trigger"
                    className="w-full rounded-md border border-input bg-background p-3 text-sm"
                    value={field.state.value}
                    onChange={(event) => {
                      const trigger = ruleSchema.shape.triggerType.parse(
                        event.target.value,
                      );
                      field.handleChange(trigger);
                      form.setFieldValue("actionType", "auto_task");
                    }}
                  >
                    <option value="low_stock">
                      Stock falls below a threshold
                    </option>
                    <option value="runway_low">
                      Cash runway falls below a threshold
                    </option>
                    <option value="high_priority_ticket">
                      A high-priority ticket is open
                    </option>
                  </select>
                </div>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.values.triggerType}>
              {(trigger) =>
                trigger !== "high_priority_ticket" && (
                  <form.Field name="triggerValue">
                    {(field) => (
                      <div>
                        <label
                          htmlFor="rule-threshold"
                          className="block text-sm mb-2"
                        >
                          {trigger === "low_stock"
                            ? "Stock threshold (items)"
                            : "Runway threshold (months)"}
                        </label>
                        <Input
                          id="rule-threshold"
                          type="number"
                          min="0.1"
                          step="any"
                          value={field.state.value}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          required
                        />
                      </div>
                    )}
                  </form.Field>
                )
              }
            </form.Subscribe>
            <form.Subscribe selector={(state) => state.values.triggerType}>
              {(trigger) => (
                <form.Field name="actionType">
                  {(field) => (
                    <div>
                      <label
                        htmlFor="rule-action"
                        className="block text-sm mb-2"
                      >
                        Do this
                      </label>
                      <select
                        id="rule-action"
                        className="w-full rounded-md border border-input bg-background p-3 text-sm"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(
                            ruleSchema.shape.actionType.parse(
                              event.target.value,
                            ),
                          )
                        }
                      >
                        <option value="auto_task">
                          Create an internal task
                        </option>
                        {trigger === "runway_low" && (
                          <option value="ai_audit">
                            Prepare an AI cash audit
                          </option>
                        )}
                        {trigger === "high_priority_ticket" && (
                          <option value="ai_reply">
                            Draft a support reply
                          </option>
                        )}
                      </select>
                    </div>
                  )}
                </form.Field>
              )}
            </form.Subscribe>
            <form.Subscribe selector={(state) => state.errors}>
              {(errors) =>
                errors.length > 0 && (
                  <p
                    role="alert"
                    className="sm:col-span-2 text-sm text-destructive"
                  >
                    {errors
                      .flatMap((error) => Object.values(error || {}))
                      .map((error) => String(error))
                      .join(" ")}
                  </p>
                )
              }
            </form.Subscribe>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save rule"}
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setCreating(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
      <section aria-labelledby="rules-title">
        <h3 id="rules-title" className="text-lg font-semibold mb-3">
          Your rules
        </h3>
        {rules.isPending ? (
          <p className="text-sm" role="status">
            Loading rules…
          </p>
        ) : !rules.data?.length ? (
          <div className="rounded-lg border border-dashed border-border p-6">
            <p className="font-medium">Start with one recurring task.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose low stock, cash runway, or urgent support tickets. Every
              action appears in the activity list below.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {rules.data.map((rule) => (
              <li
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium break-words">{rule.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rule.triggerType.replaceAll("_", " ")} ·{" "}
                    {rule.actionType.replaceAll("_", " ")} ·{" "}
                    {rule.active ? "Active" : "Paused"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={toggle.isPending}
                    onClick={() =>
                      toggle.mutate({ id: rule.id, active: !rule.active })
                    }
                  >
                    {rule.active ? "Pause" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(rule.id)}
                  >
                    Delete rule
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="activity-title">
        <h3 id="activity-title" className="text-lg font-semibold mb-3">
          Activity and approvals
        </h3>
        {runs.isPending ? (
          <p className="text-sm" role="status">
            Loading activity…
          </p>
        ) : !runs.data?.length ? (
          <p className="text-sm text-muted-foreground">
            No runs yet. Create a rule, add matching business records, then run
            checks.
          </p>
        ) : (
          <ol className="space-y-5">
            {runs.data.map((run) => (
              <li key={run.id} className="rounded-lg border border-border p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="font-medium break-words">{run.ruleName}</h4>
                  <span className="text-sm">{statusLabel[run.status]}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {new Date(run.createdAt).toLocaleString()} · Attempt{" "}
                  {run.attempts}
                </p>
                {run.output && (
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {run.output}
                  </p>
                )}
                {run.error && (
                  <p className="mt-3 text-sm text-destructive">{run.error}</p>
                )}
                {run.actionType === "ai_reply" && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    This draft has not been sent to the customer.
                  </p>
                )}
                {run.status === "awaiting_approval" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={review.isPending}
                      onClick={() =>
                        review.mutate({ id: run.id, decision: "approve" })
                      }
                    >
                      {run.actionType === "auto_task"
                        ? "Approve and create task"
                        : "Approve draft"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={review.isPending}
                      onClick={() =>
                        review.mutate({ id: run.id, decision: "dismiss" })
                      }
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
                {run.status === "failed" && (
                  <Button
                    className="mt-4"
                    size="sm"
                    variant="outline"
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate({ id: run.id, decision: "retry" })
                    }
                  >
                    Retry run
                  </Button>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
