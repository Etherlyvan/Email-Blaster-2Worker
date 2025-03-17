// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // Fix: Remove unused parameters
    async signIn({ user }) {
      if (!user.email) return false;
      
      try {
        // Find or create user in our database
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        
        if (!existingUser) {
          await prisma.user.create({
            data: {
              name: user.name,
              email: user.email,
              image: user.image,
            },
          });
        }
        
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return true; // Continue sign in even if database operation fails
      }
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        
        // Fetch user from database to get the UUID
        if (session.user.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: session.user.email },
            });
            
            if (dbUser) {
              session.user.id = dbUser.id;
            }
          } catch (error) {
            console.error("Error fetching user in session callback:", error);
          }
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          id: user.id,
        };
      }
      
      return token;
    },
  },
  pages: {
    signIn: "/dashboard",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
};