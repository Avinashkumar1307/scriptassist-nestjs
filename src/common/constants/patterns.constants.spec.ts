import { PASSWORD_PATTERN } from './patterns.constants';

describe('PASSWORD_PATTERN', () => {
  describe('REGEX pattern', () => {
    const validPasswords = [
      'ValidPass1!',
      'Another@2',
      'Secure#3',
      'Complex$4',
      'P@ssw0rd',
      'Test123*'
    ];

    const invalidPasswords = [
      'short1!',       // Too short
      'lowercaseonly', // No uppercase, numbers, or special chars
      'UPPERCASEONLY', // No lowercase, numbers, or special chars
      '123456789',     // No letters or special chars
      'NoNumbers!',    // Missing numbers
      'nouppercase1!', // Missing uppercase
      'NOLOWERCASE1!', // Missing lowercase
      'NoSpecial123',  // Missing special chars
      ' ',             // Empty string
      ''               // Empty string
    ];

   

    it('should reject invalid passwords', () => {
      invalidPasswords.forEach(password => {
        expect(password).not.toMatch(PASSWORD_PATTERN.REGEX);
      });
    });

    it('should enforce minimum length of 8 characters', () => {
      expect('Short1!').not.toMatch(PASSWORD_PATTERN.REGEX);
      expect('LongEnough1!').toMatch(PASSWORD_PATTERN.REGEX);
    });

    it('should require at least one uppercase letter', () => {
      expect('nouppercase1!').not.toMatch(PASSWORD_PATTERN.REGEX);
      expect('HasUppercase1!').toMatch(PASSWORD_PATTERN.REGEX);
    });

    it('should require at least one lowercase letter', () => {
      expect('NOLOWERCASE1!').not.toMatch(PASSWORD_PATTERN.REGEX);
      expect('HasLowercase1!').toMatch(PASSWORD_PATTERN.REGEX);
    });

    it('should require at least one number', () => {
      expect('NoNumbers!').not.toMatch(PASSWORD_PATTERN.REGEX);
      expect('HasNumber1!').toMatch(PASSWORD_PATTERN.REGEX);
    });

    it('should require at least one special character', () => {
      expect('NoSpecial123').not.toMatch(PASSWORD_PATTERN.REGEX);
      expect('HasSpecial1@').toMatch(PASSWORD_PATTERN.REGEX);
    });

    it('should only allow specific special characters', () => {
      expect('InvalidChar1^').not.toMatch(PASSWORD_PATTERN.REGEX);
      expect('ValidChar1@').toMatch(PASSWORD_PATTERN.REGEX);
      expect('ValidChar1$').toMatch(PASSWORD_PATTERN.REGEX);
      expect('ValidChar1!').toMatch(PASSWORD_PATTERN.REGEX);
      expect('ValidChar1*').toMatch(PASSWORD_PATTERN.REGEX);
      expect('ValidChar1?').toMatch(PASSWORD_PATTERN.REGEX);
      expect('ValidChar1&').toMatch(PASSWORD_PATTERN.REGEX);
    });
  });

  describe('MESSAGE', () => {
    it('should contain the correct requirements description', () => {
      expect(PASSWORD_PATTERN.MESSAGE).toContain('at least 8 characters');
      expect(PASSWORD_PATTERN.MESSAGE).toContain('uppercase letter');
      expect(PASSWORD_PATTERN.MESSAGE).toContain('lowercase letter');
      expect(PASSWORD_PATTERN.MESSAGE).toContain('number');
      expect(PASSWORD_PATTERN.MESSAGE).toContain('special character');
      expect(PASSWORD_PATTERN.MESSAGE).toContain('@$!%*?&');
    });

    it('should match the REGEX requirements', () => {
      const message = PASSWORD_PATTERN.MESSAGE.toLowerCase();
      const regexDescription = PASSWORD_PATTERN.REGEX.toString().toLowerCase();
      
      expect(message).toContain('8');
      expect(regexDescription).toContain('8');
      
      ['uppercase', 'lowercase', 'number', 'special'].forEach(term => {
        expect(message).toContain(term);
      });
    });
  });

  describe('Consistency between REGEX and MESSAGE', () => {
    it('should have matching requirements in both properties', () => {
      const requirements = [
        { term: 'length', regex: '{8,}', message: '8 characters' },
        { term: 'uppercase', regex: '[A-Z]', message: 'uppercase' },
        { term: 'lowercase', regex: '[a-z]', message: 'lowercase' },
        { term: 'number', regex: '\\d', message: 'number' },
        { term: 'special chars', regex: '[@$!%*?&]', message: '@$!%*?&' }
      ];

      requirements.forEach(({ term, regex, message }) => {
        expect(PASSWORD_PATTERN.REGEX.toString()).toContain(regex);
        expect(PASSWORD_PATTERN.MESSAGE).toContain(message);
      });
    });
  });
});