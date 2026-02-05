import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Wallet, ShoppingCart, MousePointer } from 'lucide-react';

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  // Get date ranges
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Fetch current period data (last 7 days)
  const currentPeriodData = await prisma.metaInsightDaily.aggregate({
    where: {
      workspaceId,
      date: { gte: sevenDaysAgo },
    },
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      purchaseValue: true,
    },
  });

  // Fetch previous period data (7-14 days ago) for comparison
  const previousPeriodData = await prisma.metaInsightDaily.aggregate({
    where: {
      workspaceId,
      date: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
    },
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      purchaseValue: true,
    },
  });

  // Get business profile for targets
  const businessProfile = await prisma.workspaceBusinessProfile.findUnique({
    where: { workspaceId },
  });

  // Calculate metrics
  const current = {
    spend: currentPeriodData._sum.spend || 0,
    revenue: currentPeriodData._sum.purchaseValue || 0,
    purchases: currentPeriodData._sum.purchases || 0,
    impressions: currentPeriodData._sum.impressions || 0,
    clicks: currentPeriodData._sum.clicks || 0,
  };

  const previous = {
    spend: previousPeriodData._sum.spend || 0,
    revenue: previousPeriodData._sum.purchaseValue || 0,
    purchases: previousPeriodData._sum.purchases || 0,
  };

  const roas = current.spend > 0 ? current.revenue / current.spend : 0;
  const cpa = current.purchases > 0 ? current.spend / current.purchases : 0;
  const profit = current.revenue - current.spend;
  const ctr = current.impressions > 0 ? (current.clicks / current.impressions) * 100 : 0;

  // Calculate changes
  const spendChange = previous.spend > 0 
    ? ((current.spend - previous.spend) / previous.spend) * 100 
    : 0;
  const revenueChange = previous.revenue > 0 
    ? ((current.revenue - previous.revenue) / previous.revenue) * 100 
    : 0;
  const purchasesChange = previous.purchases > 0 
    ? ((current.purchases - previous.purchases) / previous.purchases) * 100 
    : 0;

  // Determine trends based on targets
  const targetCpa = businessProfile?.targetCpaZar || 150;
  const targetRoas = businessProfile?.breakEvenRoas || 2;
  
  const roasTrend = roas >= targetRoas ? 'positive' : roas > 0 ? 'negative' : 'neutral';
  const cpaTrend = cpa > 0 && cpa <= targetCpa ? 'positive' : cpa > 0 ? 'negative' : 'neutral';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-ZA').format(Math.round(num));
  };

  const kpiCards = [
    { 
      title: 'Total Spend', 
      value: formatCurrency(current.spend), 
      change: formatChange(spendChange),
      trend: spendChange > 0 ? 'neutral' : 'neutral', // Spend increase is neutral
      icon: Wallet,
      gradient: 'from-blue-500 to-indigo-600'
    },
    { 
      title: 'Revenue', 
      value: formatCurrency(current.revenue), 
      change: formatChange(revenueChange),
      trend: revenueChange > 0 ? 'positive' : revenueChange < 0 ? 'negative' : 'neutral',
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600'
    },
    { 
      title: 'ROAS', 
      value: `${roas.toFixed(2)}x`, 
      change: roasTrend === 'positive' ? `≥ ${targetRoas}x target` : roas > 0 ? `< ${targetRoas}x target` : 'No data',
      trend: roasTrend,
      icon: TrendingUp,
      gradient: 'from-yellow-400 to-amber-500'
    },
    { 
      title: 'CPA', 
      value: cpa > 0 ? formatCurrency(cpa) : 'N/A', 
      change: cpaTrend === 'positive' ? `≤ ${formatCurrency(targetCpa)} target` : cpa > 0 ? `> ${formatCurrency(targetCpa)} target` : 'No data',
      trend: cpaTrend,
      icon: Target,
      gradient: 'from-red-500 to-rose-600'
    },
    { 
      title: 'Profit', 
      value: formatCurrency(profit), 
      change: profit > 0 ? 'Profitable' : profit < 0 ? 'Loss' : 'Break-even',
      trend: profit > 0 ? 'positive' : profit < 0 ? 'negative' : 'neutral',
      icon: BarChart3,
      gradient: 'from-purple-500 to-violet-600'
    },
  ];

  const channelData = [
    { 
      channel: 'Meta', 
      spend: current.spend, 
      revenue: current.revenue, 
      roas: roas, 
      cpa: cpa,
      purchases: current.purchases,
      color: 'bg-blue-500' 
    },
    { 
      channel: 'Google', 
      spend: 0, 
      revenue: 0, 
      roas: 0, 
      cpa: 0,
      purchases: 0,
      color: 'bg-yellow-500' 
    },
    { 
      channel: 'Total', 
      spend: current.spend, 
      revenue: current.revenue, 
      roas: roas, 
      cpa: cpa,
      purchases: current.purchases,
      color: 'bg-gradient-to-r from-blue-500 to-yellow-500' 
    },
  ];

  return (
    <div className="space-y-8 animate-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Last 7 days performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="card-colorful hover-lift overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${kpi.gradient}`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.gradient} flex items-center justify-center`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className={`text-xs mt-1 flex items-center gap-1 ${
                  kpi.trend === 'positive' ? 'text-green-500' : 
                  kpi.trend === 'negative' ? 'text-red-500' : 
                  'text-muted-foreground'
                }`}>
                  {kpi.trend === 'positive' && <TrendingUp className="h-3 w-3" />}
                  {kpi.trend === 'negative' && <TrendingDown className="h-3 w-3" />}
                  {kpi.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purchases</p>
                <p className="text-2xl font-bold">{formatNumber(current.purchases)}</p>
                <p className="text-xs text-muted-foreground">{formatChange(purchasesChange)} vs prev 7 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <MousePointer className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clicks</p>
                <p className="text-2xl font-bold">{formatNumber(current.clicks)}</p>
                <p className="text-xs text-muted-foreground">CTR: {ctr.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Impressions</p>
                <p className="text-2xl font-bold">{formatNumber(current.impressions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">
                  {current.purchases > 0 ? formatCurrency(current.revenue / current.purchases) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Channel Performance</CardTitle>
              <p className="text-sm text-muted-foreground">Compare performance across ad platforms</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="space-y-4">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-semibold text-muted-foreground">Channel</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Spend</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Revenue</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">ROAS</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Purchases</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">CPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelData.map((row) => (
                      <tr 
                        key={row.channel} 
                        className={`border-b border-border/50 transition-colors hover:bg-secondary/30 ${
                          row.channel === 'Total' ? 'font-semibold bg-secondary/20' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${row.color}`} />
                            <span>{row.channel}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">{formatCurrency(row.spend)}</td>
                        <td className="p-3 text-right">{formatCurrency(row.revenue)}</td>
                        <td className="p-3 text-right">{row.roas.toFixed(2)}x</td>
                        <td className="p-3 text-right">{formatNumber(row.purchases)}</td>
                        <td className="p-3 text-right">{row.cpa > 0 ? formatCurrency(row.cpa) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="chart" className="mt-4">
              <div className="h-[300px] flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/20">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 opacity-50">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-muted-foreground font-medium">Charts coming soon</p>
                  <p className="text-sm text-muted-foreground mt-1">Visual performance trends</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Setup Reminder if no data */}
      {current.spend === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No data yet</h3>
            <p className="text-muted-foreground mb-4">
              Sync your Meta account to see performance data here.
            </p>
            <p className="text-sm text-muted-foreground">
              Go to <strong>Settings → Integrations</strong> and click <strong>Sync Now</strong>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
