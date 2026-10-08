import { queryOptions } from "@tanstack/react-query";
import { getSession } from "./server-functions";
export const sessionOptions = queryOptions({
  queryKey: ["session"],
  queryFn: () => getSession(),
  retry: false,
  staleTime: 30_000,
});
