import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

type AppUser = {
  username: string;
  passwordHash: string;
  role: 'pramukh' | 'uppramukh' | 'developer';
  name: string;
};

function getAllowedUsers(): AppUser[] {
  return [
    { username: process.env.PRAMUKH_USERNAME!, passwordHash: process.env.PRAMUKH_PASSWORD_HASH!, role: 'pramukh', name: 'Pramukh' },
    { username: process.env.UPPRAMUKH_USERNAME!, passwordHash: process.env.UPPRAMUKH_PASSWORD_HASH!, role: 'uppramukh', name: 'UpPramukh' },
    { username: process.env.DEVELOPER_USERNAME!, passwordHash: process.env.DEVELOPER_PASSWORD_HASH!, role: 'developer', name: 'Developer' },
  ];
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8 hour sessions
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      authorize: async (credentials) => {
        try {
            const username = credentials?.username as string | undefined;
            const password = credentials?.password as string | undefined;
            console.log('Login attempt - username:', username);
            console.log('Password received length:', password?.length);

            if (!username || !password) return null;

            const users = getAllowedUsers();
            console.log('Configured usernames:', users.map(u => u.username));

            const match = users.find((u) => u.username === username);
            console.log('Match found:', !!match);
            if (!match) return null;

            console.log('Hash being compared against:', match.passwordHash);
            console.log('Hash length (should be exactly 60):', match.passwordHash?.length);

            const valid = await bcrypt.compare(password, match.passwordHash);
            console.log('Password valid:', valid);

            if (!valid) return null;
            return { id: match.username, name: match.name, role: match.role };
        } catch (err) {
            console.error('AUTHORIZE THREW AN ERROR:', err);
            return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as any).role;
        token.name = user.name;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) (session.user as any).role = token.role;
      return session;
    },
  },
});