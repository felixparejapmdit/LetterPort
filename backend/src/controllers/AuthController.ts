import { Request, Response, NextFunction } from 'express';
import { ILetterRepository } from '../repositories/ILetterRepository';

export class AuthController {
  private readonly repository: ILetterRepository;

  constructor(repository: ILetterRepository) {
    this.repository = repository;
  }

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ success: false, message: 'Username and password are required' });
        return;
      }

      if (!this.repository.getUserByUsername) {
        res.status(500).json({ success: false, message: 'User repository not supported' });
        return;
      }

      const user = await this.repository.getUserByUsername(username);
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
        return;
      }

      // Check password
      if (user.passwordHash !== password) {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
        return;
      }

      // Simple, robust token structure: base64 encoded user info with timestamp
      const tokenPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        issuedAt: new Date().toISOString()
      };
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

      res.status(200).json({
        success: true,
        message: `Welcome back, ${user.username}!`,
        data: {
          token,
          user: user.toJSON()
        }
      });
    } catch (err) {
      next(err);
    }
  };

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'No authorization token provided' });
        return;
      }

      const token = authHeader.substring(7);
      let payload: any;
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        payload = JSON.parse(decoded);
      } catch {
        res.status(401).json({ success: false, message: 'Invalid authorization token' });
        return;
      }

      if (!this.repository.getUserById) {
        res.status(500).json({ success: false, message: 'User repository not supported' });
        return;
      }

      const user = await this.repository.getUserById(payload.id);
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: user.toJSON()
      });
    } catch (err) {
      next(err);
    }
  };
}
