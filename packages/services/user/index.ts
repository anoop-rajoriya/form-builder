import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import { db, eq } from "@repo/database";
import { usersTable, userTokensTable } from "@repo/database/schema";
import { env } from "../env";

import { googleOAuth2Client } from "../clients/google-oauth";
import {
  createUserWithEmailPasswordInputSchema,
  CreateUserWithEmailPasswordInputSchema,
  CreateUserWithEmailPasswordOutputSchema,
  GetAuthenticationMethodOutputSchema,
  UserTokenPaylod,
  AuthenticateUserWithEmailPasswordInputSchema,
  AuthenticateUserWithEmailPasswordOutputSchema,
  authenticateUserWithEmailPasswordInputSchema,
  GetUserInfoOutputSchema,
} from "./model";
import { getSystemErrorMessage } from "node:util";

class UserService {
  public async getAuthenticationMethods(): Promise<
    ReadonlyArray<GetAuthenticationMethodOutputSchema>
  > {
    const supportedAuthenticationProviders: GetAuthenticationMethodOutputSchema[] = [];

    const isGoogleConfigured = !!(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);

    if (isGoogleConfigured) {
      const url = googleOAuth2Client.generateAuthUrl();
      supportedAuthenticationProviders.push({
        provider: "GOOGLE_OAUTH",
        displayName: "Google",
        displayText: "Signin with Google",
        authUrl: url,
      });
    }

    return supportedAuthenticationProviders;
  }

  private async getUserByEmail(email: string) {
    try {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

      return user;
    } catch (error) {
      throw new Error(`user with email ${email} not found`);
    }
  }

  private async getUserById(id: string) {
    try {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);

      return user;
    } catch (error) {
      throw new Error(`user not found`);
    }
  }

  private getToken(len = 12) {
    return crypto.randomBytes(len).toString("hex");
  }

  private generateHash(payload: string, secret: string) {
    return crypto
      .createHmac("sha256", secret)
      .update(payload + secret)
      .digest("base64");
  }

  private generateUserToken(payload: UserTokenPaylod): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
  }

  public verifyUserToken(token: string): UserTokenPaylod {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as UserTokenPaylod;
      return payload;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  public async createUserWithEmailPassword(
    payload: CreateUserWithEmailPasswordInputSchema,
  ): Promise<CreateUserWithEmailPasswordOutputSchema & { token: string }> {
    const { data, success } = await createUserWithEmailPasswordInputSchema.safeParseAsync(payload);

    if (!success) {
      throw new Error("invalid request body");
    }

    const { firstName, lastName, email, password } = data;

    const existingUser = await this.getUserByEmail(email);

    if (existingUser) {
      throw new Error(`User with email ${email} already exist`);
    }

    const secret = this.getToken();
    const hashedPassword = this.generateHash(password, secret);

    try {
      const [createdUser] = await db
        .insert(usersTable)
        .values({
          firstName,
          lastName,
          email,
          password: hashedPassword,
          secret,
        })
        .returning({
          id: usersTable.id,
          email: usersTable.email,
          role: usersTable.role,
        });

      if (!createdUser || !createdUser.role) throw new Error("User creation failed");

      const token = this.generateUserToken({
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
      });

      return {
        id: createdUser.id,
        email: createdUser.email,
        token,
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(`user creation failed`);
      }
      throw new Error("user registration failed");
    }
  }

  public async authenticateUserWithEmailPassword(
    payload: AuthenticateUserWithEmailPasswordInputSchema,
  ): Promise<AuthenticateUserWithEmailPasswordOutputSchema & { token: string }> {
    const { success, data } =
      await authenticateUserWithEmailPasswordInputSchema.safeParseAsync(payload);

    if (!success) {
      throw new Error("Invalid email or password");
    }

    const { email, password } = data;

    const existingUser = await this.getUserByEmail(email);

    if (!existingUser || !existingUser.secret || !existingUser.role) {
      throw new Error("Invalid email or password");
    }

    const hashedPassword = this.generateHash(password, existingUser.secret);

    if (existingUser.password !== hashedPassword) {
      throw new Error("Invalid email or password");
    }

    const token = this.generateUserToken({
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    });

    return {
      id: existingUser.id,
      email: existingUser.email,
      token,
    };
  }

  public async getUserInfo(id: string): Promise<GetUserInfoOutputSchema> {
    const user = await this.getUserById(id);

    if (!user || !user.role) {
      throw new Error("user not found");
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName || undefined,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      ProfileImage: user.profileImageUrl,
    };
  }
}

export default UserService;
