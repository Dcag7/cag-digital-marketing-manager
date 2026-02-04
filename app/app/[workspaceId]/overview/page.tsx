'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Wallet } from 'lucide-react';

export default function OverviewPage() {
  const kpiCards = [
    { 
      title: 'Total Spend', 
      value: 'R 0.00', 
      change: '+0%',
      trend: 'neutral',
      icon: Wallet 
    },
    { 
      title: 'Revenue', 
      value: 'R 0.00', 
      change: '+0%',
      trend: 'neutral',
      icon: DollarSign 
    },
    { 
      title: 'ROAS', 
      value: '0.00x', 
      change: 'On target',
      trend: 'positive',
      icon: TrendingUp 
    },
    { 
      title: 'CPA', 
      value: 'R 0.00', 
      change: 'On target',
      trend: 'positive',
      icon: Target 
    },
    { 
      title: 'Profit', 
      value: 'R 0.00', 
      change: 'N/A',
      trend: 'neutral',
      icon: BarChart3 
    },
  ];

  const channelData = [
    { channel: 'Meta', spend: 0, revenue: 0, roas: 0, cpa: 0 },
    { channel: 'Google', spend: 0, revenue: 0, roas: 0, cpa: 0 },
    { channel: 'Total', spend: 0, revenue: 0, roas: 0, cpa: 0 },
  ];

  const formatCurrency = (amount: number) => `R ${amount.toFixed(2)}`;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Last 7 days performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className={`text-xs mt-1 flex items-center gap-1 ${
                  kpi.trend === 'positive' ? 'text-teal-500' : 
                  kpi.trend === 'negative' ? 'text-red-500' : 
                  'text-muted-foreground'
                }`}>
                  {kpi.trend === 'positive' && <TrendingUp className="h-3 w-3" />}
                  {kpi.trend === 'negative' && <TrendingDown className="h-3 w-3" />}
                  {kpi.change}
                </p>
              </CardContent>
              {/* Subtle gradient accent */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </Card>
          );
        })}
      </div>

      {/* Channel Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
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
                      <th className="text-left p-3 font-medium text-muted-foreground">Channel</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Spend</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Revenue</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">ROAS</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">CPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelData.map((row, index) => (
                      <tr 
                        key={row.channel} 
                        className={`border-b border-border/50 transition-colors hover:bg-secondary/30 ${
                          row.channel === 'Total' ? 'font-medium bg-secondary/20' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {row.channel !== 'Total' && (
                              <div className={`w-2 h-2 rounded-full ${
                                row.channel === 'Meta' ? 'bg-blue-500' : 'bg-yellow-500'
                              }`} />
                            )}
                            {row.channel}
                          </div>
                        </td>
                        <td className="p-3 text-right">{formatCurrency(row.spend)}</td>
                        <td className="p-3 text-right">{formatCurrency(row.revenue)}</td>
                        <td className="p-3 text-right">{row.roas.toFixed(2)}x</td>
                        <td className="p-3 text-right">{formatCurrency(row.cpa)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="chart" className="mt-4">
              <div className="h-[300px] flex items-center justify-center rounded-lg border border-dashed border-border">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Connect integrations to see chart data</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
