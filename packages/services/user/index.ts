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
  GenerateTokenPaylod,
} from "./model";

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
      throw error;
    }
  }

  private getToken(len = 12) {
    return crypto.randomBytes(len).toString("hex");
  }

  private generateToken(payload: GenerateTokenPaylod): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
  }

  private generateHash(payload: string, secret: string) {
    return crypto
      .createHmac("sha256", secret)
      .update(payload + secret)
      .digest("base64");
  }

  public async createUserWithEmailPassword(
    payload: CreateUserWithEmailPasswordInputSchema,
  ): Promise<CreateUserWithEmailPasswordOutputSchema & { token: string }> {
    const { data, success, error } =
      await createUserWithEmailPasswordInputSchema.safeParseAsync(payload);

    if (!success) {
      console.error(JSON.stringify(error));
      throw new Error("invalid request body");
    }

    const { firstName, lastName, email, password } = data;

    const existingUser = await this.getUserByEmail(email);
    if (existingUser) throw new Error(`User with email ${email} already exist`);

    const secret = this.getToken();
    const hashedPassword = this.generateHash(password, secret);

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
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        role: usersTable.role,
      });

    if (!createdUser || !createdUser.id || !createdUser.role)
      throw new Error("User creation failed");

    const token = this.generateToken({
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
    });

    return {
      id: createdUser.id,
      email: createdUser.email,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName || undefined,
      profilPicture: createdUser.profileImageUrl || undefined,
      token,
    };
  }
}

export default UserService;
