import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
import { ERROR_MESSAGES } from '../../common/constants/error.constants';
import { PASSWORD_PATTERN } from '../../common/constants/patterns.constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{
    access_token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }> {
    try {
      const { email, password } = loginDto;

      if (!email || !password) {
        throw new BadRequestException(ERROR_MESSAGES.AUTH.EMAIL_PASSWORD_REQUIRED);
      }

      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
      }

      const passwordValid = await bcrypt.compare(password, user.password);

      if (!passwordValid) {
        throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error: unknown) {
      this.logger.error(
        `Login failed for email: ${loginDto.email}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ERROR_MESSAGES.AUTH.LOGIN_FAILED);
    }
  }

  async register(registerDto: RegisterDto): Promise<{
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    token: string;
  }> {
    try {
      if (!PASSWORD_PATTERN.REGEX.test(registerDto.password)) {
        throw new BadRequestException(ERROR_MESSAGES.AUTH.WEAK_PASSWORD);
      }

      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_EXISTS);
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const user = await this.usersService.create({
        ...registerDto,
        password: hashedPassword,
      });

      const token = this.generateToken(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Registration failed for email: ${registerDto.email}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof Error) {
        if (
          ('code' in error && error.code === '23505') ||
          ('errno' in error && error.errno === 1062)
        ) {
          throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_EXISTS);
        }
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ERROR_MESSAGES.AUTH.REGISTRATION_FAILED);
    }
  }

  private generateToken(userId: string): string {
    try {
      const payload = { sub: userId };
      return this.jwtService.sign(payload, {
        expiresIn: '1d',
      });
    } catch (error: unknown) {
      this.logger.error(
        'Token generation failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(ERROR_MESSAGES.AUTH.TOKEN_GENERATION_FAILED);
    }
  }

  async validateUser(userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: string;
    password: string;
  }> {
    try {
      const user = await this.usersService.findOne(userId);

      if (!user) {
        throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
      }

      return user;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ERROR_MESSAGES.AUTH.VALIDATION_FAILED);
    }
  }

  async validateUserRoles(userId: string, requiredRoles: string[]): Promise<boolean> {
    try {
      const user = await this.validateUser(userId);
      if (!requiredRoles.includes(user.role)) {
        throw new ForbiddenException(ERROR_MESSAGES.AUTH.INSUFFICIENT_PERMISSIONS);
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ERROR_MESSAGES.AUTH.ROLE_VALIDATION_FAILED);
    }
  }
}
