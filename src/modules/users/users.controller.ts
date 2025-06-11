import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll(@Request() req: any) {
    const role = req.user.role;
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required to view all users');
    }
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    const role = req.user.role;
    if (role === 'admin' || userId === id) {
      return this.usersService.remove(id);
    }
    throw new ForbiddenException('You do not have permission to view this user');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.id;
    if (userId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    const role = req.user.role;
    
    // Admins can delete any user
    if (role === 'admin' || userId === id) {
      return this.usersService.remove(id);
    }

    // Otherwise, forbid
    throw new ForbiddenException('You do not have permission to delete this user');
  }
}
