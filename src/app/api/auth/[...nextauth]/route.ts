import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
// import { FirestoreAdapter } from '@auth/firebase-adapter';
// import { cert } from 'firebase-admin/app';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // Temporarily disable Firebase adapter for development
  // adapter: FirestoreAdapter({
  //   credential: cert({
  //     projectId: process.env.FIREBASE_PROJECT_ID,
  //     clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  //     privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  //   }),
  // }),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});

export { handler as GET, handler as POST }; 