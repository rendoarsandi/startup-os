import { createStart, createCsrfMiddleware } from "@tanstack/react-start";

// A custom Start entry replaces the framework's default middleware list.
export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({
      filter: (context) => context.handlerType === "serverFn",
    }),
  ],
}));
