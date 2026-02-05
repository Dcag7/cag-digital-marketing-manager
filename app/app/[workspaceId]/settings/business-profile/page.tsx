'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Target, DollarSign, TrendingUp, Percent, Truck, 
  CreditCard, Wallet, Zap, Save, ArrowLeft, Calculator,
  AlertCircle, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { getBusinessProfile, saveBusinessProfile } from '@/server/actions/business-profile';

type StrategicMode = 'GROWTH' | 'EFFICIENCY' | 'RECOVERY' | 'LIQUIDATION' | 'HOLD';

interface BusinessProfile {
  id?: string;
  targetCpaZar: number;
  breakEvenRoas: number;
  grossMarginPct: number;
  avgShippingCostZar: number;
  returnRatePct: number;
  paymentFeesPct: number;
  monthlySpendCapZar: number | null;
  strategicMode: StrategicMode;
}

const STRATEGIC_MODES: { value: StrategicMode; label: string; description: string; color: string }[] = [
  { value: 'GROWTH', label: '🚀 Growth', description: 'Maximize revenue and market share', color: 'bg-green-500/20 text-green-400' },
  { value: 'EFFICIENCY', label: '⚡ Efficiency', description: 'Optimize for profitability', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'RECOVERY', label: '🔄 Recovery', description: 'Rebuild after performance dip', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'LIQUIDATION', label: '💸 Liquidation', description: 'Clear inventory aggressively', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'HOLD', label: '⏸️ Hold', description: 'Maintain current position', color: 'bg-gray-500/20 text-gray-400' },
];

export default function BusinessProfilePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile>({
    targetCpaZar: 500,
    breakEvenRoas: 2.0,
    grossMarginPct: 50,
    avgShippingCostZar: 80,
    returnRatePct: 5,
    paymentFeesPct: 3,
    monthlySpendCapZar: null,
    strategicMode: 'GROWTH',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getBusinessProfile(workspaceId);
        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Failed to load business profile:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [workspaceId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBusinessProfile(workspaceId, profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save business profile:', error);
    } finally {
      setSaving(false);
    }
  };

  // Calculate derived metrics
  const calculatedTargetRoas = profile.grossMarginPct > 0 
    ? 100 / profile.grossMarginPct 
    : 0;
  
  const effectiveMargin = profile.grossMarginPct - profile.returnRatePct - profile.paymentFeesPct;
  
  const maxCpaForProfit = profile.targetCpaZar * (effectiveMargin / 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/app/${workspaceId}/settings`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Saved!
            </>
          ) : saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Business Profile</h1>
        <p className="text-muted-foreground">
          Configure your business metrics and targets for AI-powered recommendations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Strategic Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-400" />
                Strategic Mode
              </CardTitle>
              <CardDescription>
                Select your current business focus - this affects how recommendations are generated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {STRATEGIC_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setProfile({ ...profile, strategicMode: mode.value })}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      profile.strategicMode === mode.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Badge className={mode.color}>{mode.label}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">{mode.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Targets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-400" />
                Performance Targets
              </CardTitle>
              <CardDescription>
                Set your target metrics for campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="targetCpa" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Target CPA (R)
                  </Label>
                  <Input
                    id="targetCpa"
                    type="number"
                    value={profile.targetCpaZar}
                    onChange={(e) => setProfile({ ...profile, targetCpaZar: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum cost per acquisition you're willing to pay
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="breakEvenRoas" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Break-Even ROAS
                  </Label>
                  <Input
                    id="breakEvenRoas"
                    type="number"
                    step="0.1"
                    value={profile.breakEvenRoas}
                    onChange={(e) => setProfile({ ...profile, breakEvenRoas: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 2.0"
                  />
                  <p className="text-xs text-muted-foreground">
                    ROAS needed to break even (calculated: {calculatedTargetRoas.toFixed(2)}x)
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthlySpendCap" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  Monthly Spend Cap (R) - Optional
                </Label>
                <Input
                  id="monthlySpendCap"
                  type="number"
                  value={profile.monthlySpendCapZar || ''}
                  onChange={(e) => setProfile({ 
                    ...profile, 
                    monthlySpendCapZar: e.target.value ? parseFloat(e.target.value) : null 
                  })}
                  placeholder="Leave empty for no cap"
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Economics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-400" />
                Business Economics
              </CardTitle>
              <CardDescription>
                Your business costs and margins - used to calculate true profitability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="grossMargin" className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    Gross Margin (%)
                  </Label>
                  <Input
                    id="grossMargin"
                    type="number"
                    value={profile.grossMarginPct}
                    onChange={(e) => setProfile({ ...profile, grossMarginPct: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Profit margin before marketing costs
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shippingCost" className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    Avg Shipping Cost (R)
                  </Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    value={profile.avgShippingCostZar}
                    onChange={(e) => setProfile({ ...profile, avgShippingCostZar: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 80"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="returnRate" className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    Return Rate (%)
                  </Label>
                  <Input
                    id="returnRate"
                    type="number"
                    value={profile.returnRatePct}
                    onChange={(e) => setProfile({ ...profile, returnRatePct: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 5"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentFees" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Payment Fees (%)
                  </Label>
                  <Input
                    id="paymentFees"
                    type="number"
                    step="0.1"
                    value={profile.paymentFeesPct}
                    onChange={(e) => setProfile({ ...profile, paymentFeesPct: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 3"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Calculated Metrics */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Calculated Metrics</CardTitle>
              <CardDescription>
                Based on your inputs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">Effective Margin</p>
                <p className="text-2xl font-bold">{effectiveMargin.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  After returns & payment fees
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">Calculated Break-Even ROAS</p>
                <p className="text-2xl font-bold">{calculatedTargetRoas.toFixed(2)}x</p>
                <p className="text-xs text-muted-foreground">
                  Based on {profile.grossMarginPct}% margin
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">Max CPA for Profit</p>
                <p className="text-2xl font-bold">R{maxCpaForProfit.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">
                  At target CPA with effective margin
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                <strong className="text-foreground">Growth Mode:</strong> AI will prioritize scaling profitable campaigns even at slightly lower ROAS.
              </p>
              <p>
                <strong className="text-foreground">Efficiency Mode:</strong> AI will be more conservative, focusing on campaigns above your target ROAS.
              </p>
              <p>
                <strong className="text-foreground">Recovery Mode:</strong> AI will help identify quick wins to rebuild momentum.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
