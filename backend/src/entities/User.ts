export type UserRole = 'admin' | 'user';

export interface UserProps {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class User {
  private readonly _id: string;
  private _username: string;
  private _passwordHash: string;
  private _role: UserRole;
  private _avatar?: string;
  private readonly _createdAt: string;
  private _updatedAt: string;

  constructor(props: UserProps) {
    if (!props.id) throw new Error('User ID is required');
    if (!props.username) throw new Error('Username is required');
    if (!props.passwordHash) throw new Error('Password hash is required');

    this._id = props.id;
    this._username = props.username.trim().toLowerCase();
    this._passwordHash = props.passwordHash;
    this._role = props.role || 'user';
    this._avatar = props.avatar;
    this._createdAt = props.createdAt || new Date().toISOString();
    this._updatedAt = props.updatedAt || this._createdAt;
  }

  public get id(): string { return this._id; }
  public get username(): string { return this._username; }
  public get passwordHash(): string { return this._passwordHash; }
  public get role(): UserRole { return this._role; }
  public get avatar(): string | undefined { return this._avatar; }
  public get createdAt(): string { return this._createdAt; }
  public get updatedAt(): string { return this._updatedAt; }

  public updateUsername(newUsername: string): void {
    if (!newUsername || !newUsername.trim()) throw new Error('Username cannot be empty');
    this._username = newUsername.trim().toLowerCase();
    this._updatedAt = new Date().toISOString();
  }

  public updatePasswordHash(newHash: string): void {
    if (!newHash) throw new Error('Password hash cannot be empty');
    this._passwordHash = newHash;
    this._updatedAt = new Date().toISOString();
  }

  public updateRole(newRole: UserRole): void {
    this._role = newRole;
    this._updatedAt = new Date().toISOString();
  }

  public updateAvatar(newAvatar?: string): void {
    this._avatar = newAvatar;
    this._updatedAt = new Date().toISOString();
  }

  public toJSON(): { id: string; username: string; role: UserRole; avatar?: string; createdAt: string; updatedAt: string } {
    return {
      id: this._id,
      username: this._username,
      role: this._role,
      avatar: this._avatar,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
