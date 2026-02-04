'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Note: This is a simplified version. The full version would fetch data server-side
// and pass it to client components for charts.

export default function OverviewPage() {
  const kpiCards = [
    { title: 'Total Spend', value: 'R 0.00', change: 'N/A' },
    { title: 'Revenue', value: 'R 0.00', change: 'N/A' },
    { title: 'ROAS', value: '0.00', change: '✓' },
    { title: 'CPA', value: 'R 0.00', change: '✓' },
    { title: 'Profit', value: 'N/A', change: '⚠' },
  ];

  const channelData = [
    { channel: 'Meta', spend: 0, revenue: 0, roas: 0, cpa: 0 },
    { channel: 'Google', spend: 0, revenue: 0, roas: 0, cpa: 0 },
    { channel: 'Total', spend: 0, revenue: 0, roas: 0, cpa: 0 },
  ];

  const formatCurrency = (amount: number) => `R ${amount.toFixed(2)}`;
  const formatNumber = (num: number, decimals: number = 0) => num.toFixed(decimals);

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
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Connect integrations to see chart data
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
