import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { User } from "@/types";
import { RowDataPacket } from "mysql2";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
            [credentials.email]
          );

          if (rows.length === 0) {
            return null;
          }

          const user = rows[0] as User;
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password || ''
          );

          if (!isPasswordValid) {
            return null;
          }

          // Fetch additional roles from user_roles table
          const [roleRows] = await pool.execute<RowDataPacket[]>(
            'SELECT role FROM user_roles WHERE user_id = ?',
            [user.id]
          );
          const additionalRoles = roleRows.map((r: any) => r.role);

          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            additionalRoles: additionalRoles
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.additionalRoles = (user as any).additionalRoles || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).additionalRoles = token.additionalRoles || [];
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET
};
