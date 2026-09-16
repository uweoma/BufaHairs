import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface UserPrincipal {
      id: string;
      email: string;
      role: Role;
    }
    interface Request {
      user?: UserPrincipal;
    }
  }
}

export {};
