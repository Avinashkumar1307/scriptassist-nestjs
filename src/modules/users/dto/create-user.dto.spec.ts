import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';


describe('CreateUserDto', () => {
  let createUserDto: CreateUserDto;

  beforeEach(() => {
    createUserDto = new CreateUserDto();
  });

  describe('email', () => {
    it('should return error if email is empty', async () => {
      createUserDto.email = '';
      createUserDto.name = 'John Doe';
      createUserDto.password = 'Password123!';

      const errors = await validate(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should return error if email is invalid', async () => {
      createUserDto.email = 'invalid-email';
      createUserDto.name = 'John Doe';
      createUserDto.password = 'Password123!';

      const errors = await validate(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should pass if email is valid', async () => {
      createUserDto.email = 'john.doe@example.com';
      createUserDto.name = 'John Doe';
      createUserDto.password = 'Password123!';

      const errors = await validate(createUserDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('name', () => {
    it('should return error if name is empty', async () => {
      createUserDto.email = 'john.doe@example.com';
      createUserDto.name = '';
      createUserDto.password = 'Password123!';

      const errors = await validate(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass if name is valid', async () => {
      createUserDto.email = 'john.doe@example.com';
      createUserDto.name = 'John Doe';
      createUserDto.password = 'Password123!';

      const errors = await validate(createUserDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('password', () => {
    it('should return error if password is empty', async () => {
      createUserDto.email = 'john.doe@example.com';
      createUserDto.name = 'John Doe';
      createUserDto.password = '';

      const errors = await validate(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('password');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should return error if password is too short', async () => {
      createUserDto.email = 'john.doe@example.com';
      createUserDto.name = 'John Doe';
      createUserDto.password = 'Pass';

      const errors = await validate(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('password');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should pass if password is valid', async () => {
      createUserDto.email = 'john.doe@example.com';
      createUserDto.name = 'John Doe';
      createUserDto.password = 'Password123!';

      const errors = await validate(createUserDto);
      expect(errors).toHaveLength(0);
    });
  });
});