'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CampaignMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  purchases: number;
  revenue: number;
  roas: number;
  cpa: number;
}

interface Campaign {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  objective?: string | null;
  metrics: CampaignMetrics;
}

interface CampaignsClientProps {
  workspaceId: string;
  metaCampaigns: Campaign[];
  googleCampaigns: Campaign[];
}

type SortField = 'name' | 'status' | 'spend' | 'revenue' | 'roas' | 'cpa';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'OTHER';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-ZA').format(Math.round(value));
};

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'PAUSED':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getRoasIndicator = (roas: number) => {
  if (roas >= 3) return { icon: TrendingUp, color: 'text-green-600', label: 'Great' };
  if (roas >= 2) return { icon: TrendingUp, color: 'text-blue-600', label: 'Good' };
  if (roas >= 1) return { icon: Minus, color: 'text-yellow-600', label: 'Break-even' };
  return { icon: TrendingDown, color: 'text-red-600', label: 'Loss' };
};

export function CampaignsClient({ workspaceId, metaCampaigns, googleCampaigns }: CampaignsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filterAndSortCampaigns = (campaigns: Campaign[]) => {
    return campaigns
      .filter((campaign) => {
        // Search filter
        const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Status filter
        let matchesStatus = true;
        if (statusFilter === 'ACTIVE') {
          matchesStatus = campaign.status.toUpperCase() === 'ACTIVE';
        } else if (statusFilter === 'PAUSED') {
          matchesStatus = campaign.status.toUpperCase() === 'PAUSED';
        } else if (statusFilter === 'OTHER') {
          matchesStatus = !['ACTIVE', 'PAUSED'].includes(campaign.status.toUpperCase());
        }
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;
        
        switch (sortField) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'spend':
            aValue = a.metrics.spend;
            bValue = b.metrics.spend;
            break;
          case 'revenue':
            aValue = a.metrics.revenue;
            bValue = b.metrics.revenue;
            break;
          case 'roas':
            aValue = a.metrics.roas;
            bValue = b.metrics.roas;
            break;
          case 'cpa':
            aValue = a.metrics.cpa;
            bValue = b.metrics.cpa;
            break;
          default:
            aValue = a.metrics.spend;
            bValue = b.metrics.spend;
        }
        
        if (typeof aValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue as string)
            : (bValue as string).localeCompare(aValue);
        }
        
        return sortDirection === 'asc' ? aValue - (bValue as number) : (bValue as number) - aValue;
      });
  };

  const filteredMetaCampaigns = useMemo(
    () => filterAndSortCampaigns(metaCampaigns),
    [metaCampaigns, searchQuery, statusFilter, sortField, sortDirection]
  );

  const filteredGoogleCampaigns = useMemo(
    () => filterAndSortCampaigns(googleCampaigns),
    [googleCampaigns, searchQuery, statusFilter, sortField, sortDirection]
  );

  // Calculate totals for Meta
  const metaTotals = useMemo(() => {
    const active = filteredMetaCampaigns.filter(c => c.status.toUpperCase() === 'ACTIVE');
    return {
      totalCampaigns: filteredMetaCampaigns.length,
      activeCampaigns: active.length,
      totalSpend: filteredMetaCampaigns.reduce((sum, c) => sum + c.metrics.spend, 0),
      totalRevenue: filteredMetaCampaigns.reduce((sum, c) => sum + c.metrics.revenue, 0),
      totalPurchases: filteredMetaCampaigns.reduce((sum, c) => sum + c.metrics.purchases, 0),
    };
  }, [filteredMetaCampaigns]);

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className={`h-8 px-2 ${sortField === field ? 'text-primary' : ''}`}
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  const CampaignRow = ({ campaign }: { campaign: Campaign }) => {
    const roasIndicator = getRoasIndicator(campaign.metrics.roas);
    const RoasIcon = roasIndicator.icon;
    
    return (
      <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{campaign.name}</h3>
            <Badge variant="secondary" className={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
          </div>
          {campaign.objective && (
            <p className="text-xs text-muted-foreground mt-1">{campaign.objective}</p>
          )}
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          <div className="text-right w-24">
            <p className="text-muted-foreground text-xs">Spend</p>
            <p className="font-medium">{formatCurrency(campaign.metrics.spend)}</p>
          </div>
          <div className="text-right w-24">
            <p className="text-muted-foreground text-xs">Revenue</p>
            <p className="font-medium">{formatCurrency(campaign.metrics.revenue)}</p>
          </div>
          <div className="text-right w-20">
            <p className="text-muted-foreground text-xs">ROAS</p>
            <div className={`font-medium flex items-center justify-end gap-1 ${roasIndicator.color}`}>
              <RoasIcon className="h-3 w-3" />
              {campaign.metrics.roas.toFixed(2)}x
            </div>
          </div>
          <div className="text-right w-24">
            <p className="text-muted-foreground text-xs">Purchases</p>
            <p className="font-medium">{formatNumber(campaign.metrics.purchases)}</p>
          </div>
          <div className="text-right w-24">
            <p className="text-muted-foreground text-xs">CPA</p>
            <p className="font-medium">{campaign.metrics.cpa > 0 ? formatCurrency(campaign.metrics.cpa) : '-'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <p className="text-muted-foreground">Manage your advertising campaigns (Last 7 days metrics)</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'ACTIVE', 'PAUSED', 'OTHER'] as StatusFilter[]).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="meta" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meta">
            Meta ({filteredMetaCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="google">
            Google ({filteredGoogleCampaigns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meta" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Campaigns</p>
                <p className="text-2xl font-bold">{metaTotals.totalCampaigns}</p>
                <p className="text-xs text-green-600">{metaTotals.activeCampaigns} active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">{formatCurrency(metaTotals.totalSpend)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metaTotals.totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Overall ROAS</p>
                <p className="text-2xl font-bold">
                  {metaTotals.totalSpend > 0 
                    ? (metaTotals.totalRevenue / metaTotals.totalSpend).toFixed(2) 
                    : '0.00'}x
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Purchases</p>
                <p className="text-2xl font-bold">{formatNumber(metaTotals.totalPurchases)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Campaign List */}
          <Card>
            <div className="border-b px-4 py-2 flex items-center justify-between bg-muted/50">
              <SortButton field="name" label="Name" />
              <div className="flex items-center gap-4">
                <SortButton field="spend" label="Spend" />
                <SortButton field="revenue" label="Revenue" />
                <SortButton field="roas" label="ROAS" />
                <SortButton field="cpa" label="CPA" />
              </div>
            </div>
            <CardContent className="p-0">
              {filteredMetaCampaigns.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {metaCampaigns.length === 0 
                      ? 'No campaigns found. Sync your Meta account in Settings.'
                      : 'No campaigns match your filters.'}
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredMetaCampaigns.map((campaign) => (
                    <CampaignRow key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google" className="space-y-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {googleCampaigns.length === 0 
                  ? 'No Google Ads campaigns found. Connect Google Ads in Settings.'
                  : `${filteredGoogleCampaigns.length} campaigns found. Google Ads metrics coming soon.`}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
