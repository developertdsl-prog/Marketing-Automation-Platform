import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { HealthController } from './common/controllers/health.controller';

// Feature modules will be imported here as they are built:
// import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module';
// import { ContactsModule } from './modules/contacts/contacts.module';
// import { LeadsModule } from './modules/leads/leads.module';
// import { CampaignsModule } from './modules/campaigns/campaigns.module';
// import { WorkflowsModule } from './modules/workflows/workflows.module';
// import { EmailModule } from './modules/email/email.module';
// import { IntegrationsModule } from './modules/integrations/integrations.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    AppConfigModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env'],
    }),
    TerminusModule,
    PrismaModule,
    // Feature modules (placeholder comments above — uncomment as milestones progress)
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
