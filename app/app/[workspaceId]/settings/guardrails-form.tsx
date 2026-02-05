'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateGuardrails } from '@/server/actions/guardrails';

interface Guardrails {
  maxBudgetChangePercentDaily: number;
  maxPausesPerDay: number;
  minSpendZar: number;
  maxSpendZar: number | null;
  requireApprovalFor: string[];
}

interface GuardrailsFormProps {
  workspaceId: string;
  initialData: Guardrails | null;
}

const APPROVAL_OPTIONS = [
  { value: 'PAUSE_CAMPAIGN', label: 'Pause Campaign' },
  { value: 'PAUSE_ADSET', label: 'Pause Ad Set' },
  { value: 'BUDGET_INCREASE', label: 'Budget Increase' },
  { value: 'BUDGET_DECREASE', label: 'Budget Decrease' },
  { value: 'BUDGET_CHANGE_>20', label: 'Budget Change > 20%' },
  { value: 'BUDGET_CHANGE_>50', label: 'Budget Change > 50%' },
];

export function GuardrailsForm({ workspaceId, initialData }: GuardrailsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<Guardrails>({
    maxBudgetChangePercentDaily: initialData?.maxBudgetChangePercentDaily ?? 20,
    maxPausesPerDay: initialData?.maxPausesPerDay ?? 5,
    minSpendZar: initialData?.minSpendZar ?? 100,
    maxSpendZar: initialData?.maxSpendZar ?? null,
    requireApprovalFor: initialData?.requireApprovalFor ?? [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await updateGuardrails(workspaceId, formData);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save guardrails');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof Guardrails, value: number | string[] | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleApprovalOption = (option: string) => {
    const current = formData.requireApprovalFor;
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    handleChange('requireApprovalFor', updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="maxBudgetChangePercentDaily">Max Budget Change % / Day</Label>
          <Input
            id="maxBudgetChangePercentDaily"
            type="number"
            step="1"
            min="0"
            max="100"
            value={formData.maxBudgetChangePercentDaily}
            onChange={(e) =>
              handleChange('maxBudgetChangePercentDaily', parseInt(e.target.value) || 0)
            }
          />
          <p className="text-xs text-muted-foreground">
            Maximum percentage a budget can change in a single day
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxPausesPerDay">Max Pauses / Day</Label>
          <Input
            id="maxPausesPerDay"
            type="number"
            step="1"
            min="0"
            value={formData.maxPausesPerDay}
            onChange={(e) => handleChange('maxPausesPerDay', parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of entities that can be paused in a single day
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minSpendZar">Min Spend Threshold (ZAR)</Label>
          <Input
            id="minSpendZar"
            type="number"
            step="0.01"
            min="0"
            value={formData.minSpendZar}
            onChange={(e) => handleChange('minSpendZar', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Minimum spend before taking action on an entity
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxSpendZar">Max Daily Spend Cap (ZAR)</Label>
          <Input
            id="maxSpendZar"
            type="number"
            step="0.01"
            min="0"
            placeholder="No cap"
            value={formData.maxSpendZar ?? ''}
            onChange={(e) =>
              handleChange('maxSpendZar', e.target.value ? parseFloat(e.target.value) : null)
            }
          />
          <p className="text-xs text-muted-foreground">
            Maximum daily spend across all channels (leave empty for no cap)
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Require Approval For</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Select which actions require manual approval before execution
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {APPROVAL_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={formData.requireApprovalFor.includes(option.value)}
                onChange={() => toggleApprovalOption(option.value)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20 rounded-md">
          Guardrails saved successfully!
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Guardrails'}
        </Button>
      </div>
    </form>
  );
}
