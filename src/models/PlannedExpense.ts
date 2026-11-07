import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export type PlanPriority = 'high' | 'medium' | 'low';
export type PlanStatus = 'active' | 'completed' | 'cancelled';

export interface PlannedExpenseAttributes extends BaseAuditAttributes {
  user_id?: string | null;
  name: string;
  description?: string | null;
  target_amount: number;
  current_amount: number;
  category: string;
  target_date: string;
  priority: PlanPriority;
  status: PlanStatus;
  notes?: string | null;
}

export class PlannedExpense extends Model<PlannedExpenseAttributes> implements PlannedExpenseAttributes {
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare description: string | null;
  declare target_amount: number;
  declare current_amount: number;
  declare category: string;
  declare target_date: string;
  declare priority: PlanPriority;
  declare status: PlanStatus;
  declare notes: string | null;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

PlannedExpense.init(
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
    target_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('target_amount');
        return val ? parseFloat(val as any) : 0;
      },
    },
    current_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('current_amount');
        return val ? parseFloat(val as any) : 0;
      },
    },
    category: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    target_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    priority: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'active',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'planned_expenses',
    modelName: 'PlannedExpense',
    indexes: [
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['target_date'] },
      { fields: ['is_deleted'] },
    ],
  }
);

