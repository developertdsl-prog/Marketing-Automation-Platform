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
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createCampaignDto: CreateCampaignDto,
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.create(
      createCampaignDto,
      user.organization.id,
      user.sub,
    );
  }

  @Get()
  findAll(
    @Query() query: QueryCampaignDto,
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.findAll(user.organization.id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.campaignsService.findOne(id, user.organization.id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string, @CurrentUser() user: any) {
    return this.campaignsService.getStats(id, user.organization.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.update(
      id,
      updateCampaignDto,
      user.organization.id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.campaignsService.remove(id, user.organization.id);
  }

  @Post(':id/launch')
  @HttpCode(HttpStatus.OK)
  launch(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.launch(id, user.organization.id, user.sub);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  pause(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.pause(id, user.organization.id);
  }
}
