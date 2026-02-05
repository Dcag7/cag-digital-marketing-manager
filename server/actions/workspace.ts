'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

export async function createWorkspace(data: z.infer<typeof createWorkspaceSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const validated = createWorkspaceSchema.parse(data);

  // Check if slug exists
  const existing = await prisma.workspace.findUnique({
    where: { slug: validated.slug },
  });
  if (existing) {
    throw new Error('Workspace slug already exists');
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: validated.name,
      slug: validated.slug,
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
      guardrails: {
        create: {},
      },
      businessProfile: {
        create: {
          targetCpaZar: 0,
          breakEvenRoas: 1.0,
          grossMarginPct: 0.5,
        },
      },
    },
  });

  revalidatePath('/app');
  return workspace;
}

export async function getUserWorkspaces() {
  const { userId } = await auth();
  if (!userId) return [];

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return memberships.map(m => ({
    ...m.workspace,
    role: m.role,
  }));
}

export async function getWorkspaceMember(workspaceId: string) {
  const { userId } = await auth();
  if (!userId) return null;

  return prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });
}

export async function checkWorkspaceAccess(
  workspaceId: string,
  requiredRole?: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER'
) {
  const member = await getWorkspaceMember(workspaceId);
  if (!member) return false;

  if (!requiredRole) return true;

  const roleHierarchy = {
    VIEWER: 0,
    OPERATOR: 1,
    ADMIN: 2,
    OWNER: 3,
  };

  return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
}

export async function getWorkspaceMembers(workspaceId: string) {
  const hasAccess = await checkWorkspaceAccess(workspaceId, 'ADMIN');
  if (!hasAccess) throw new Error('Unauthorized');

  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

const updateMemberRoleSchema = z.object({
  memberId: z.string(),
  role: z.enum(['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']),
});

export async function updateMemberRole(data: z.infer<typeof updateMemberRoleSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const validated = updateMemberRoleSchema.parse(data);

  // Get the member to find workspace
  const member = await prisma.workspaceMember.findUnique({
    where: { id: validated.memberId },
  });
  if (!member) throw new Error('Member not found');

  // Check if current user is ADMIN or OWNER
  const currentMember = await getWorkspaceMember(member.workspaceId);
  if (!currentMember || (currentMember.role !== 'OWNER' && currentMember.role !== 'ADMIN')) {
    throw new Error('Unauthorized');
  }

  // Prevent changing OWNER role
  const existingMember = await prisma.workspaceMember.findUnique({
    where: { id: validated.memberId },
  });
  if (existingMember?.role === 'OWNER' && validated.role !== 'OWNER') {
    throw new Error('Cannot change OWNER role');
  }

  await prisma.workspaceMember.update({
    where: { id: validated.memberId },
    data: { role: validated.role },
  });

  revalidatePath(`/app/${member.workspaceId}/settings`);
}

const addMemberSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']),
});

export async function addMember(data: z.infer<typeof addMemberSchema>) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error('Unauthorized');

  const validated = addMemberSchema.parse(data);

  // Check if current user is ADMIN or OWNER
  const hasAccess = await checkWorkspaceAccess(validated.workspaceId, 'ADMIN');
  if (!hasAccess) throw new Error('Unauthorized');

  // Check if member already exists
  const existing = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: validated.workspaceId,
        userId: validated.userId,
      },
    },
  });
  if (existing) throw new Error('User is already a member of this workspace');

  await prisma.workspaceMember.create({
    data: {
      workspaceId: validated.workspaceId,
      userId: validated.userId,
      role: validated.role,
    },
  });

  revalidatePath(`/app/${validated.workspaceId}/settings`);
}

export async function removeMember(workspaceId: string, memberId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Check if current user is ADMIN or OWNER
  const hasAccess = await checkWorkspaceAccess(workspaceId, 'ADMIN');
  if (!hasAccess) throw new Error('Unauthorized');

  // Get the member to verify
  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!member || member.workspaceId !== workspaceId) {
    throw new Error('Member not found');
  }

  // Prevent removing OWNER
  if (member.role === 'OWNER') {
    throw new Error('Cannot remove workspace owner');
  }

  // Prevent removing yourself
  if (member.userId === userId) {
    throw new Error('Cannot remove yourself');
  }

  await prisma.workspaceMember.delete({
    where: { id: memberId },
  });

  revalidatePath(`/app/${workspaceId}/settings`);
}
