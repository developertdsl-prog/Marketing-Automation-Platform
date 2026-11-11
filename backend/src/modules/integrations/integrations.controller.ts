import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { QueryIntegrationDto } from './dto/query-integration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('providers')
  getSupportedProviders() {
    return this.integrationsService.getSupportedProviders();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createIntegrationDto: CreateIntegrationDto,
    @CurrentUser() user: any,
  ) {
    return this.integrationsService.create(
      createIntegrationDto,
      user.organization.id,
    );
  }

  @Get()
  findAll(
    @Query() query: QueryIntegrationDto,
    @CurrentUser() user: any,
  ) {
    return this.integrationsService.findAll(user.organization.id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.integrationsService.findOne(id, user.organization.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIntegrationDto: UpdateIntegrationDto,
    @CurrentUser() user: any,
  ) {
    return this.integrationsService.update(
      id,
      updateIntegrationDto,
      user.organization.id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.integrationsService.remove(id, user.organization.id);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  test(@Param('id') id: string, @CurrentUser() user: any) {
    return this.integrationsService.test(id, user.organization.id);
  }
}
