'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, ArrowUpDown, Calendar, ChevronDown, TrendingUp, TrendingDown,
  AlertTriangle, Zap, Target, DollarSign, ShoppingCart, Eye,
  RefreshCw, Filter, MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CampaignMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  purchases: number;
  revenue: number;
  roas: number;
  cpa: number;
}

interface DailyInsight {
  date: string;
  campaignId: string;
  spend: number;
  impressions: number;
  clicks: number;
  purchases: number;
  revenue: number;
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
  dailyInsights: DailyInsight[];
  syncedDateRange: { start: string; end: string };
}

type SortField = 'name' | 'status' | 'spend' | 'revenue' | 'roas' | 'cpa' | 'purchases';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'OTHER';

const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This month', days: -1 }, // Special: current month
  { label: 'Last month', days: -2 }, // Special: previous month
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value).replace('ZAR', 'R');
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-ZA').format(Math.round(value));
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'PAUSED':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getRoasColor = (roas: number) => {
  if (roas >= 3) return 'text-green-400';
  if (roas >= 2) return 'text-blue-400';
  if (roas >= 1) return 'text-yellow-400';
  if (roas > 0) return 'text-red-400';
  return 'text-muted-foreground';
};

const getPerformanceIndicator = (roas: number, spend: number) => {
  if (spend === 0) return null;
  if (roas >= 3) return { icon: TrendingUp, color: 'text-green-400', label: 'Strong' };
  if (roas >= 2) return { icon: TrendingUp, color: 'text-blue-400', label: 'Good' };
  if (roas >= 1) return { icon: Target, color: 'text-yellow-400', label: 'Break-even' };
  if (roas > 0) return { icon: TrendingDown, color: 'text-red-400', label: 'Underperforming' };
  return { icon: AlertTriangle, color: 'text-red-400', label: 'No conversions' };
};

