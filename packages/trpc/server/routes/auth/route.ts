import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { z, zodUndefinedModel } from "../../schema";
import { userService } from "../../services";

import {
  authenticateUserWithEmailPasswordInputSchema,
  authenticateUserWithEmailPasswordOutputSchema,
  createUserWithEmailPasswordInputSchema,
  createUserWithEmailPasswordOutputSchema,
  getAuthenticationMethodOutputSchema,
  getUserInfoOutputSchema,
  undefinedModel,
} from "@repo/services/user/model";

import { clearAccessTokenCookie, setAccessTokenCookie } from "../../context";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  getSupportedAuthenticationProviders: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/supported-providers"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.readonly(z.array(getAuthenticationMethodOutputSchema)))
    .query(async () => {
      const supportedMethods = await userService.getAuthenticationMethods();
      return supportedMethods;
    }),

  createUserWithEmailPassword: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/register"), tags: TAGS } })
    .input(createUserWithEmailPasswordInputSchema)
    .output(createUserWithEmailPasswordOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const { firstName, lastName, email, password } = input;

      const result = await userService.createUserWithEmailPassword({
        firstName,
        lastName,
        email,
        password,
      });

      setAccessTokenCookie(ctx, result.token);

      return {
        id: result.id,
        email: result.email,
      };
    }),

  authenticateWithEmailPassword: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/login"), tags: TAGS } })
    .input(authenticateUserWithEmailPasswordInputSchema)
    .output(authenticateUserWithEmailPasswordOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      const result = await userService.authenticateUserWithEmailPassword({ email, password });

      setAccessTokenCookie(ctx, result.token);

      return {
        id: result.id,
        email: result.email,
      };
    }),

  getUserInfo: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/me"), tags: TAGS } })
    .input(undefinedModel)
    .output(getUserInfoOutputSchema)
    .query(async ({ ctx }) => {
      const { id } = ctx.user;

      const userInfo = await userService.getUserInfo(id);

      return {
        id: userInfo.id,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userInfo.email,
        emailVerified: userInfo.emailVerified,
        role: userInfo.role,
        ProfileImage: userInfo.ProfileImage,
      };
    }),

  deleteAccessToken: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/logout"), tags: TAGS } })
    .input(undefinedModel)
    .output(undefinedModel)
    .query(async ({ ctx }) => {
      clearAccessTokenCookie(ctx);
    }),
});
