import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto', () => {
  let updateUserDto: UpdateUserDto;

  beforeEach(() => {
    updateUserDto = new UpdateUserDto();
  });

  describe('optional fields', () => {
    it('should pass validation with no fields provided', async () => {
      const errors = await validate(updateUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with some fields provided', async () => {
      updateUserDto.email = 'john.doe@example.com';
      const errors = await validate(updateUserDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('email', () => {
    it('should return error if email is invalid', async () => {
      updateUserDto.email = 'invalid-email';
      updateUserDto.name = 'John Doe';
      updateUserDto.password = 'Password123!';

      const errors = await validate(updateUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should pass if email is valid', async () => {
      updateUserDto.email = 'john.doe@example.com';
      updateUserDto.name = 'John Doe';
      updateUserDto.password = 'Password123!';

      const errors = await validate(updateUserDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('name', () => {
    it('should return error if name is empty', async () => {
      updateUserDto.email = 'john.doe@example.com';
      updateUserDto.name = '';
      updateUserDto.password = 'Password123!';

      const errors = await validate(updateUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass if name is valid', async () => {
      updateUserDto.email = 'john.doe@example.com';
      updateUserDto.name = 'John Doe';
      updateUserDto.password = 'Password123!';

      const errors = await validate(updateUserDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('password', () => {
    it('should return error if password is too short', async () => {
      updateUserDto.email = 'john.doe@example.com';
      updateUserDto.name = 'John Doe';
      updateUserDto.password = 'Pass';

      const errors = await validate(updateUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('password');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should pass if password is valid', async () => {
      updateUserDto.email = 'john.doe@example.com';
      updateUserDto.name = 'John Doe';
      updateUserDto.password = 'Password123!';

      const errors = await validate(updateUserDto);
      expect(errors).toHaveLength(0);
    });
  });
});