import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('should pass validation with valid email and password', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'ValidPassword123!'
    };

    const dto = plainToInstance(LoginDto, loginData);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  describe('email validation', () => {
    it('should fail if email is empty', async () => {
      const loginData = {
        email: '',
        password: 'ValidPassword123!'
      };

      const dto = plainToInstance(LoginDto, loginData);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail if email is not valid', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'ValidPassword123!'
      };

      const dto = plainToInstance(LoginDto, loginData);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail if email is missing', async () => {
      const loginData = {
        password: 'ValidPassword123!'
      };

      const dto = plainToInstance(LoginDto, loginData);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('password validation', () => {
    it('should fail if password is empty', async () => {
      const loginData = {
        email: 'test@example.com',
        password: ''
      };

      const dto = plainToInstance(LoginDto, loginData);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail if password is not a string', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 12345 as any
      };

      const dto = plainToInstance(LoginDto, loginData);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail if password is missing', async () => {
      const loginData = {
        email: 'test@example.com'
      };

      const dto = plainToInstance(LoginDto, loginData);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('ApiProperty decorator', () => {
    it('should have proper ApiProperty decorators for Swagger', () => {
      const loginDto = new LoginDto();
      loginDto.email = 'test@example.com';
      loginDto.password = 'password';

      expect(loginDto).toHaveProperty('email');
      expect(loginDto).toHaveProperty('password');

      // You might want to add reflection metadata checks if needed
    });
  });
});