import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { HealthController } from './common/controllers/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { LeadsModule } from './modules/leads/leads.module';

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
    // Feature modules (uncomment as milestones progress):
    // UsersModule, CampaignsModule, WorkflowsModule, EmailModule,
    // IntegrationsModule, AnalyticsModule, NotificationsModule
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
