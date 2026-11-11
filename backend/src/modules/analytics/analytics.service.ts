import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dashboard overview analytics for an organization.
   */
  async getDashboard(organizationId: string) {
    const [
      totalContacts,
      totalLeads,
      activeCampaigns,
      totalCampaigns,
      totalSent,
      totalOpened,
      totalClicked,
      recentContacts,
      recentLeads,
      recentCampaigns,
    ] = await Promise.all([
      this.prisma.contact.count({ where: { organizationId } }),
      this.prisma.lead.count({ where: { organizationId } }),
      this.prisma.campaign.count({
        where: { organizationId, status: 'active' },
      }),
      this.prisma.campaign.count({ where: { organizationId } }),
      this.prisma.emailEvent.count({
        where: { organizationId, type: 'sent' },
      }),
      this.prisma.emailEvent.count({
        where: { organizationId, type: 'opened' },
      }),
      this.prisma.emailEvent.count({
        where: { organizationId, type: 'clicked' },
      }),
      this.prisma.contact.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
      }),
      this.prisma.lead.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { contact: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.campaign.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, status: true, createdAt: true },
      }),
    ]);

    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : '0.00';
    const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : '0.00';

    return {
      totalContacts,
      totalLeads,
      activeCampaigns,
      totalCampaigns,
      totalSent,
      totalOpened,
      totalClicked,
      openRate,
      clickRate,
      recentContacts,
      recentLeads,
      recentCampaigns,
    };
  }

  /**
   * Contact growth over time (last 30 days by default).
   */
  async getContactGrowth(organizationId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const contacts = await this.prisma.contact.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    });

    // Group by date
    const growthMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      growthMap[dateStr] = 0;
    }

    contacts.forEach((c) => {
      const dateStr = c.createdAt.toISOString().split('T')[0];
      if (growthMap[dateStr] !== undefined) {
        growthMap[dateStr] += 1;
      }
    });

    return Object.entries(growthMap).map(([date, count]) => ({
      date,
      contacts: count,
    }));
  }

  /**
   * Campaign performance analytics.
   */
  async getCampaignPerformance(organizationId: string, limit = 10) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            recipients: true,
            emailEvents: true,
          },
        },
        emailEvents: {
          select: { type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return campaigns.map((campaign) => {
      const eventsByType = campaign.emailEvents.reduce(
        (acc: Record<string, number>, event: { type: string }) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        },
        {},
      );

      const totalSent = eventsByType['sent'] || 0;
      const totalOpened = eventsByType['opened'] || 0;
      const totalClicked = eventsByType['clicked'] || 0;
      const totalBounced = eventsByType['bounced'] || 0;

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        type: campaign.type,
        totalRecipients: campaign._count.recipients,
        totalSent,
        totalOpened,
        totalClicked,
        totalBounced,
        openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : '0.00',
        clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : '0.00',
        bounceRate: totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(2) : '0.00',
        createdAt: campaign.createdAt,
      };
    });
  }

  /**
   * Email performance analytics (overall and by type).
   */
  async getEmailPerformance(organizationId: string) {
    const events = await this.prisma.emailEvent.findMany({
      where: { organizationId },
      select: { type: true, occurredAt: true },
    });

    const byType: Record<string, number> = {};
    events.forEach((e) => {
      byType[e.type] = (byType[e.type] || 0) + 1;
    });

    const totalSent = byType['sent'] || 0;
    const totalOpened = byType['opened'] || 0;
    const totalClicked = byType['clicked'] || 0;
    const totalBounced = byType['bounced'] || 0;
    const totalUnsubscribed = byType['unsubscribed'] || 0;
    const totalComplained = byType['complained'] || 0;

    return {
      totalSent,
      totalOpened,
      totalClicked,
      totalBounced,
      totalUnsubscribed,
      totalComplained,
      openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : '0.00',
      clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : '0.00',
      bounceRate: totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(2) : '0.00',
      unsubscribeRate: totalSent > 0 ? ((totalUnsubscribed / totalSent) * 100).toFixed(2) : '0.00',
      complaintRate: totalSent > 0 ? ((totalComplained / totalSent) * 100).toFixed(2) : '0.00',
      eventsByType: byType,
    };
  }

  /**
   * Lead analytics by status.
   */
  async getLeadAnalytics(organizationId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { organizationId },
      select: { status: true, score: true, value: true },
    });

    const byStatus: Record<string, number> = {};
    let totalScore = 0;
    let totalValue = 0;
    let leadsWithValue = 0;

    leads.forEach((lead) => {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      totalScore += lead.score;
      if (lead.value) {
        totalValue += Number(lead.value);
        leadsWithValue += 1;
      }
    });

    return {
      totalLeads: leads.length,
      byStatus,
      averageScore: leads.length > 0 ? (totalScore / leads.length).toFixed(2) : '0.00',
      totalValue: totalValue.toFixed(2),
      leadsWithValue,
    };
  }

  /**
   * Campaign events over time (for engagement charts).
   */
  async getCampaignEventsOverTime(
    organizationId: string,
    campaignId?: string,
    days = 30,
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      organizationId,
      occurredAt: { gte: startDate },
    };

    if (campaignId) {
      where.campaignId = campaignId;
    }

    const events = await this.prisma.emailEvent.findMany({
      where,
      select: { type: true, occurredAt: true },
    });

    const eventMap: Record<string, Record<string, number>> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      eventMap[dateStr] = { sent: 0, opened: 0, clicked: 0, bounced: 0 };
    }

    events.forEach((e) => {
      const dateStr = e.occurredAt.toISOString().split('T')[0];
      if (eventMap[dateStr] && eventMap[dateStr][e.type] !== undefined) {
        eventMap[dateStr][e.type] += 1;
      }
    });

    return Object.entries(eventMap).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  }

  /**
   * Top performing campaigns by open rate.
   */
  async getTopCampaigns(organizationId: string, limit = 5) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { organizationId, status: { in: ['completed', 'active'] } },
      include: {
        emailEvents: { select: { type: true } },
        _count: { select: { recipients: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 2,
    });

    const withRates = campaigns
      .map((campaign) => {
        const eventsByType = campaign.emailEvents.reduce(
          (acc: Record<string, number>, event: { type: string }) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
          },
          {},
        );
        const totalSent = eventsByType['sent'] || 0;
        const totalOpened = eventsByType['opened'] || 0;
        return {
          id: campaign.id,
          name: campaign.name,
          totalRecipients: campaign._count.recipients,
          totalSent,
          totalOpened,
          openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : '0.00',
        };
      })
      .filter((c) => c.totalSent > 0)
      .sort((a, b) => parseFloat(b.openRate) - parseFloat(a.openRate))
      .slice(0, limit);

    return withRates;
  }

  /**
   * Conversion metrics (leads converted vs total).
   */
  async getConversionMetrics(organizationId: string) {
    const [totalLeads, convertedLeads, totalValue] = await Promise.all([
      this.prisma.lead.count({ where: { organizationId } }),
      this.prisma.lead.count({
        where: { organizationId, status: 'converted' },
      }),
      this.prisma.lead.aggregate({
        where: { organizationId, status: 'converted' },
        _sum: { value: true },
      }),
    ]);

    const conversionRate =
      totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : '0.00';

    return {
      totalLeads,
      convertedLeads,
      conversionRate,
      totalConvertedValue: totalValue._sum.value
        ? totalValue._sum.value.toFixed(2)
        : '0.00',
    };
  }
}
