import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import type { AddressBodyInput, UpdateAddressInput } from '../validators/address.validator';

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

/** Fetches an address the user owns, or throws 404. */
export async function getOwnedAddress(userId: string, id: string) {
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) throw ApiError.notFound('Address not found');
  return address;
}

export async function createAddress(userId: string, data: AddressBodyInput) {
  const count = await prisma.address.count({ where: { userId } });
  // First address is always default; otherwise honour the flag.
  const makeDefault = count === 0 ? true : Boolean(data.isDefault);

  return prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: {
        userId,
        label: data.label ?? null,
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 ?? null,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode ?? null,
        isDefault: makeDefault,
      },
    });
  });
}

export async function updateAddress(userId: string, id: string, data: UpdateAddressInput) {
  await getOwnedAddress(userId, id);
  return prisma.$transaction(async (tx) => {
    if (data.isDefault === true) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.update({
      where: { id },
      data: {
        label: data.label ?? undefined,
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 ?? undefined,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode ?? undefined,
        isDefault: data.isDefault,
      },
    });
  });
}

export async function setDefault(userId: string, id: string) {
  await getOwnedAddress(userId, id);
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  return listAddresses(userId);
}

export async function deleteAddress(userId: string, id: string) {
  const address = await getOwnedAddress(userId, id);
  await prisma.address.delete({ where: { id } });
  // Promote another address to default if we removed the default one.
  if (address.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return listAddresses(userId);
}
