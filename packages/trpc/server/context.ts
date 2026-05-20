import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import {
  createCookieFactory,
  getCookieFactory,
  clearCookesFactory,
} from "./utils/cookes-factory-methods";
import { UserTokenPaylod } from "@repo/services/user/model";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const ctx = {
    createCookie: createCookieFactory(res),
    getCookie: getCookieFactory(req),
    clearCookie: clearCookesFactory(res),
    user: null as UserTokenPaylod | null,
  };

  return ctx;
}
export type Context = Awaited<ReturnType<typeof createContext>>;

// Auth Cookies Utils

const COOKIE_KEY = "authentication";

export const setAccessTokenCookie = (ctx: Context, token: string) => {
  ctx.createCookie(COOKIE_KEY, token);
};

export const getAccessTokenCookie = (ctx: Context) => {
  return ctx.getCookie(COOKIE_KEY);
};

export const clearAccessTokenCookie = (ctx: Context) => {
  ctx.clearCookie(COOKIE_KEY);
};
