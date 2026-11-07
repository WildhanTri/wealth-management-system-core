import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export interface UserProfileAttributes extends BaseAuditAttributes {
  user_id?: string | null;
  name: string;
  description?: string | null;
  industry?: string | null;
  job_role?: string | null;
  age: number;
  monthly_income: number;
  is_married: boolean;
  has_dependents: boolean;
  dependents_count: number;
  monthly_installments: number;
  joined_at?: Date;
  is_onboarded: boolean;
}

export class UserProfile extends Model<UserProfileAttributes> implements UserProfileAttributes {
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare description: string | null;
  declare industry: string | null;
  declare job_role: string | null;
  declare age: number;
  declare monthly_income: number;
  declare is_married: boolean;
  declare has_dependents: boolean;
  declare dependents_count: number;
  declare monthly_installments: number;
  declare joined_at: Date;
  declare is_onboarded: boolean;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

UserProfile.init(
  {
    ...baseModelAttributes,
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    industry: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    job_role: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 25,
    },
    monthly_income: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('monthly_income');
        return val ? parseFloat(val as any) : 0;
      },
    },
    is_married: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    has_dependents: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dependents_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    monthly_installments: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('monthly_installments');
        return val ? parseFloat(val as any) : 0;
      },
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    is_onboarded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'user_profiles',
    modelName: 'UserProfile',
  }
);

