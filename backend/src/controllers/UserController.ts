import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ILetterRepository } from '../repositories/ILetterRepository';
import { User, UserRole } from '../entities/User';

export class UserController {
  private readonly repository: ILetterRepository;

  constructor(repository: ILetterRepository) {
    this.repository = repository;
  }

  public listUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.repository.listUsers) {
        res.status(500).json({ success: false, message: 'User repository not supported' });
        return;
      }

      const users = await this.repository.listUsers();
      res.status(200).json({
        success: true,
        data: users.map(u => ({
          id: u.id,
          username: u.username,
          role: u.role,
          avatar: u.avatar,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        }))
      });
    } catch (err) {
      next(err);
    }
  };

  public createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password, role, avatar } = req.body;
      if (!username || !password) {
        res.status(400).json({ success: false, message: 'Username and password are required' });
        return;
      }

      if (!this.repository.getUserByUsername || !this.repository.saveUser) {
        res.status(500).json({ success: false, message: 'User repository not supported' });
        return;
      }

      const existing = await this.repository.getUserByUsername(username);
      if (existing) {
        res.status(409).json({ success: false, message: `Username "${username}" is already taken` });
        return;
      }

      const user = new User({
        id: uuidv4(),
        username,
        passwordHash: password,
        role: (role === 'admin' ? 'admin' : 'user') as UserRole,
        avatar: avatar || undefined
      });

      await this.repository.saveUser(user);

      res.status(201).json({
        success: true,
        message: `User "${user.username}" created successfully`,
        data: user.toJSON()
      });
    } catch (err) {
      next(err);
    }
  };

  public updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { username, password, role, avatar } = req.body;

      if (!this.repository.getUserById || !this.repository.updateUser) {
        res.status(500).json({ success: false, message: 'User repository not supported' });
        return;
      }

      const user = await this.repository.getUserById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (username && username.trim().toLowerCase() !== user.username) {
        if (this.repository.getUserByUsername) {
          const check = await this.repository.getUserByUsername(username);
          if (check && check.id !== id) {
            res.status(409).json({ success: false, message: `Username "${username}" is already in use` });
            return;
          }
        }
        user.updateUsername(username);
      }

      if (password && password.trim()) {
        user.updatePasswordHash(password.trim());
      }

      if (role && (role === 'admin' || role === 'user')) {
        user.updateRole(role);
      }

      if (avatar !== undefined) {
        user.updateAvatar(avatar);
      }

      await this.repository.updateUser(user);

      res.status(200).json({
        success: true,
        message: `User updated successfully`,
        data: user.toJSON()
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!this.repository.getUserById || !this.repository.deleteUser) {
        res.status(500).json({ success: false, message: 'User repository not supported' });
        return;
      }

      const user = await this.repository.getUserById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (user.username === 'admin') {
        res.status(400).json({ success: false, message: 'The primary admin account cannot be deleted' });
        return;
      }

      await this.repository.deleteUser(id);

      res.status(200).json({
        success: true,
        message: `User "${user.username}" deleted successfully`
      });
    } catch (err) {
      next(err);
    }
  };
}
