'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { checkWorkspaceAccess } from './workspace';
import { encryptJson, decryptJson } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';

export async function getIntegrations(workspaceId: string) {
  const hasAccess = await checkWorkspaceAccess(workspaceId);
  if (!hasAccess) throw new Error('Unauthorized');

  return prisma.integration.findMany({
    where: { workspaceId },
    orderBy: { type: 'asc' },
  });
}

export async function getIntegrationSecret(
  workspaceId: string,
  integrationType: 'META' | 'SHOPIFY' | 'GOOGLE_ADS'
) {
  const hasAccess = await checkWorkspaceAccess(workspaceId, 'ADMIN');
  if (!hasAccess) throw new Error('Unauthorized');

  const secret = await prisma.encryptedSecret.findUnique({
    where: {
      workspaceId_integrationType: {
        workspaceId,
        integrationType,
      },
    },
  });

  if (!secret) return null;

  try {
    return decryptJson(secret.encryptedJson);
  } catch (error) {
    throw new Error('Failed to decrypt secret');
  }
}

export async function saveIntegrationSecret(
  workspaceId: string,
  integrationType: 'META' | 'SHOPIFY' | 'GOOGLE_ADS',
  data: unknown
) {
  const hasAccess = await checkWorkspaceAccess(workspaceId, 'ADMIN');
  if (!hasAccess) throw new Error('Unauthorized');

  const encrypted = encryptJson(data);

  await prisma.encryptedSecret.upsert({
    where: {
      workspaceId_integrationType: {
        workspaceId,
        integrationType,
      },
    },
    create: {
      workspaceId,
      integrationType,
      encryptedJson: encrypted,
    },
    update: {
      encryptedJson: encrypted,
    },
  });

  revalidatePath(`/app/${workspaceId}/settings`);
}

export async function updateIntegrationStatus(
  workspaceId: string,
  integrationType: 'META' | 'SHOPIFY' | 'GOOGLE_ADS',
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR',
  metadata?: object
) {
  const hasAccess = await checkWorkspaceAccess(workspaceId, 'ADMIN');
  if (!hasAccess) throw new Error('Unauthorized');

  await prisma.integration.upsert({
    where: {
      workspaceId_type: {
        workspaceId,
        type: integrationType,
      },
    },
    create: {
      workspaceId,
      type: integrationType,
      status,
      connectedAt: status === 'CONNECTED' ? new Date() : null,
      metadata: metadata || null,
    },
    update: {
      status,
      connectedAt: status === 'CONNECTED' ? new Date() : null,
      metadata: metadata || null,
    },
  });

  revalidatePath(`/app/${workspaceId}/settings`);
}
