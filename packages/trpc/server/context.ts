import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import {
  createCookieFactory,
  getCookieFactory,
  clearCookesFactory,
} from "./utils/cookes-factory-methods";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const ctx = {
    createCookie: createCookieFactory(res),
    getCookie: getCookieFactory(req),
    clearCookie: clearCookesFactory(res),
  };

  return ctx;
}
export type Context = Awaited<ReturnType<typeof createContext>>;

// Auth Cookies Utils

export const setAccessTokenCookie = (ctx: Context, token: string) => {
  ctx.createCookie("Authentication", token);
};
