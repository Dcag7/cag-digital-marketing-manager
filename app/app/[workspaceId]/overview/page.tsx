import { calculateWorkspaceMetrics } from '@/lib/metrics/calculator';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChannelBarChart } from './charts';

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  
  const metrics7d = await calculateWorkspaceMetrics(workspaceId, 7);
  const metrics30d = await calculateWorkspaceMetrics(workspaceId, 30);

  const kpiCards = [
    {
      title: 'Total Spend',
      value: formatCurrency(metrics7d.total.spend),
      change: metrics30d.total.spend > 0 
        ? `${((metrics7d.total.spend / metrics30d.total.spend) * 100 - 100).toFixed(1)}%`
        : 'N/A',
    },
    {
      title: 'Revenue',
      value: formatCurrency(metrics7d.total.revenue),
      change: metrics30d.total.revenue > 0
        ? `${((metrics7d.total.revenue / metrics30d.total.revenue) * 100 - 100).toFixed(1)}%`
        : 'N/A',
    },
    {
      title: 'ROAS',
      value: formatNumber(metrics7d.total.roas, 2),
      change: metrics7d.total.roas >= metrics7d.total.roas ? '✓' : '⚠',
    },
    {
      title: 'CPA',
      value: formatCurrency(metrics7d.total.cpa),
      change: metrics7d.total.cpa <= metrics7d.total.cpa ? '✓' : '⚠',
    },
    {
      title: 'Profit',
      value: metrics7d.profit ? formatCurrency(metrics7d.profit) : 'N/A',
      change: metrics7d.profit && metrics7d.profit > 0 ? '✓' : '⚠',
    },
  ];

  const channelData = [
    {
      channel: 'Meta',
      spend: metrics7d.meta.spend,
      revenue: metrics7d.meta.revenue,
      roas: metrics7d.meta.roas,
      cpa: metrics7d.meta.cpa,
    },
    {
      channel: 'Google',
      spend: metrics7d.google.spend,
      revenue: metrics7d.google.revenue,
      roas: metrics7d.google.roas,
      cpa: metrics7d.google.cpa,
    },
    {
      channel: 'Total',
      spend: metrics7d.total.spend,
      revenue: metrics7d.total.revenue,
      roas: metrics7d.total.roas,
      cpa: metrics7d.total.cpa,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-muted-foreground">Last 7 days performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Channel Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table">
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Channel</th>
                      <th className="text-right p-2">Spend</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">ROAS</th>
                      <th className="text-right p-2">CPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelData.map((row) => (
                      <tr key={row.channel} className="border-b">
                        <td className="p-2 font-medium">{row.channel}</td>
                        <td className="p-2 text-right">{formatCurrency(row.spend)}</td>
                        <td className="p-2 text-right">{formatCurrency(row.revenue)}</td>
                        <td className="p-2 text-right">{formatNumber(row.roas, 2)}</td>
                        <td className="p-2 text-right">{formatCurrency(row.cpa)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="chart" className="mt-4">
              <ChannelBarChart data={channelData} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
