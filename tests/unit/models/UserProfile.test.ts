import { describe, it, expect } from 'vitest';
import { USER_PROFILE_CONSTRAINTS } from '../../../src/models/UserProfile';
import { EXPERIENCE_CONSTRAINTS } from '../../../src/models/Experience';
import { EDUCATION_CONSTRAINTS } from '../../../src/models/Education';

describe('UserProfile Model', () => {
  describe('USER_PROFILE_CONSTRAINTS', () => {
    it('should define name length constraints', () => {
      expect(USER_PROFILE_CONSTRAINTS.NAME_MIN_LENGTH).toBe(1);
      expect(USER_PROFILE_CONSTRAINTS.NAME_MAX_LENGTH).toBe(200);
    });

    it('should define skills constraints', () => {
      expect(USER_PROFILE_CONSTRAINTS.SKILLS_MIN_COUNT).toBe(1);
      expect(USER_PROFILE_CONSTRAINTS.SKILLS_MAX_COUNT).toBe(50);
      expect(USER_PROFILE_CONSTRAINTS.SKILL_MIN_LENGTH).toBe(1);
      expect(USER_PROFILE_CONSTRAINTS.SKILL_MAX_LENGTH).toBe(100);
    });

    it('should define experience constraints', () => {
      expect(USER_PROFILE_CONSTRAINTS.EXPERIENCE_MIN_COUNT).toBe(1);
      expect(USER_PROFILE_CONSTRAINTS.EXPERIENCE_MAX_COUNT).toBe(15);
    });

    it('should define education constraints', () => {
      expect(USER_PROFILE_CONSTRAINTS.EDUCATION_MAX_COUNT).toBe(10);
    });
  });

  describe('EXPERIENCE_CONSTRAINTS', () => {
    it('should define experience field constraints', () => {
      expect(EXPERIENCE_CONSTRAINTS.COMPANY_MIN_LENGTH).toBe(1);
      expect(EXPERIENCE_CONSTRAINTS.COMPANY_MAX_LENGTH).toBe(200);
      expect(EXPERIENCE_CONSTRAINTS.DESCRIPTION_MIN_WORDS).toBe(10);
      expect(EXPERIENCE_CONSTRAINTS.DESCRIPTION_MAX_WORDS).toBe(1000);
      expect(EXPERIENCE_CONSTRAINTS.SKILLS_MAX_COUNT).toBe(20);
    });
  });

  describe('EDUCATION_CONSTRAINTS', () => {
    it('should define education field constraints', () => {
      expect(EDUCATION_CONSTRAINTS.INSTITUTION_MIN_LENGTH).toBe(1);
      expect(EDUCATION_CONSTRAINTS.INSTITUTION_MAX_LENGTH).toBe(200);
      expect(EDUCATION_CONSTRAINTS.DEGREE_MIN_LENGTH).toBe(1);
      expect(EDUCATION_CONSTRAINTS.DEGREE_MAX_LENGTH).toBe(200);
    });
  });
});
