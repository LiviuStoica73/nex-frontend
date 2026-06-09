import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { prisma } from "@/lib/db";

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
  session: { strategy: "database" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.EMAIL_FROM!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = (user as any).role;
        // PrismaAdapter nu include câmpurile custom — citim direct din DB
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { accessToken: true, orgId: true },
        });
        session.user.accessToken = dbUser?.accessToken ?? undefined;
        session.user.orgId = dbUser?.orgId ?? undefined;
      }
      return session;
    },

    async signIn({ user, account }) {
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
            // Salvăm token-ul și orgId pe userul Prisma pentru a le accesa în session callback
            await prisma.user.update({
              where: { id: user.id! },
              data: {
                accessToken: data.access_token,
                orgId: data.org_id,
              } as any,
            });
          }
        } catch {
          // Backend down — login continuă oricum via Prisma
        }
      }
      return true;
    },
  },
  debug: false,
});
