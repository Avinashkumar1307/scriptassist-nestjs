import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ERROR_MESSAGES } from 'src/common/constants/error.constants';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException(ERROR_MESSAGES.USER.EMAIL_EXISTS);
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = this.usersRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });

      const savedUser = await this.usersRepository.save(user);
      this.logger.log(`User created with ID: ${savedUser.id}`);
      return savedUser;
    } catch (error) {
      this.logError(error, 'create');

      if (error instanceof ConflictException) {
        throw error;
      }

      if (error instanceof Error && 'code' in error && error.code === '23505') {
        // PostgreSQL duplicate key error
        throw new ConflictException(ERROR_MESSAGES.USER.EMAIL_EXISTS);
      }

      throw new InternalServerErrorException(ERROR_MESSAGES.USER.CREATE_FAILED);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.usersRepository.find();
    } catch (error) {
      this.logError(error, 'findAll');
      throw new InternalServerErrorException(ERROR_MESSAGES.USER.FETCH_ALL_FAILED);
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND(id));
      }

      return user;
    } catch (error) {
      this.logError(error, 'findOne');

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(ERROR_MESSAGES.USER.FETCH_FAILED);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      if (!email) {
        throw new BadRequestException(ERROR_MESSAGES.USER.EMAIL_REQUIRED);
      }

      return await this.usersRepository.findOne({ where: { email } });
    } catch (error) {
      this.logError(error, 'findByEmail');

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(ERROR_MESSAGES.USER.FETCH_FAILED);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.findOne(id);

      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      this.usersRepository.merge(user, updateUserDto);
      const updatedUser = await this.usersRepository.save(user);

      this.logger.log(`User updated with ID: ${id}`);
      return updatedUser;
    } catch (error) {
      this.logError(error, 'update');

      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new ConflictException(ERROR_MESSAGES.USER.EMAIL_EXISTS);
      }

      throw new InternalServerErrorException(ERROR_MESSAGES.USER.UPDATE_FAILED);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const user = await this.findOne(id);
      await this.usersRepository.remove(user);
      this.logger.log(`User deleted with ID: ${id}`);
    } catch (error) {
      this.logError(error, 'remove');

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(ERROR_MESSAGES.USER.DELETE_FAILED);
    }
  }

  private logError(error: unknown, context: string): void {
    if (error instanceof Error) {
      this.logger.error(`[${context}] ${error.message}`, error.stack);
    } else {
      this.logger.error(`[${context}] Unknown error occurred`);
    }
  }
}
