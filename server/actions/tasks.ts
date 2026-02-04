'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { checkWorkspaceAccess } from './workspace';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

export async function createTask(
  workspaceId: string,
  data: z.infer<typeof createTaskSchema>
) {
  const hasAccess = await checkWorkspaceAccess(workspaceId, 'OPERATOR');
  if (!hasAccess) throw new Error('Unauthorized');

  const validated = createTaskSchema.parse(data);

  await prisma.task.create({
    data: {
      workspaceId,
      title: validated.title,
      description: validated.description || null,
      priority: validated.priority || 'MEDIUM',
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      assigneeId: validated.assigneeId || null,
    },
  });

  revalidatePath(`/app/${workspaceId}/tasks`);
}

const updateTaskSchema = z.object({
  taskId: z.string(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

export async function updateTask(
  workspaceId: string,
  data: z.infer<typeof updateTaskSchema>
) {
  const hasAccess = await checkWorkspaceAccess(workspaceId, 'OPERATOR');
  if (!hasAccess) throw new Error('Unauthorized');

  const validated = updateTaskSchema.parse(data);

  await prisma.task.update({
    where: { id: validated.taskId },
    data: {
      status: validated.status,
      priority: validated.priority,
    },
  });

  revalidatePath(`/app/${workspaceId}/tasks`);
}
