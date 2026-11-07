import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export interface UserAttributes extends BaseAuditAttributes {
  fullname: string;
  email: string;
  password: string;
  reset_password_token?: string | null;
  reset_password_expires?: Date | null;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  declare id: string;
  declare fullname: string;
  declare email: string;
  declare password: string;
  declare reset_password_token: string | null;
  declare reset_password_expires: Date | null;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;

  /**
   * Return safe user representation excluding password and reset tokens
   */
  toSafeJSON() {
    return {
      id: this.id,
      fullname: this.fullname,
      email: this.email,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
      isActive: this.is_active,
    };
  }
}

User.init(
  {
    ...baseModelAttributes,
    fullname: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    reset_password_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
    ],
  }
);

