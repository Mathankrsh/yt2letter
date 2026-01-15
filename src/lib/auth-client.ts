import { createAuthClient } from "better-auth/react";
import { getBaseUrl } from "./get-base-url";

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});
