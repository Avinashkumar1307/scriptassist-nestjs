import { TaskPriority } from './task-priority.enum';

describe('TaskPriority Enum', () => {
  describe('Value Definitions', () => {
    it('should have LOW value', () => {
      expect(TaskPriority.LOW).toBe('LOW');
    });

    it('should have MEDIUM value', () => {
      expect(TaskPriority.MEDIUM).toBe('MEDIUM');
    });

    it('should have HIGH value', () => {
      expect(TaskPriority.HIGH).toBe('HIGH');
    });
  });

  describe('Type Safety', () => {
    it('should only allow defined values', () => {
      // Test valid values
      const validValues: TaskPriority[] = [
        TaskPriority.LOW,
        TaskPriority.MEDIUM,
        TaskPriority.HIGH
      ];
      
      validValues.forEach(value => {
        expect(Object.values(TaskPriority)).toContain(value);
      });

      // Test invalid values
      const invalidValues = ['LOW', 'URGENT', '', undefined, null, 1];
      invalidValues.forEach(value => {
        if (value !== 'LOW') { // 'LOW' is actually valid as string
          expect(Object.values(TaskPriority)).not.toContain(value);
        }
      });
    });

    it('should have exactly three values', () => {
      expect(Object.keys(TaskPriority).length).toBe(3);
    });
  });

  describe('Usage in Type System', () => {
    it('should enforce enum values in typed variables', () => {
      // Valid usage
      const lowPriority: TaskPriority = TaskPriority.LOW;
      const mediumPriority: TaskPriority = TaskPriority.MEDIUM;
      const highPriority: TaskPriority = TaskPriority.HIGH;
      
      expect(lowPriority).toBe('LOW');
      expect(mediumPriority).toBe('MEDIUM');
      expect(highPriority).toBe('HIGH');

      // Invalid usage (test with @ts-expect-error)
      // @ts-expect-error
      const invalidPriority: TaskPriority = 'URGENT';
      // @ts-expect-error
      const invalidPriority2: TaskPriority = 2;
    });
  });

  describe('String Representation', () => {
    it('should return string values', () => {
      expect(typeof TaskPriority.LOW).toBe('string');
      expect(typeof TaskPriority.MEDIUM).toBe('string');
      expect(typeof TaskPriority.HIGH).toBe('string');
    });

    it('should have expected string values', () => {
      expect(TaskPriority.LOW.toString()).toBe('LOW');
      expect(TaskPriority.MEDIUM.toString()).toBe('MEDIUM');
      expect(TaskPriority.HIGH.toString()).toBe('HIGH');
    });
  });

  describe('Iteration', () => {
    it('should be iterable', () => {
      const values = Object.values(TaskPriority);
      expect(values).toEqual(['LOW', 'MEDIUM', 'HIGH']);
    });

    it('should maintain order of values', () => {
      const entries = Object.entries(TaskPriority);
      expect(entries[0]).toEqual(['LOW', 'LOW']);
      expect(entries[1]).toEqual(['MEDIUM', 'MEDIUM']);
      expect(entries[2]).toEqual(['HIGH', 'HIGH']);
    });
  });
});