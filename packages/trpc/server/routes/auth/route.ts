import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { z, zodUndefinedModel } from "../../schema";
import { userService } from "../../services";
import {
  createUserWithEmailPasswordInputSchema,
  createUserWithEmailPasswordOutputSchema,
  getAuthenticationMethodOutputSchema,
} from "@repo/services/user/model";
import { setAccessTokenCookie } from "../../context";

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
        firstName: result.firstName,
        lastName: result.lastName,
      };
    }),
});
