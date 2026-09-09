import { Request, Response, NextFunction } from 'express';
import { ILetterRepository } from '../repositories/ILetterRepository';

export class ClassificationController {
  private readonly repository: ILetterRepository;

  constructor(repository: ILetterRepository) {
    this.repository = repository;
  }

  // =========================================================
  // People Directory
  // =========================================================
  public listPeople = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string | undefined;
      const people = this.repository.listPeople ? await this.repository.listPeople(search) : [];
      res.status(200).json({ success: true, data: people });
    } catch (err) {
      next(err);
    }
  };

  public createPerson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, type } = req.body;
      if (!name || !name.trim()) {
        res.status(400).json({ success: false, error: { message: 'Name is required' } });
        return;
      }
      if (!this.repository.savePerson) {
        throw new Error('savePerson is not implemented');
      }
      const person = await this.repository.savePerson(name, type || 'contact');
      res.status(201).json({ success: true, data: person });
    } catch (err) {
      next(err);
    }
  };

  public deletePerson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (this.repository.deletePerson) {
        await this.repository.deletePerson(id);
      }
      res.status(200).json({ success: true, message: 'Person deleted successfully' });
    } catch (err) {
      next(err);
    }
  };

  // =========================================================
  // Document Statuses
  // =========================================================
  public listStatuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const statuses = this.repository.listStatuses ? await this.repository.listStatuses() : [];
      res.status(200).json({ success: true, data: statuses });
    } catch (err) {
      next(err);
    }
  };

  public createStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, label, color, description, isActive, sortOrder } = req.body;
      if (!code || !label) {
        res.status(400).json({ success: false, error: { message: 'Code and Label are required' } });
        return;
      }
      if (!this.repository.saveStatus) throw new Error('saveStatus not implemented');
      await this.repository.saveStatus({
        id: '',
        code,
        label,
        color: color || 'blue',
        description: description || '',
        isActive: isActive !== false,
        sortOrder: parseInt(sortOrder, 10) || 0
      });
      res.status(201).json({ success: true, message: 'Status created successfully' });
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE')) {
        res.status(400).json({ success: false, error: { message: 'Status code already exists' } });
        return;
      }
      next(err);
    }
  };

  public updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { code, label, color, description, isActive, sortOrder } = req.body;
      if (!code || !label) {
        res.status(400).json({ success: false, error: { message: 'Code and Label are required' } });
        return;
      }
      if (!this.repository.updateStatus) throw new Error('updateStatus not implemented');
      await this.repository.updateStatus({
        id,
        code,
        label,
        color: color || 'blue',
        description: description || '',
        isActive: isActive !== false,
        sortOrder: parseInt(sortOrder, 10) || 0
      });
      res.status(200).json({ success: true, message: 'Status updated successfully' });
    } catch (err) {
      next(err);
    }
  };

  public deleteStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (this.repository.deleteStatus) await this.repository.deleteStatus(id);
      res.status(200).json({ success: true, message: 'Status deleted successfully' });
    } catch (err) {
      next(err);
    }
  };

  // =========================================================
  // Letter Priorities
  // =========================================================
  public listPriorities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const priorities = this.repository.listPriorities ? await this.repository.listPriorities() : [];
      res.status(200).json({ success: true, data: priorities });
    } catch (err) {
      next(err);
    }
  };

  public createPriority = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, label, color, level, slaDays, description, isActive, sortOrder } = req.body;
      if (!code || !label) {
        res.status(400).json({ success: false, error: { message: 'Code and Label are required' } });
        return;
      }
      if (!this.repository.savePriority) throw new Error('savePriority not implemented');
      await this.repository.savePriority({
        id: '',
        code,
        label,
        color: color || 'blue',
        level: parseInt(level, 10) || 1,
        slaDays: parseInt(slaDays, 10) || 7,
        description: description || '',
        isActive: isActive !== false,
        sortOrder: parseInt(sortOrder, 10) || 0
      });
      res.status(201).json({ success: true, message: 'Priority created successfully' });
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE')) {
        res.status(400).json({ success: false, error: { message: 'Priority code already exists' } });
        return;
      }
      next(err);
    }
  };

  public updatePriority = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { code, label, color, level, slaDays, description, isActive, sortOrder } = req.body;
      if (!code || !label) {
        res.status(400).json({ success: false, error: { message: 'Code and Label are required' } });
        return;
      }
      if (!this.repository.updatePriority) throw new Error('updatePriority not implemented');
      await this.repository.updatePriority({
        id,
        code,
        label,
        color: color || 'blue',
        level: parseInt(level, 10) || 1,
        slaDays: parseInt(slaDays, 10) || 7,
        description: description || '',
        isActive: isActive !== false,
        sortOrder: parseInt(sortOrder, 10) || 0
      });
      res.status(200).json({ success: true, message: 'Priority updated successfully' });
    } catch (err) {
      next(err);
    }
  };

  public deletePriority = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (this.repository.deletePriority) await this.repository.deletePriority(id);
      res.status(200).json({ success: true, message: 'Priority deleted successfully' });
    } catch (err) {
      next(err);
    }
  };

  // =========================================================
  // Letter Types
  // =========================================================
  public listTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const types = this.repository.listTypes ? await this.repository.listTypes() : [];
      res.status(200).json({ success: true, data: types });
    } catch (err) {
      next(err);
    }
  };

  public createType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, label, prefix, description, isActive, sortOrder } = req.body;
      if (!code || !label || !prefix) {
        res.status(400).json({ success: false, error: { message: 'Code, Label, and Prefix are required' } });
        return;
      }
      if (!this.repository.saveType) throw new Error('saveType not implemented');
      await this.repository.saveType({
        id: '',
        code,
        label,
        prefix,
        description: description || '',
        isActive: isActive !== false,
        sortOrder: parseInt(sortOrder, 10) || 0
      });
      res.status(201).json({ success: true, message: 'Letter type created successfully' });
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE')) {
        res.status(400).json({ success: false, error: { message: 'Letter type code already exists' } });
        return;
      }
      next(err);
    }
  };

  public updateType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { code, label, prefix, description, isActive, sortOrder } = req.body;
      if (!code || !label || !prefix) {
        res.status(400).json({ success: false, error: { message: 'Code, Label, and Prefix are required' } });
        return;
      }
      if (!this.repository.updateType) throw new Error('updateType not implemented');
      await this.repository.updateType({
        id,
        code,
        label,
        prefix,
        description: description || '',
        isActive: isActive !== false,
        sortOrder: parseInt(sortOrder, 10) || 0
      });
      res.status(200).json({ success: true, message: 'Letter type updated successfully' });
    } catch (err) {
      next(err);
    }
  };

  public deleteType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (this.repository.deleteType) await this.repository.deleteType(id);
      res.status(200).json({ success: true, message: 'Letter type deleted successfully' });
    } catch (err) {
      next(err);
    }
  };

  // =========================================================
  // User Roles
  // =========================================================
  public listRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = this.repository.listRoles ? await this.repository.listRoles() : [];
      res.status(200).json({ success: true, data: roles });
    } catch (err) {
      next(err);
    }
  };

  public createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, name, description, color } = req.body;
      if (!code || !name) {
        res.status(400).json({ success: false, error: { message: 'Code and Name are required' } });
        return;
      }
      if (!this.repository.saveRole) throw new Error('saveRole not implemented');
      await this.repository.saveRole({
        id: '',
        code,
        name,
        description: description || '',
        color: color || 'blue',
        isSystem: false
      });
      res.status(201).json({ success: true, message: 'Role created successfully' });
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE')) {
        res.status(400).json({ success: false, error: { message: 'Role code already exists' } });
        return;
      }
      next(err);
    }
  };

  public updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { code, name, description, color } = req.body;
      if (!code || !name) {
        res.status(400).json({ success: false, error: { message: 'Code and Name are required' } });
        return;
      }
      if (!this.repository.updateRole) throw new Error('updateRole not implemented');
      await this.repository.updateRole({
        id,
        code,
        name,
        description: description || '',
        color: color || 'blue',
        isSystem: false
      });
      res.status(200).json({ success: true, message: 'Role updated successfully' });
    } catch (err) {
      next(err);
    }
  };

  public deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (this.repository.deleteRole) {
        await this.repository.deleteRole(id);
      }
      res.status(200).json({ success: true, message: 'Role deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Could not delete role' } });
    }
  };
}
