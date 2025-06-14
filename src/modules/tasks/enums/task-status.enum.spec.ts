import { TaskStatus } from './task-status.enum';

describe('TaskStatus Enum', () => {
  // Test all defined enum values
  describe('Value Definitions', () => {
    it('should have PENDING status', () => {
      expect(TaskStatus.PENDING).toBe('PENDING');
    });

    it('should have IN_PROGRESS status', () => {
      expect(TaskStatus.IN_PROGRESS).toBe('IN_PROGRESS');
    });

    it('should have COMPLETED status', () => {
      expect(TaskStatus.COMPLETED).toBe('COMPLETED');
    });
  });

  // Test type safety and valid values
  describe('Type Safety', () => {
    it('should only contain the three defined values', () => {
      const values = Object.values(TaskStatus);
      expect(values).toHaveLength(3);
      expect(values).toEqual(expect.arrayContaining([
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED'
      ]));
    });

    it('should reject invalid status values', () => {
      const invalidValues = ['', 'DONE', 'STARTED', null, undefined, 1];
      
      invalidValues.forEach(value => {
        expect(Object.values(TaskStatus)).not.toContain(value);
      });
    });
  });

  // Test TypeScript type enforcement
  describe('TypeScript Integration', () => {
    it('should enforce proper typing', () => {
      // Valid assignments
      const pending: TaskStatus = TaskStatus.PENDING;
      const inProgress: TaskStatus = TaskStatus.IN_PROGRESS;
      const completed: TaskStatus = TaskStatus.COMPLETED;

      expect(pending).toBe('PENDING');
      expect(inProgress).toBe('IN_PROGRESS');
      expect(completed).toBe('COMPLETED');

      // Invalid assignments (tested with @ts-expect-error)
      // @ts-expect-error
      const invalid: TaskStatus = 'DONE';
      // @ts-expect-error
      const invalid2: TaskStatus = 2;
    });
  });

  // Test string behavior
  describe('String Behavior', () => {
    it('should use string values', () => {
      expect(typeof TaskStatus.PENDING).toBe('string');
      expect(typeof TaskStatus.IN_PROGRESS).toBe('string');
      expect(typeof TaskStatus.COMPLETED).toBe('string');
    });

    it('should maintain case sensitivity', () => {
      expect(TaskStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(TaskStatus.IN_PROGRESS).not.toBe('in_progress');
    });
  });

  // Test iteration and ordering
  describe('Enum Iteration', () => {
    it('should be iterable in defined order', () => {
      const values = Object.values(TaskStatus);
      expect(values[0]).toBe('PENDING');
      expect(values[1]).toBe('IN_PROGRESS');
      expect(values[2]).toBe('COMPLETED');
    });

    it('should maintain consistent keys and values', () => {
      const entries = Object.entries(TaskStatus);
      expect(entries).toEqual([
        ['PENDING', 'PENDING'],
        ['IN_PROGRESS', 'IN_PROGRESS'],
        ['COMPLETED', 'COMPLETED']
      ]);
    });
  });

  // Optional: Test utility function for status validation
  describe('Status Validation', () => {
    const isValidTaskStatus = (value: any): value is TaskStatus => {
      return Object.values(TaskStatus).includes(value);
    };

    it('should validate status values correctly', () => {
      expect(isValidTaskStatus('PENDING')).toBe(true);
      expect(isValidTaskStatus('IN_PROGRESS')).toBe(true);
      expect(isValidTaskStatus('COMPLETED')).toBe(true);
      expect(isValidTaskStatus('')).toBe(false);
      expect(isValidTaskStatus(null)).toBe(false);
      expect(isValidTaskStatus('DONE')).toBe(false);
    });
  });
});