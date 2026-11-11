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
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createLeadDto: CreateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.create(createLeadDto, user.organization.id);
  }

  @Get()
  findAll(@Query() query: QueryLeadDto, @CurrentUser() user: any) {
    return this.leadsService.findAll(user.organization.id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leadsService.findOne(id, user.organization.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.update(id, updateLeadDto, user.organization.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leadsService.remove(id, user.organization.id);
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() body: { teamId?: string; ownerId?: string },
    @CurrentUser() user: any,
  ) {
    return this.leadsService.assign(id, user.organization.id, body.teamId, body.ownerId);
  }
}
