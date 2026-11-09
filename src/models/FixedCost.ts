import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export type FixedCostCategory =
  | 'utilities'
  | 'subscriptions'
  | 'housing'
  | 'insurance'
  | 'memberships'
  | 'debt_installments'
  | 'telecom'
  | 'other';

export interface FixedCostAttributes extends BaseAuditAttributes {
  user_id?: string | null;
  name: string;
  category: FixedCostCategory;
  amount: number;
  due_day: number;
  notes?: string | null;
  display_order?: number | null;
  start_month?: string | null;
  end_month?: string | null;
}

export class FixedCost extends Model<FixedCostAttributes> implements FixedCostAttributes {
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare category: FixedCostCategory;
  declare amount: number;
  declare due_day: number;
  declare notes: string | null;
  declare display_order: number | null;
  declare start_month: string | null;
  declare end_month: string | null;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

FixedCost.init(
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
      defaultValue: 'utilities',
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    due_day: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    start_month: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
    end_month: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'fixed_costs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['category'] },
      { fields: ['display_order'] },
      { fields: ['is_deleted'] },
    ],
  }
);

