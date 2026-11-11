import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: any) {
    return this.analyticsService.getDashboard(user.organization.id);
  }

  @Get('contact-growth')
  getContactGrowth(
    @CurrentUser() user: any,
    @Query('days') days: number,
  ) {
    return this.analyticsService.getContactGrowth(
      user.organization.id,
      days || 30,
    );
  }

  @Get('campaign-performance')
  getCampaignPerformance(
    @CurrentUser() user: any,
    @Query('limit') limit: number,
  ) {
    return this.analyticsService.getCampaignPerformance(
      user.organization.id,
      limit || 10,
    );
  }

  @Get('email-performance')
  getEmailPerformance(@CurrentUser() user: any) {
    return this.analyticsService.getEmailPerformance(user.organization.id);
  }

  @Get('lead-analytics')
  getLeadAnalytics(@CurrentUser() user: any) {
    return this.analyticsService.getLeadAnalytics(user.organization.id);
  }

  @Get('campaign-events')
  getCampaignEvents(
    @CurrentUser() user: any,
    @Query('campaignId') campaignId: string,
    @Query('days') days: number,
  ) {
    return this.analyticsService.getCampaignEventsOverTime(
      user.organization.id,
      campaignId || undefined,
      days || 30,
    );
  }

  @Get('top-campaigns')
  getTopCampaigns(
    @CurrentUser() user: any,
    @Query('limit') limit: number,
  ) {
    return this.analyticsService.getTopCampaigns(
      user.organization.id,
      limit || 5,
    );
  }

  @Get('conversion-metrics')
  getConversionMetrics(@CurrentUser() user: any) {
    return this.analyticsService.getConversionMetrics(user.organization.id);
  }
}
