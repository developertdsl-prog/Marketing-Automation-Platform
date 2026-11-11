import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { HealthController } from './common/controllers/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { LeadsModule } from './modules/leads/leads.module';
import { EmailTemplatesModule } from './modules/email-templates/email-templates.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    AppConfigModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env'],
    }),
    TerminusModule,
    PrismaModule,
    AuthModule,
    ContactsModule,
    LeadsModule,
    EmailTemplatesModule,
    CampaignsModule,
    WorkflowsModule,
    IntegrationsModule,
    NotificationsModule,
    // Feature modules (uncomment as milestones progress):
    // UsersModule, EmailModule,
    // AnalyticsModule
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
