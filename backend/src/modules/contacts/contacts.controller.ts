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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';
import { AddTagDto } from './dto/add-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createContactDto: CreateContactDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.create(createContactDto, user.organization.id);
  }

  @Get()
  findAll(
    @Query() query: QueryContactDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.findAll(user.organization.id, query);
  }

  @Get('tags')
  getTags(@CurrentUser() user: any) {
    return this.contactsService.getTags(user.organization.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contactsService.findOne(id, user.organization.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.update(id, updateContactDto, user.organization.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contactsService.remove(id, user.organization.id);
  }

  @Post(':id/tags')
  addTag(
    @Param('id') id: string,
    @Body() addTagDto: AddTagDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.addTag(id, addTagDto, user.organization.id);
  }

  @Delete(':id/tags/:tag')
  removeTag(
    @Param('id') id: string,
    @Param('tag') tag: string,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.removeTag(id, tag, user.organization.id);
  }
}
