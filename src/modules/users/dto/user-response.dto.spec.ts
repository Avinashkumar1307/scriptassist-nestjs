import { plainToClass } from 'class-transformer';
import { UserResponseDto } from './user-response.dto';

describe('UserResponseDto', () => {
  const validData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'user',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    password: 'secret', // Should be excluded
  };

  describe('serialization', () => {
    it('should expose only specified properties', () => {
      const dto = plainToClass(UserResponseDto, validData);
      const serialized = JSON.parse(JSON.stringify(dto));

      expect(serialized).toHaveProperty('id', validData.id);
      expect(serialized).toHaveProperty('email', validData.email);
      expect(serialized).toHaveProperty('name', validData.name);
      expect(serialized).toHaveProperty('role', validData.role);
      expect(serialized).toHaveProperty('createdAt', validData.createdAt.toISOString());
      expect(serialized).toHaveProperty('updatedAt', validData.updatedAt.toISOString());
      expect(serialized).not.toHaveProperty('password');
    });

    it('should handle partial data', () => {
      const partialData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'john.doe@example.com',
      };
      const dto = plainToClass(UserResponseDto, partialData);
      const serialized = JSON.parse(JSON.stringify(dto));

      expect(serialized).toHaveProperty('id', partialData.id);
      expect(serialized).toHaveProperty('email', partialData.email);
      expect(serialized).not.toHaveProperty('name');
      expect(serialized).not.toHaveProperty('role');
      expect(serialized).not.toHaveProperty('createdAt');
      expect(serialized).not.toHaveProperty('updatedAt');
    });
  });

  describe('constructor', () => {
    it('should correctly assign provided properties', () => {
      const dto = new UserResponseDto(validData);
      
      // Debugging logs (optional, can be removed after confirming fix)
      console.log('DTO after constructor:', dto);
      console.log('Expected createdAt:', validData.createdAt);
      console.log('Actual createdAt:', dto.createdAt);
      console.log('Expected updatedAt:', validData.updatedAt);
      console.log('Actual updatedAt:', dto.updatedAt);

      expect(dto.id).toEqual(validData.id);
      expect(dto.email).toEqual(validData.email);
      expect(dto.name).toEqual(validData.name);
      expect(dto.role).toEqual(validData.role);
      expect(dto.createdAt.toISOString()).toEqual(validData.createdAt.toISOString());
      expect(dto.updatedAt.toISOString()).toEqual(validData.updatedAt.toISOString());
      expect(dto).not.toHaveProperty('password');
    });

    it('should handle partial data in constructor', () => {
      const partialData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'john.doe@example.com',
      };
      const dto = new UserResponseDto(partialData);

      expect(dto.id).toEqual(partialData.id);
      expect(dto.email).toEqual(partialData.email);
      expect(dto.name).toBeUndefined();
      expect(dto.role).toBeUndefined();
      expect(dto.createdAt).toBeUndefined();
      expect(dto.updatedAt).toBeUndefined();
    });
  });
});