import { email, z } from "zod";

export const getAuthenticationMethodOutputSchema = z.object({
  provider: z.enum(["GOOGLE_OAUTH"]),
  displayName: z.string().optional(),
  displayText: z.string().optional(),
  authUrl: z.string(),
});
export type GetAuthenticationMethodOutputSchema = z.infer<
  typeof getAuthenticationMethodOutputSchema
>;

export const createUserWithEmailPasswordInputSchema = z.object({
  firstName: z.string().describe("user first name"),
  lastName: z.string().describe("user last name").optional(),
  email: z.email().describe("user email"),
  password: z.string().describe("user password"),
});

export const createUserWithEmailPasswordOutputSchema = z.object({
  id: z.string().describe("user id"),
  email: z.email().describe("user email"),
});

export type CreateUserWithEmailPasswordInputSchema = z.infer<
  typeof createUserWithEmailPasswordInputSchema
>;
export type CreateUserWithEmailPasswordOutputSchema = z.infer<
  typeof createUserWithEmailPasswordOutputSchema
>;

export const authenticateUserWithEmailPasswordInputSchema = z.object({
  email: z.email().describe("user email"),
  password: z.string().describe("user password"),
});

export const authenticateUserWithEmailPasswordOutputSchema = z.object({
  id: z.string().describe("user id"),
  email: z.email().describe("user email"),
});

export type AuthenticateUserWithEmailPasswordInputSchema = z.infer<
  typeof authenticateUserWithEmailPasswordInputSchema
>;
export type AuthenticateUserWithEmailPasswordOutputSchema = z.infer<
  typeof authenticateUserWithEmailPasswordOutputSchema
>;

export const userTokenPaylod = z.object({
  id: z.string().describe("user id"),
  email: z.email().describe("user email"),
  role: z.enum(["USER", "ADMIN"]).describe("user role"),
});

export type UserTokenPaylod = z.infer<typeof userTokenPaylod>;

export const getUserInfoOutputSchema = z.object({
  id: z.string().describe("user id"),
  firstName: z.string().describe("user first name"),
  lastName: z.string().describe("user last name").optional().nullable(),
  email: z.email().describe("user email"),
  emailVerified: z.boolean().default(false).describe("user email verificaiton status").nullable(),
  role: z.enum(["USER", "ADMIN"]).describe("user role"),
  ProfileImage: z.string().describe("user profile image").optional().nullable(),
});

export type GetUserInfoOutputSchema = z.infer<typeof getUserInfoOutputSchema>;

export const undefinedModel = z.undefined();
export type UndefinedModel = z.infer<undefined>;
