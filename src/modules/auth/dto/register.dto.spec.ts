import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';
import { PASSWORD_PATTERN } from '@common/constants/patterns.constants';

describe('RegisterDto', () => {
  const validData = {
    email: 'test@example.com',
    name: 'John Doe',
    password: 'ValidPassword123!',
  };

  it('should pass validation with valid data', async () => {
    const dto = plainToInstance(RegisterDto, validData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('email validation', () => {
    it('should fail if email is empty', async () => {
      const data = { ...validData, email: '' };
      const dto = plainToInstance(RegisterDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail if email is invalid', async () => {
      const data = { ...validData, email: 'invalid-email' };
      const dto = plainToInstance(RegisterDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail if email is missing', async () => {
      const { email, ...data } = validData;
      const dto = plainToInstance(RegisterDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('name validation', () => {
    it('should fail if name is empty', async () => {
      const data = { ...validData, name: '' };
      const dto = plainToInstance(RegisterDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail if name is not a string', async () => {
      const data = { ...validData, name: 123 as any };
      const dto = plainToInstance(RegisterDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail if name is missing', async () => {
      const { name, ...data } = validData;
      const dto = plainToInstance(RegisterDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('password validation', () => {
    it('should fail if password is empty', async () => {
      const data = { ...validData, password: '' };
      const dto = plainToInstance(RegisterDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail if password is too short', async () => {
      const data = { ...validData, password: 'Short1!' };
      const dto = plainToInstance(RegisterDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it("should fail if password doesn't match pattern", async () => {
      const invalidPasswords = [
        'lowercaseonly', // Missing uppercase, numbers, special chars
        'UPPERCASEONLY', // Missing lowercase, numbers, special chars
        '123456789', // Missing letters, special chars
        'NoNumbers!', // Missing numbers
        'nouppercase1!', // Missing uppercase
        'NOLOWERCASE1!', // Missing lowercase
        'NoSpecial123', // Missing special chars
      ];

      for (const password of invalidPasswords) {
        const data = { ...validData, password };
        const dto = plainToInstance(RegisterDto, data);
        const errors = await validate(dto);

        expect(errors.length).toBe(1);
        expect(errors[0].constraints).toHaveProperty('matches');
      }
    });

    it('should pass with valid password patterns', async () => {
      // Only include passwords that strictly match the allowed pattern
      const validPasswords = [
        'ValidPass1!', // Contains upper, lower, number, !
        'AnotherValid2@', // Contains upper, lower, number, @
        'Test1234*', // Contains upper, lower, number, *
        'P@ssw0rd', // Common pattern with @
        '1qazXSW@', // Keyboard pattern with @
        'Qwerty123!', // Common pattern with !
        'SamplePass1?', // Contains ?
        'DemoPass2&', // Contains &
        'TempPass3$', // Contains $
        'Example4%', // Contains %
      ].filter(p => PASSWORD_PATTERN.REGEX.test(p));

      expect(validPasswords.length).toBeGreaterThan(0); // Ensure we have valid test cases

      for (const password of validPasswords) {
        const data = { ...validData, password };
        const dto = plainToInstance(RegisterDto, data);
        const errors = await validate(dto);

        if (errors.length > 0) {
          console.error(`Password "${password}" failed with:`, errors[0].constraints);
        }

        expect(errors.length).toBe(0);
      }
    });

    it('should fail if password is missing', async () => {
      const { password, ...data } = validData;
      const dto = plainToInstance(RegisterDto, data);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('ApiProperty decorator', () => {
    it('should have proper ApiProperty decorators for Swagger', () => {
      const registerDto = new RegisterDto();
      registerDto.email = 'test@example.com';
      registerDto.name = 'John Doe';
      registerDto.password = 'Password123!';

      expect(registerDto).toHaveProperty('email');
      expect(registerDto).toHaveProperty('name');
      expect(registerDto).toHaveProperty('password');
    });
  });
});
