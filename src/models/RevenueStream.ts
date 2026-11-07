import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export type RevenueCategory = 'main_job' | 'side_hustle' | 'passive_income' | 'other';
export type RevenueFrequency = 'monthly' | 'weekly' | 'biweekly' | 'irregular';

export interface RevenueStreamAttributes extends BaseAuditAttributes {
  user_id?: string | null;
  name: string;
  category: RevenueCategory;
  amount: number;
  frequency: RevenueFrequency;
  status: 'active' | 'inactive';
  notes?: string | null;
  display_order?: number | null;
}

export class RevenueStream extends Model<RevenueStreamAttributes> implements RevenueStreamAttributes {
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare category: RevenueCategory;
  declare amount: number;
  declare frequency: RevenueFrequency;
  declare status: 'active' | 'inactive';
  declare notes: string | null;
  declare display_order: number | null;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

RevenueStream.init(
  {
    ...baseModelAttributes,
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'main_job',
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    frequency: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'monthly',
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'active',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'revenue_streams',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['display_order'] },
      { fields: ['is_deleted'] },
    ],
  }
);

