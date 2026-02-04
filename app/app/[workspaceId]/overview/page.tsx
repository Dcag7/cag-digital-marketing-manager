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
      icon: Wallet,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600'
    },
    { 
      title: 'Revenue', 
      value: 'R 0.00', 
      change: '+0%',
      trend: 'neutral',
      icon: DollarSign,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600'
    },
    { 
      title: 'ROAS', 
      value: '0.00x', 
      change: 'On target',
      trend: 'positive',
      icon: TrendingUp,
      color: 'yellow',
      gradient: 'from-yellow-400 to-amber-500'
    },
    { 
      title: 'CPA', 
      value: 'R 0.00', 
      change: 'On target',
      trend: 'positive',
      icon: Target,
      color: 'red',
      gradient: 'from-red-500 to-rose-600'
    },
    { 
      title: 'Profit', 
      value: 'R 0.00', 
      change: 'N/A',
      trend: 'neutral',
      icon: BarChart3,
      color: 'purple',
      gradient: 'from-purple-500 to-violet-600'
    },
  ];

  const channelData = [
    { channel: 'Meta', spend: 0, revenue: 0, roas: 0, cpa: 0, color: 'bg-blue-500' },
    { channel: 'Google', spend: 0, revenue: 0, roas: 0, cpa: 0, color: 'bg-yellow-500' },
    { channel: 'Total', spend: 0, revenue: 0, roas: 0, cpa: 0, color: 'bg-gradient-to-r from-blue-500 to-yellow-500' },
  ];

  const formatCurrency = (amount: number) => `R ${amount.toFixed(2)}`;

  return (
    <div className="space-y-8 animate-in">
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
            <Card key={kpi.title} className="card-colorful hover-lift overflow-hidden">
              {/* Colorful top border */}
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
                      <th className="text-right p-3 font-semibold text-muted-foreground">CPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelData.map((row, index) => (
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
                        <td className="p-3 text-right">{formatCurrency(row.cpa)}</td>
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
                  <p className="text-muted-foreground font-medium">Connect integrations to see chart data</p>
                  <p className="text-sm text-muted-foreground mt-1">Go to Settings → Integrations</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
