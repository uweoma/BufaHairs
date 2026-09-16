import type { User } from '@prisma/client';

export type PublicUser = Omit<User, 'passwordHash'>;

/** Strips sensitive fields before sending a user to the client. */
export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}
