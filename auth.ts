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

// Resincronizăm token-ul backend cu 24h înainte să expire (TTL backend = 7 zile)
const TOKEN_REFRESH_MARGIN_MS = 24 * 60 * 60 * 1000;

function getJwtExpiryMs(jwt: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString());
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
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

    async jwt({ token }) {
      if (!token.sub) return token;

      const dbUser = await getUserById(token.sub);
      if (!dbUser) return token;

      token.name = dbUser.name;
      token.email = dbUser.email;
      token.picture = dbUser.image;
      token.role = dbUser.role;

      // Citim accessToken și orgId din Prisma (salvate la sync cu backend)
      if (dbUser.accessToken) token.accessToken = dbUser.accessToken;
      if (dbUser.orgId) token.orgId = dbUser.orgId;

      // Sincronizăm cu backend-ul când token-ul lipsește SAU expiră în <24h
      // (nu doar la primul login — altfel după 7 zile rămâne 401 permanent)
      const expiryMs = dbUser.accessToken ? getJwtExpiryMs(dbUser.accessToken) : null;
      const needsSync =
        !dbUser.accessToken ||
        !dbUser.orgId ||
        !expiryMs ||
        expiryMs < Date.now() + TOKEN_REFRESH_MARGIN_MS;

      if (needsSync) {
        try {
          // Server-side: preferă URL-ul intern (localhost pe Hetzner), nu ruta publică
          const apiUrl =
            process.env.API_URL_INTERNAL ||
            process.env.NEXT_PUBLIC_API_URL ||
            "http://localhost:8002";
          const res = await fetch(`${apiUrl}/api/v1/internal/sync-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: dbUser.email,
              name: dbUser.name,
              image: dbUser.image,
              secret: process.env.INTERNAL_API_SECRET,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.accessToken = data.access_token;
            token.orgId = data.org_id;
            // Salvăm în Prisma pentru sesiunile viitoare
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { accessToken: data.access_token, orgId: data.org_id },
            });
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
