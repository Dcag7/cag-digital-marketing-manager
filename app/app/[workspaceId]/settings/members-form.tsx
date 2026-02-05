'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { updateMemberRole, addMember, removeMember } from '@/server/actions/workspace';

interface Member {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
  createdAt: Date;
}

interface MembersFormProps {
  workspaceId: string;
  members: Member[];
  currentUserId: string;
}

const ROLE_COLORS = {
  OWNER: 'default',
  ADMIN: 'default',
  OPERATOR: 'secondary',
  VIEWER: 'outline',
} as const;

export function MembersForm({ workspaceId, members, currentUserId }: MembersFormProps) {
  const router = useRouter();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'ADMIN' | 'OPERATOR' | 'VIEWER'>('VIEWER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMember = async () => {
    if (!newMemberUserId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await addMember({
        workspaceId,
        userId: newMemberUserId.trim(),
        role: newMemberRole,
      });
      setSuccess('Member added successfully');
      setNewMemberUserId('');
      setIsAddingMember(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: Member['role']) => {
    setError('');
    setSuccess('');

    try {
      await updateMemberRole({ memberId, role: newRole });
      setSuccess('Role updated successfully');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await removeMember(workspaceId, memberId);
      setSuccess('Member removed successfully');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const currentMember = members.find((m) => m.userId === currentUserId);
  const canManage = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Member List */}
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium">
                  {member.userId.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">{member.userId}</p>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(member.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canManage && member.role !== 'OWNER' && member.userId !== currentUserId ? (
                <>
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      handleUpdateRole(member.id, value as Member['role'])
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="OPERATOR">Operator</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <Badge variant={ROLE_COLORS[member.role]}>{member.role}</Badge>
              )}
              {member.userId === currentUserId && (
                <span className="text-xs text-muted-foreground">(You)</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Member */}
      {canManage && (
        <div className="border-t pt-6">
          {isAddingMember ? (
            <div className="space-y-4">
              <h3 className="font-medium">Add New Member</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newMemberUserId">User ID (Clerk ID)</Label>
                  <Input
                    id="newMemberUserId"
                    placeholder="user_..."
                    value={newMemberUserId}
                    onChange={(e) => setNewMemberUserId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the Clerk user ID of the person you want to add
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newMemberRole">Role</Label>
                  <Select
                    value={newMemberRole}
                    onValueChange={(value) =>
                      setNewMemberRole(value as typeof newMemberRole)
                    }
                  >
                    <SelectTrigger id="newMemberRole">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin - Full access</SelectItem>
                      <SelectItem value="OPERATOR">Operator - Can execute</SelectItem>
                      <SelectItem value="VIEWER">Viewer - Read only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddMember} disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Member'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingMember(false);
                    setNewMemberUserId('');
                    setError('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsAddingMember(true)}>Add Member</Button>
          )}
        </div>
      )}

      {/* Role Descriptions */}
      <div className="bg-muted p-4 rounded-md text-sm">
        <p className="font-medium mb-2">Role Permissions</p>
        <ul className="space-y-1 text-muted-foreground">
          <li>
            <strong>Owner</strong> - Full access, can delete workspace
          </li>
          <li>
            <strong>Admin</strong> - Manage members, settings, and integrations
          </li>
          <li>
            <strong>Operator</strong> - Approve and execute recommendations
          </li>
          <li>
            <strong>Viewer</strong> - View data and reports only
          </li>
        </ul>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20 rounded-md">
          {success}
        </div>
      )}
    </div>
  );
}
