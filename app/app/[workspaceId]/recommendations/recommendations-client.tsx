'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  TrendingUp, TrendingDown, Pause, Play, AlertTriangle, 
  Zap, Target, Lightbulb, CheckCircle, XCircle, Clock,
  DollarSign, ShoppingCart, Eye, ChevronRight, Sparkles
} from 'lucide-react';
import type { Recommendation, RecommendationType, RecommendationPriority } from '@/server/services/recommendations';

interface RecommendationsClientProps {
  workspaceId: string;
  recommendations: Recommendation[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('ZAR', 'R');
};

const getTypeIcon = (type: RecommendationType) => {
  switch (type) {
    case 'SCALE_BUDGET': return TrendingUp;
    case 'PAUSE_CAMPAIGN': return Pause;
    case 'REDUCE_BUDGET': return TrendingDown;
    case 'REVIEW_CREATIVE': return Eye;
    case 'TEST_NEW_CREATIVE': return Lightbulb;
    case 'EXPAND_AUDIENCE': return Target;
    case 'INCREASE_BID': return DollarSign;
    case 'OPTIMIZE_TARGETING': return Target;
    default: return Zap;
  }
};

const getTypeColor = (type: RecommendationType) => {
  switch (type) {
    case 'SCALE_BUDGET': return 'text-green-400 bg-green-400/10';
    case 'PAUSE_CAMPAIGN': return 'text-red-400 bg-red-400/10';
    case 'REDUCE_BUDGET': return 'text-orange-400 bg-orange-400/10';
    case 'REVIEW_CREATIVE': return 'text-blue-400 bg-blue-400/10';
    case 'TEST_NEW_CREATIVE': return 'text-purple-400 bg-purple-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
};

const getPriorityBadge = (priority: RecommendationPriority) => {
  switch (priority) {
    case 'HIGH': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'LOW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
};

export function RecommendationsClient({ workspaceId, recommendations }: RecommendationsClientProps) {
  const [localRecs, setLocalRecs] = useState(recommendations);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [actionDialog, setActionDialog] = useState<{ rec: Recommendation; action: 'approve' | 'reject' } | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const handleAction = async (rec: Recommendation, action: 'approve' | 'reject') => {
    // Update local state
    setLocalRecs(prev => prev.map(r => 
      r.id === rec.id 
        ? { ...r, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } 
        : r
    ));
    setActionDialog(null);
    
    // TODO: Call server action to persist
    // await saveRecommendationAction(workspaceId, rec.id, action === 'approve' ? 'APPROVED' : 'REJECTED');
  };

  const filteredRecs = localRecs.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status === 'PENDING';
    if (filter === 'approved') return r.status === 'APPROVED';
    if (filter === 'rejected') return r.status === 'REJECTED';
    return true;
  });

  const stats = {
    total: localRecs.length,
    pending: localRecs.filter(r => r.status === 'PENDING').length,
    approved: localRecs.filter(r => r.status === 'APPROVED').length,
    rejected: localRecs.filter(r => r.status === 'REJECTED').length,
    highPriority: localRecs.filter(r => r.priority === 'HIGH' && r.status === 'PENDING').length,
  };

  const potentialSavings = localRecs
    .filter(r => r.type === 'PAUSE_CAMPAIGN' || r.type === 'REDUCE_BUDGET')
    .reduce((sum, r) => {
      if (r.type === 'PAUSE_CAMPAIGN') return sum + r.metrics.currentSpend;
      if (r.type === 'REDUCE_BUDGET' && r.suggestedAction?.suggestedValue) {
        return sum + (r.metrics.currentSpend - (r.suggestedAction.suggestedValue as number));
      }
      return sum;
    }, 0);

  const potentialGrowth = localRecs
    .filter(r => r.type === 'SCALE_BUDGET')
    .reduce((sum, r) => {
      if (r.suggestedAction?.suggestedValue) {
        const additionalSpend = (r.suggestedAction.suggestedValue as number) - r.metrics.currentSpend;
        return sum + (additionalSpend * r.metrics.currentRoas);
      }
      return sum;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Recommendations</h1>
              <p className="text-muted-foreground">
                Intelligent insights to optimize your ad performance
              </p>
            </div>
          </div>
        </div>
        
        {stats.highPriority > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              {stats.highPriority} high priority action{stats.highPriority > 1 ? 's' : ''} needed
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              <p className="text-xs text-muted-foreground">Total Recommendations</p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{stats.pending} pending review</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-orange-400" />
              <p className="text-xs text-muted-foreground">Potential Savings</p>
            </div>
            <p className="text-2xl font-bold text-orange-400">{formatCurrency(potentialSavings)}</p>
            <p className="text-xs text-muted-foreground">by pausing/reducing</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <p className="text-xs text-muted-foreground">Growth Potential</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(potentialGrowth)}</p>
            <p className="text-xs text-muted-foreground">by scaling winners</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <p className="text-xs text-muted-foreground">Actions Taken</p>
            </div>
            <p className="text-2xl font-bold">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">{stats.rejected} rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({stats.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({stats.rejected})
          </TabsTrigger>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4 space-y-4">
          {filteredRecs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {filter === 'pending' ? 'All caught up!' : 'No recommendations'}
                </h3>
                <p className="text-muted-foreground">
                  {filter === 'pending' 
                    ? 'You\'ve reviewed all recommendations. Check back after your next data sync.'
                    : 'No recommendations in this category yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRecs.map((rec) => {
              const Icon = getTypeIcon(rec.type);
              const colorClass = getTypeColor(rec.type);
              
              return (
                <Card 
                  key={rec.id} 
                  className={`overflow-hidden transition-all hover:shadow-lg ${
                    rec.status === 'APPROVED' ? 'opacity-60' : 
                    rec.status === 'REJECTED' ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex">
                    {/* Left accent bar */}
                    <div className={`w-1 ${
                      rec.priority === 'HIGH' ? 'bg-red-500' :
                      rec.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold">{rec.title}</h3>
                              <Badge variant="outline" className={getPriorityBadge(rec.priority)}>
                                {rec.priority}
                              </Badge>
                              {rec.status !== 'PENDING' && (
                                <Badge variant="outline" className={
                                  rec.status === 'APPROVED' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-gray-500/20 text-gray-400'
                                }>
                                  {rec.status}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">
                              {rec.description}
                            </p>
                            
                            {/* Metrics */}
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span>Spend: {formatCurrency(rec.metrics.currentSpend)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span>Revenue: {formatCurrency(rec.metrics.currentRevenue)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="h-4 w-4 text-muted-foreground" />
                                <span>ROAS: {rec.metrics.currentRoas.toFixed(2)}x</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                <span>{rec.metrics.purchases} purchases</span>
                              </div>
                            </div>
                            
                            {/* Reasoning (expandable) */}
                            <details className="mt-3">
                              <summary className="text-sm text-primary cursor-pointer hover:underline">
                                View detailed reasoning
                              </summary>
                              <div className="mt-2 p-3 bg-muted/30 rounded-lg text-sm">
                                <p className="mb-2">{rec.reasoning}</p>
                                <p className="text-green-400 font-medium">
                                  💡 {rec.expectedImpact}
                                </p>
                              </div>
                            </details>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        {rec.status === 'PENDING' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActionDialog({ rec, action: 'reject' })}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setActionDialog({ rec, action: 'approve' })}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.action === 'approve' ? 'Approve Recommendation' : 'Reject Recommendation'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.action === 'approve' 
                ? `Are you sure you want to approve "${actionDialog?.rec.title}"? This will mark it as approved for implementation.`
                : `Are you sure you want to reject "${actionDialog?.rec.title}"? You can always revisit this later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionDialog && handleAction(actionDialog.rec, actionDialog.action)}
              className={actionDialog?.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {actionDialog?.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
