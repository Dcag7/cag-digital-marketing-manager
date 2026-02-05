'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Mail, Send, Eye, MousePointer, Users, TrendingUp, DollarSign,
  Search, Filter, Calendar, ArrowUpDown, Clock, CheckCircle,
  AlertTriangle, XCircle
} from 'lucide-react';

interface EmailCampaign {
  id: string;
  campaignId: string;
  name: string;
  type: string;
  status: string;
  subject: string | null;
  sentAt: string | null;
  scheduledAt: string | null;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    conversions: number;
    revenue: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
}

interface EmailCampaignsClientProps {
  workspaceId: string;
  campaigns: EmailCampaign[];
}

const TYPE_COLORS: Record<string, string> = {
  NEWSLETTER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PROMOTIONAL: 'bg-green-500/20 text-green-400 border-green-500/30',
  ABANDONED_CART: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  WELCOME_SERIES: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  WIN_BACK: 'bg-red-500/20 text-red-400 border-red-500/30',
  POST_PURCHASE: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  CUSTOM: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle }> = {
  sent: { color: 'text-green-400', icon: CheckCircle },
  scheduled: { color: 'text-blue-400', icon: Clock },
  draft: { color: 'text-gray-400', icon: Mail },
  archived: { color: 'text-gray-500', icon: XCircle },
};

export function EmailCampaignsClient({ workspaceId, campaigns }: EmailCampaignsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'sentAt' | 'openRate' | 'revenue'>('sentAt');

  // Calculate totals
  const totals = campaigns.reduce(
    (acc, c) => ({
      sent: acc.sent + c.metrics.sent,
      delivered: acc.delivered + c.metrics.delivered,
      opened: acc.opened + c.metrics.opened,
      clicked: acc.clicked + c.metrics.clicked,
      conversions: acc.conversions + c.metrics.conversions,
      revenue: acc.revenue + c.metrics.revenue,
    }),
    { sent: 0, delivered: 0, opened: 0, clicked: 0, conversions: 0, revenue: 0 }
  );

  const avgOpenRate = totals.delivered > 0 ? (totals.opened / totals.delivered) * 100 : 0;
  const avgClickRate = totals.opened > 0 ? (totals.clicked / totals.opened) * 100 : 0;

  // Filter and sort campaigns
  const filteredCampaigns = campaigns
    .filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'sentAt') {
        return new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime();
      }
      if (sortBy === 'openRate') {
        return b.metrics.openRate - a.metrics.openRate;
      }
      return b.metrics.revenue - a.metrics.revenue;
    });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-ZA').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Email Campaigns</h1>
            <p className="text-sm text-muted-foreground">
              {campaigns.length} campaigns synced from Shopify
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Send className="h-4 w-4" />
              <span className="text-xs">Sent</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(totals.sent)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Delivered</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(totals.delivered)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-xs">Avg Open Rate</span>
            </div>
            <p className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MousePointer className="h-4 w-4" />
              <span className="text-xs">Avg Click Rate</span>
            </div>
            <p className="text-2xl font-bold">{avgClickRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Conversions</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(totals.conversions)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Revenue</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totals.revenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-background border rounded-md px-3 py-2 text-sm"
          >
            <option value="ALL">All Types</option>
            <option value="NEWSLETTER">Newsletter</option>
            <option value="PROMOTIONAL">Promotional</option>
            <option value="ABANDONED_CART">Abandoned Cart</option>
            <option value="WELCOME_SERIES">Welcome Series</option>
            <option value="WIN_BACK">Win Back</option>
            <option value="POST_PURCHASE">Post Purchase</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-background border rounded-md px-3 py-2 text-sm"
          >
            <option value="sentAt">Sort by Date</option>
            <option value="openRate">Sort by Open Rate</option>
            <option value="revenue">Sort by Revenue</option>
          </select>
        </div>
      </div>

      {/* Campaigns Table */}
      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No email campaigns found</h3>
            <p className="text-muted-foreground mb-4">
              {campaigns.length === 0 
                ? 'Connect Shopify and sync to see your email campaigns'
                : 'Try adjusting your search or filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground" style={{ width: '30%' }}>
                      Campaign
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground" style={{ width: '12%' }}>
                      Type
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground" style={{ width: '10%' }}>
                      Sent
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground" style={{ width: '10%' }}>
                      Open Rate
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground" style={{ width: '10%' }}>
                      Click Rate
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground" style={{ width: '10%' }}>
                      Conversions
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground" style={{ width: '10%' }}>
                      Revenue
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground" style={{ width: '8%' }}>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => {
                    const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <tr key={campaign.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-start gap-2">
                            <StatusIcon className={`h-4 w-4 mt-0.5 ${statusConfig.color}`} />
                            <div>
                              <p className="font-medium truncate max-w-[250px]">{campaign.name}</p>
                              {campaign.subject && (
                                <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                  {campaign.subject}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={TYPE_COLORS[campaign.type] || TYPE_COLORS.CUSTOM}>
                            {campaign.type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-mono">
                          {formatNumber(campaign.metrics.sent)}
                        </td>
                        <td className="p-3 text-right font-mono">
                          <span className={campaign.metrics.openRate >= 20 ? 'text-green-400' : campaign.metrics.openRate >= 10 ? 'text-yellow-400' : 'text-red-400'}>
                            {campaign.metrics.openRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">
                          <span className={campaign.metrics.clickRate >= 3 ? 'text-green-400' : campaign.metrics.clickRate >= 1 ? 'text-yellow-400' : 'text-red-400'}>
                            {campaign.metrics.clickRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">
                          {formatNumber(campaign.metrics.conversions)}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {formatCurrency(campaign.metrics.revenue)}
                        </td>
                        <td className="p-3 text-right text-xs text-muted-foreground">
                          {campaign.sentAt ? (
                            new Date(campaign.sentAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          ) : campaign.scheduledAt ? (
                            <span className="text-blue-400">
                              {new Date(campaign.scheduledAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
