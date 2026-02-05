'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateBusinessProfile } from '@/server/actions/business-profile';

interface BusinessProfile {
  targetCpaZar: number;
  breakEvenRoas: number;
  grossMarginPct: number;
  avgShippingCostZar: number;
  returnRatePct: number;
  paymentFeesPct: number;
  monthlySpendCapZar: number | null;
  strategicMode: 'GROWTH' | 'EFFICIENCY' | 'RECOVERY' | 'LIQUIDATION' | 'HOLD';
}

interface BusinessProfileFormProps {
  workspaceId: string;
  initialData: BusinessProfile | null;
}

export function BusinessProfileForm({ workspaceId, initialData }: BusinessProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<BusinessProfile>({
    targetCpaZar: initialData?.targetCpaZar ?? 150,
    breakEvenRoas: initialData?.breakEvenRoas ?? 2.5,
    grossMarginPct: initialData?.grossMarginPct ?? 0.4,
    avgShippingCostZar: initialData?.avgShippingCostZar ?? 50,
    returnRatePct: initialData?.returnRatePct ?? 0.05,
    paymentFeesPct: initialData?.paymentFeesPct ?? 0.03,
    monthlySpendCapZar: initialData?.monthlySpendCapZar ?? null,
    strategicMode: initialData?.strategicMode ?? 'GROWTH',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await updateBusinessProfile(workspaceId, formData);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save business profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof BusinessProfile, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="targetCpaZar">Target CPA (ZAR)</Label>
          <Input
            id="targetCpaZar"
            type="number"
            step="0.01"
            value={formData.targetCpaZar}
            onChange={(e) => handleChange('targetCpaZar', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Maximum cost per acquisition you&apos;re willing to pay
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="breakEvenRoas">Break-even ROAS</Label>
          <Input
            id="breakEvenRoas"
            type="number"
            step="0.01"
            value={formData.breakEvenRoas}
            onChange={(e) => handleChange('breakEvenRoas', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Minimum ROAS needed to break even on ad spend
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="grossMarginPct">Gross Margin %</Label>
          <Input
            id="grossMarginPct"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={formData.grossMarginPct}
            onChange={(e) => handleChange('grossMarginPct', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Average gross margin as decimal (e.g., 0.4 = 40%)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avgShippingCostZar">Avg Shipping Cost (ZAR)</Label>
          <Input
            id="avgShippingCostZar"
            type="number"
            step="0.01"
            value={formData.avgShippingCostZar}
            onChange={(e) => handleChange('avgShippingCostZar', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Average shipping cost per order
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="returnRatePct">Return Rate %</Label>
          <Input
            id="returnRatePct"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={formData.returnRatePct}
            onChange={(e) => handleChange('returnRatePct', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Average return rate as decimal (e.g., 0.05 = 5%)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentFeesPct">Payment Fees %</Label>
          <Input
            id="paymentFeesPct"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={formData.paymentFeesPct}
            onChange={(e) => handleChange('paymentFeesPct', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Payment processing fees as decimal (e.g., 0.03 = 3%)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlySpendCapZar">Monthly Spend Cap (ZAR)</Label>
          <Input
            id="monthlySpendCapZar"
            type="number"
            step="0.01"
            placeholder="No cap"
            value={formData.monthlySpendCapZar ?? ''}
            onChange={(e) =>
              handleChange(
                'monthlySpendCapZar',
                e.target.value ? parseFloat(e.target.value) : null
              )
            }
          />
          <p className="text-xs text-muted-foreground">
            Maximum monthly ad spend (leave empty for no cap)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="strategicMode">Strategic Mode</Label>
          <Select
            value={formData.strategicMode}
            onValueChange={(value) =>
              handleChange('strategicMode', value as BusinessProfile['strategicMode'])
            }
          >
            <SelectTrigger id="strategicMode">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GROWTH">Growth - Maximize revenue</SelectItem>
              <SelectItem value="EFFICIENCY">Efficiency - Optimize ROAS</SelectItem>
              <SelectItem value="RECOVERY">Recovery - Reduce losses</SelectItem>
              <SelectItem value="LIQUIDATION">Liquidation - Clear inventory</SelectItem>
              <SelectItem value="HOLD">Hold - Maintain current</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Determines how the AI prioritizes recommendations
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20 rounded-md">
          Business profile saved successfully!
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Business Profile'}
        </Button>
      </div>
    </form>
  );
}
