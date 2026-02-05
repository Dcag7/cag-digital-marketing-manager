import { prisma } from '@/lib/db';
import { EmailCampaignsClient } from './email-client';

export default async function EmailCampaignsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  // Get all email campaigns with their metrics
  const emailCampaigns = await prisma.shopifyEmailCampaign.findMany({
    where: { workspaceId },
    include: {
      metrics: {
        orderBy: { date: 'desc' },
      },
    },
    orderBy: { sentAt: 'desc' },
  });

  // Transform to client format
  const campaigns = emailCampaigns.map((campaign) => {
    // Aggregate metrics
    const totalMetrics = campaign.metrics.reduce(
      (acc, m) => ({
        sent: acc.sent + m.sent,
        delivered: acc.delivered + m.delivered,
        opened: acc.opened + m.opened,
        clicked: acc.clicked + m.clicked,
        bounced: acc.bounced + m.bounced,
        unsubscribed: acc.unsubscribed + m.unsubscribed,
        conversions: acc.conversions + m.conversions,
        revenue: acc.revenue + m.revenue,
      }),
      {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        conversions: 0,
        revenue: 0,
      }
    );

    return {
      id: campaign.id,
      campaignId: campaign.campaignId,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      subject: campaign.subject,
      sentAt: campaign.sentAt?.toISOString() || null,
      scheduledAt: campaign.scheduledAt?.toISOString() || null,
      metrics: {
        ...totalMetrics,
        openRate: totalMetrics.delivered > 0 
          ? (totalMetrics.opened / totalMetrics.delivered) * 100 
          : 0,
        clickRate: totalMetrics.opened > 0 
          ? (totalMetrics.clicked / totalMetrics.opened) * 100 
          : 0,
        bounceRate: totalMetrics.sent > 0 
          ? (totalMetrics.bounced / totalMetrics.sent) * 100 
          : 0,
      },
    };
  });

  return <EmailCampaignsClient workspaceId={workspaceId} campaigns={campaigns} />;
}
