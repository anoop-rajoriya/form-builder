import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext, getAccessTokenCookie } from "./context";
import { userService } from "./services";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<typeof createContext>().create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const protectedProcedure = tRPCContext.procedure.use(({ ctx, next }) => {
  const token = getAccessTokenCookie(ctx);

  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const user = userService.verifyUserToken(token);

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  return next({ ctx: { ...ctx, user } });
});
