import { Response, Request, CookieOptions } from "express";

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_MONTH = 28 * ONE_DAY;
const ONE_YEAR = 12 * ONE_MONTH;

const defaultCookieOptions: CookieOptions = {
  path: "/",
  httpOnly: true,
  secure: false,
  sameSite: "strict",
  maxAge: ONE_YEAR,
};

export const createCookieFactory = (res: Response) => {
  return (name: string, value: string, options: CookieOptions = defaultCookieOptions) => {
    res.cookie(name, value, options);
  };
};

export const getCookieFactory = (req: Request) => {
  return (name: string) => {
    return req.cookies[name];
  };
};

export const clearCookesFactory = (res: Response) => {
  return (name: string) => {
    res.clearCookie(name);
  };
};
