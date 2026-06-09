import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";

import { prisma } from "@/lib/db";
import { getUserById } from "@/lib/user";

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole;
      accessToken?: string;
      orgId?: string;
    } & DefaultSession["user"];
  }
}

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ token, session }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.email) session.user.email = token.email;
        if (token.role) session.user.role = token.role as UserRole;
        session.user.name = token.name;
        session.user.image = token.picture;
        if (token.accessToken) session.user.accessToken = token.accessToken as string;
        if (token.orgId) session.user.orgId = token.orgId as string;
      }
      return session;
    },

    async jwt({ token, account }) {
      if (!token.sub) return token;

      const dbUser = await getUserById(token.sub);
      if (!dbUser) return token;

      token.name = dbUser.name;
      token.email = dbUser.email;
      token.picture = dbUser.image;
      token.role = dbUser.role;

      // La primul login Google, apelăm backend-ul pentru access_token + org_id
      if (account?.provider === "google" && account.id_token) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";
          const res = await fetch(`${apiUrl}/api/v1/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
          });
          if (res.ok) {
            const data = await res.json();
            token.accessToken = data.access_token;
            token.orgId = data.org_id;
          }
        } catch {
          // Backend down — login continuă fără token backend
        }
      }

      return token;
    },
  },
  ...authConfig,
});
