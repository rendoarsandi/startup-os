import { useCallback, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { sendChat } from "../lib/server-functions";
import { sessionOptions } from "../lib/query-options";

type Role = "cfo" | "marketer" | "hr" | "operations";
export interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}
export function useChat(activeRole: Role) {
  const { data: session } = useQuery(sessionOptions);
  const [messagesMap, setMessagesMap] = useState<Record<Role, Message[]>>({
    cfo: [],
    marketer: [],
    hr: [],
    operations: [],
  });
  const mutation = useMutation({
    mutationFn: async ({
      text,
      role,
      history,
    }: {
      text: string;
      role: Role;
      history: Message[];
    }) => {
      let activeScenario = null;
      try {
        const prefix = `startup-os:${session?.user.id || "anonymous"}:scenario`;
        if (
          role === "cfo" &&
          localStorage.getItem(`${prefix}:active`) === "true"
        )
          activeScenario = JSON.parse(
            localStorage.getItem(`${prefix}:inputs`) || "null",
          );
      } catch {
        /* Ignore malformed local simulation data. */
      }
      return (
        await sendChat({
          data: {
            message: text,
            role,
            history: history.slice(-30),
            activeScenario,
          },
        })
      ).response;
    },
    onMutate: ({ text, role }) =>
      setMessagesMap((previous) => ({
        ...previous,
        [role]: [...previous[role], { role: "user", parts: [{ text }] }],
      })),
    onSuccess: (text, { role }) =>
      setMessagesMap((previous) => ({
        ...previous,
        [role]: [...previous[role], { role: "model", parts: [{ text }] }],
      })),
  });
  const { mutate } = mutation;
  const sendMessage = useCallback(
    (text: string) =>
      mutate({ text, role: activeRole, history: messagesMap[activeRole] }),
    [mutate, activeRole, messagesMap],
  );
  return {
    messages: messagesMap[activeRole],
    sendMessage,
    clearChat: () =>
      setMessagesMap((previous) => ({ ...previous, [activeRole]: [] })),
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
  };
}
