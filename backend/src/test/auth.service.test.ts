import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { AuthService } from '../services/auth.js';

// Mock the database
vi.mock('../config/database.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  }
}));

// Mock bcrypt
vi.mock('bcrypt');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with correct salt rounds', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword';
      
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);

      const result = await AuthService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should verify password correctly', async () => {
      const password = 'testPassword123';
      const hash = 'hashedPassword';
      
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await AuthService.verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'wrongPassword';
      const hash = 'hashedPassword';
      
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await AuthService.verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testPassword123'
      };

      const hashedPassword = 'hashedPassword';
      const mockUser = {
        id: 1,
        email: userData.email,
        subscriptionTier: 'free',
        monthlyUsage: 0,
        usageResetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database operations
      const { db } = await import('../config/database.js');
      
      // Mock select (check existing user)
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // No existing user
          })
        })
      } as any);

      // Mock insert
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUser])
        })
      } as any);

      // Mock bcrypt
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);

      const result = await AuthService.createUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'testPassword123'
      };

      const existingUser = { id: 1, email: userData.email };

      // Mock database operations
      const { db } = await import('../config/database.js');
      
      // Mock select (existing user found)
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingUser])
          })
        })
      } as any);

      await expect(AuthService.createUser(userData)).rejects.toThrow('User already exists with this email');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword';

      const mockUser = {
        id: 1,
        email,
        passwordHash: hashedPassword,
        subscriptionTier: 'free',
        monthlyUsage: 0,
        usageResetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUser = {
        id: mockUser.id,
        email: mockUser.email,
        subscriptionTier: mockUser.subscriptionTier,
        monthlyUsage: mockUser.monthlyUsage,
        usageResetDate: mockUser.usageResetDate,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      // Mock database operations
      const { db } = await import('../config/database.js');
      
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      // Mock bcrypt
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await AuthService.authenticateUser(email, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toEqual(expectedUser);
    });

    it('should return null for non-existent user', async () => {
      const email = 'nonexistent@example.com';
      const password = 'testPassword123';

      // Mock database operations
      const { db } = await import('../config/database.js');
      
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      } as any);

      const result = await AuthService.authenticateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null for incorrect password', async () => {
      const email = 'test@example.com';
      const password = 'wrongPassword';
      const hashedPassword = 'hashedPassword';

      const mockUser = {
        id: 1,
        email,
        passwordHash: hashedPassword,
        subscriptionTier: 'free',
        monthlyUsage: 0,
        usageResetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database operations
      const { db } = await import('../config/database.js');
      
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      // Mock bcrypt
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await AuthService.authenticateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find user by ID', async () => {
      const userId = 1;
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        subscriptionTier: 'free',
        monthlyUsage: 0,
        usageResetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database operations
      const { db } = await import('../config/database.js');
      
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      const result = await AuthService.findUserById(userId);

      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user ID', async () => {
      const userId = 999;

      // Mock database operations
      const { db } = await import('../config/database.js');
      
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      } as any);

      const result = await AuthService.findUserById(userId);

      expect(result).toBeNull();
    });
  });
});