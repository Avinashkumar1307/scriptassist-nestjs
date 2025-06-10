import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

jest.setTimeout(600000);

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should authenticate a user with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should fail to authenticate with incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
    });

    it('should fail to authenticate with non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
    });

    it('should validate request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'short',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should fail to register with an existing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john.doe@example.com', // Assuming this email is already registered
          password: 'Password123!',
        });

      expect(response.status).toBe(409); // Conflict
    });

    it('should validate request body for registration', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'invalid-email',
          password: 'short',
        });

      expect(response.status).toBe(400);
    });
  });
});