export function CampaignsClient({ 
  workspaceId, 
  metaCampaigns, 
  googleCampaigns, 
  dailyInsights,
  syncedDateRange 
}: CampaignsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showOnlyWithActivity, setShowOnlyWithActivity] = useState(true);
  
  // Date range state
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return { start, end };
  });
  const [selectedPreset, setSelectedPreset] = useState('Last 7 days');

  // Calculate metrics for the selected date range from daily insights
  const metricsForDateRange = useMemo(() => {
    const startStr = dateRange.start.toISOString().split('T')[0];
    const endStr = dateRange.end.toISOString().split('T')[0];
    
    const filtered = dailyInsights.filter(insight => {
      const insightDate = insight.date.split('T')[0];
      return insightDate >= startStr && insightDate <= endStr;
    });

    // Aggregate by campaign
    const byC = new Map<string, CampaignMetrics>();
    
    for (const insight of filtered) {
      const existing = byC.get(insight.campaignId) || {
        spend: 0, impressions: 0, clicks: 0, purchases: 0, revenue: 0, roas: 0, cpa: 0
      };
      
      existing.spend += insight.spend;
      existing.impressions += insight.impressions;
      existing.clicks += insight.clicks;
      existing.purchases += insight.purchases;
      existing.revenue += insight.revenue;
      
      byC.set(insight.campaignId, existing);
    }

    // Calculate ROAS and CPA
    for (const [id, metrics] of byC) {
      metrics.roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;
      metrics.cpa = metrics.purchases > 0 ? metrics.spend / metrics.purchases : 0;
      byC.set(id, metrics);
    }

    return byC;
  }, [dailyInsights, dateRange]);

  // Campaigns with recalculated metrics for date range
  const campaignsWithDateMetrics = useMemo(() => {
    return metaCampaigns.map(campaign => ({
      ...campaign,
      metrics: metricsForDateRange.get(campaign.campaignId) || {
        spend: 0, impressions: 0, clicks: 0, purchases: 0, revenue: 0, roas: 0, cpa: 0
      }
    }));
  }, [metaCampaigns, metricsForDateRange]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDatePreset = (preset: typeof DATE_PRESETS[0]) => {
    const end = new Date();
    const start = new Date();
    
    if (preset.days === -1) {
      // This month
      start.setDate(1);
    } else if (preset.days === -2) {
      // Last month
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0); // Last day of previous month
    } else if (preset.days === 0) {
      // Today - same day
    } else if (preset.days === 1) {
      // Yesterday
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else {
      start.setDate(start.getDate() - preset.days);
    }
    
    setDateRange({ start, end });
    setSelectedPreset(preset.label);
  };

  const filterAndSortCampaigns = (campaigns: typeof campaignsWithDateMetrics) => {
    return campaigns
      .filter((campaign) => {
        const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesStatus = true;
        if (statusFilter === 'ACTIVE') {
          matchesStatus = campaign.status.toUpperCase() === 'ACTIVE';
        } else if (statusFilter === 'PAUSED') {
          matchesStatus = campaign.status.toUpperCase() === 'PAUSED';
        } else if (statusFilter === 'OTHER') {
          matchesStatus = !['ACTIVE', 'PAUSED'].includes(campaign.status.toUpperCase());
        }
        
        // Filter out campaigns with no activity if toggle is on
        const hasActivity = !showOnlyWithActivity || campaign.metrics.spend > 0 || campaign.metrics.impressions > 0;
        
        return matchesSearch && matchesStatus && hasActivity;
      })
      .sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;
        
        switch (sortField) {
          case 'name': aValue = a.name.toLowerCase(); bValue = b.name.toLowerCase(); break;
          case 'status': aValue = a.status; bValue = b.status; break;
          case 'spend': aValue = a.metrics.spend; bValue = b.metrics.spend; break;
          case 'revenue': aValue = a.metrics.revenue; bValue = b.metrics.revenue; break;
          case 'roas': aValue = a.metrics.roas; bValue = b.metrics.roas; break;
          case 'cpa': aValue = a.metrics.cpa; bValue = b.metrics.cpa; break;
          case 'purchases': aValue = a.metrics.purchases; bValue = b.metrics.purchases; break;
          default: aValue = a.metrics.spend; bValue = b.metrics.spend;
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
    () => filterAndSortCampaigns(campaignsWithDateMetrics),
    [campaignsWithDateMetrics, searchQuery, statusFilter, sortField, sortDirection, showOnlyWithActivity]
  );

  // Calculate totals for filtered campaigns
  const totals = useMemo(() => {
    const active = filteredMetaCampaigns.filter(c => c.status.toUpperCase() === 'ACTIVE');
    return {
      totalCampaigns: filteredMetaCampaigns.length,
      activeCampaigns: active.length,
      totalSpend: filteredMetaCampaigns.reduce((sum, c) => sum + c.metrics.spend, 0),
      totalRevenue: filteredMetaCampaigns.reduce((sum, c) => sum + c.metrics.revenue, 0),
      totalPurchases: filteredMetaCampaigns.reduce((sum, c) => sum + c.metrics.purchases, 0),
      totalImpressions: filteredMetaCampaigns.reduce((sum, c) => sum + c.metrics.impressions, 0),
    };
  }, [filteredMetaCampaigns]);

  const SortHeader = ({ field, label, className = '' }: { field: SortField; label: string; className?: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ${className} ${sortField === field ? 'text-primary' : ''}`}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage and analyze your advertising campaigns
          </p>
        </div>
        
        {/* Date Picker - Like Meta */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[280px] justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(dateRange.start)} – {formatDate(dateRange.end)}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="end">
              <div className="p-3 border-b">
                <p className="text-sm font-medium">Select date range</p>
                <p className="text-xs text-muted-foreground">
                  Data synced: {syncedDateRange.start} – {syncedDateRange.end}
                </p>
              </div>
              <div className="p-2">
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleDatePreset(preset)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      selectedPreset === preset.label 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="p-3 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  💡 Need more history? Go to Settings → Integrations to sync more data
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
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
        
        <div className="flex items-center gap-2">
          <Button
            variant={showOnlyWithActivity ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowOnlyWithActivity(!showOnlyWithActivity)}
            className="gap-2"
          >
            <Filter className="h-3 w-3" />
            {showOnlyWithActivity ? 'With activity' : 'All campaigns'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="meta" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meta">Meta ({filteredMetaCampaigns.length})</TabsTrigger>
          <TabsTrigger value="google">Google ({googleCampaigns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="meta" className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-blue-400" />
                  <p className="text-xs text-muted-foreground">Campaigns</p>
                </div>
                <p className="text-2xl font-bold">{totals.totalCampaigns}</p>
                <p className="text-xs text-green-400">{totals.activeCampaigns} active</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-orange-400" />
                  <p className="text-xs text-muted-foreground">Total Spend</p>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalSpend)}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-purple-400" />
                  <p className="text-xs text-muted-foreground">ROAS</p>
                </div>
                <p className={`text-2xl font-bold ${getRoasColor(totals.totalSpend > 0 ? totals.totalRevenue / totals.totalSpend : 0)}`}>
                  {totals.totalSpend > 0 ? (totals.totalRevenue / totals.totalSpend).toFixed(2) : '0.00'}x
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-4 w-4 text-cyan-400" />
                  <p className="text-xs text-muted-foreground">Purchases</p>
                </div>
                <p className="text-2xl font-bold">{formatNumber(totals.totalPurchases)}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-pink-400" />
                  <p className="text-xs text-muted-foreground">Impressions</p>
                </div>
                <p className="text-2xl font-bold">{formatNumber(totals.totalImpressions)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Table */}
          <Card className="overflow-hidden">
            {/* Table */}
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b text-xs font-medium">
                  <th className="text-left px-4 py-3 w-[40%]">
                    <SortHeader field="name" label="Campaign" />
                  </th>
                  <th className="text-right px-4 py-3 w-[12%]">
                    <SortHeader field="spend" label="Spend" className="justify-end" />
                  </th>
                  <th className="text-right px-4 py-3 w-[14%]">
                    <SortHeader field="revenue" label="Revenue" className="justify-end" />
                  </th>
                  <th className="text-right px-4 py-3 w-[10%]">
                    <SortHeader field="roas" label="ROAS" className="justify-end" />
                  </th>
                  <th className="text-right px-4 py-3 w-[10%]">
                    <SortHeader field="purchases" label="Purch." className="justify-end" />
                  </th>
                  <th className="text-right px-4 py-3 w-[14%]">
                    <SortHeader field="cpa" label="CPA" className="justify-end" />
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/50">
                {filteredMetaCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <p className="text-muted-foreground">
                        {metaCampaigns.length === 0 
                          ? 'No campaigns found. Sync your Meta account in Settings.'
                          : showOnlyWithActivity 
                            ? 'No campaigns with activity in this date range. Try expanding the date range or showing all campaigns.'
                            : 'No campaigns match your filters.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredMetaCampaigns.map((campaign) => {
                    const perf = getPerformanceIndicator(campaign.metrics.roas, campaign.metrics.spend);
                    
                    return (
                      <tr 
                        key={campaign.id} 
                        className="hover:bg-muted/20 transition-colors group"
                      >
                        {/* Campaign Name & Status */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate max-w-[280px]">{campaign.name}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {campaign.objective && (
                              <span className="text-xs text-muted-foreground">{campaign.objective}</span>
                            )}
                            {perf && (
                              <span className={`text-xs flex items-center gap-1 ${perf.color}`}>
                                <perf.icon className="h-3 w-3" />
                                {perf.label}
                              </span>
                            )}
                          </div>
                        </td>
                        
                        {/* Spend */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-sm">{formatCurrency(campaign.metrics.spend)}</span>
                        </td>
                        
                        {/* Revenue */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-sm">{formatCurrency(campaign.metrics.revenue)}</span>
                        </td>
                        
                        {/* ROAS */}
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium text-sm ${getRoasColor(campaign.metrics.roas)}`}>
                            {campaign.metrics.roas > 0 ? `${campaign.metrics.roas.toFixed(2)}x` : '-'}
                          </span>
                        </td>
                        
                        {/* Purchases */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-sm">{formatNumber(campaign.metrics.purchases)}</span>
                        </td>
                        
                        {/* CPA */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-medium text-sm">
                              {campaign.metrics.cpa > 0 ? formatCurrency(campaign.metrics.cpa) : '-'}
                            </span>
                            
                            {/* Actions Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View details</DropdownMenuItem>
                                <DropdownMenuItem>View in Meta</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-yellow-500">
                                  Pause campaign
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-green-500">
                                  Scale budget
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer - Totals */}
              {filteredMetaCampaigns.length > 0 && (
                <tfoot>
                  <tr className="bg-muted/30 border-t font-medium text-sm">
                    <td className="px-4 py-3">
                      Total ({filteredMetaCampaigns.length} campaigns)
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(totals.totalSpend)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(totals.totalRevenue)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={getRoasColor(totals.totalSpend > 0 ? totals.totalRevenue / totals.totalSpend : 0)}>
                        {totals.totalSpend > 0 ? (totals.totalRevenue / totals.totalSpend).toFixed(2) : '0.00'}x
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatNumber(totals.totalPurchases)}</td>
                    <td className="px-4 py-3 text-right">
                      {totals.totalPurchases > 0 ? formatCurrency(totals.totalSpend / totals.totalPurchases) : '-'}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="google" className="space-y-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {googleCampaigns.length === 0 
                  ? 'No Google Ads campaigns found. Connect Google Ads in Settings.'
                  : `${googleCampaigns.length} campaigns found. Google Ads metrics coming soon.`}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
