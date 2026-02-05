'use server';

import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

type StrategicMode = 'GROWTH' | 'EFFICIENCY' | 'RECOVERY' | 'LIQUIDATION' | 'HOLD';

interface BusinessProfileData {
  targetCpaZar: number;
  breakEvenRoas: number;
  grossMarginPct: number;
  avgShippingCostZar: number;
  returnRatePct: number;
  paymentFeesPct: number;
  monthlySpendCapZar: number | null;
  strategicMode: StrategicMode;
}

// Alias for the settings page form
export async function updateBusinessProfile(
  workspaceId: string,
  data: BusinessProfileData
) {
  return saveBusinessProfile(workspaceId, data);
}

export async function getBusinessProfile(workspaceId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const profile = await prisma.workspaceBusinessProfile.findUnique({
    where: { workspaceId },
  });

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    targetCpaZar: profile.targetCpaZar,
    breakEvenRoas: profile.breakEvenRoas,
    grossMarginPct: profile.grossMarginPct,
    avgShippingCostZar: profile.avgShippingCostZar,
    returnRatePct: profile.returnRatePct,
    paymentFeesPct: profile.paymentFeesPct,
    monthlySpendCapZar: profile.monthlySpendCapZar,
    strategicMode: profile.strategicMode as StrategicMode,
  };
}

export async function saveBusinessProfile(
  workspaceId: string,
  data: BusinessProfileData
) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user has access to workspace
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });

  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    throw new Error('Unauthorized - Admin access required');
  }

  await prisma.workspaceBusinessProfile.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      targetCpaZar: data.targetCpaZar,
      breakEvenRoas: data.breakEvenRoas,
      grossMarginPct: data.grossMarginPct,
      avgShippingCostZar: data.avgShippingCostZar,
      returnRatePct: data.returnRatePct,
      paymentFeesPct: data.paymentFeesPct,
      monthlySpendCapZar: data.monthlySpendCapZar,
      strategicMode: data.strategicMode,
    },
    update: {
      targetCpaZar: data.targetCpaZar,
      breakEvenRoas: data.breakEvenRoas,
      grossMarginPct: data.grossMarginPct,
      avgShippingCostZar: data.avgShippingCostZar,
      returnRatePct: data.returnRatePct,
      paymentFeesPct: data.paymentFeesPct,
      monthlySpendCapZar: data.monthlySpendCapZar,
      strategicMode: data.strategicMode,
    },
  });

  revalidatePath(`/app/${workspaceId}/settings/business-profile`);
  revalidatePath(`/app/${workspaceId}/recommendations`);
  
  return { success: true };
}
