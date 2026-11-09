import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export type TargetType = 'needs' | 'wants';
export type TargetTimeframe = 'short_term' | 'long_term';

export type TargetCategory =
  // Kebutuhan (Needs) - Jangka Pendek
  | 'vehicle_maintenance'
  | 'home_maintenance'
  | 'medical_health'
  | 'tax_bill'
  | 'other_needs_short'
  // Kebutuhan (Needs) - Jangka Panjang
  | 'property'
  | 'emergency_fund'
  | 'education'
  | 'retirement'
  | 'other_needs_long'
  // Keinginan (Wants) - Jangka Pendek
  | 'gadget'
  | 'shopping'
  | 'entertainment'
  | 'hobby'
  | 'other_wants_short'
  // Keinginan (Wants) - Jangka Panjang
  | 'travel'
  | 'vehicle'
  | 'wedding'
  | 'investment'
  | 'other_wants_long'
  // Legacy / fallback
  | 'other';

export type TargetPriority = 'high' | 'medium' | 'low';
export type TargetStatus = 'in_progress' | 'completed' | 'paused';

export interface FinancialTargetAttributes extends BaseAuditAttributes {
  user_id?: string | null;
  name: string;
  target_type: TargetType;
  timeframe: TargetTimeframe;
  category: TargetCategory | string;
  target_amount: number;
  current_amount: number;
  deadline_date: string; // 'YYYY-MM-DD'
  priority: TargetPriority;
  status: TargetStatus;
  notes?: string | null;
  display_order?: number | null;
}

export class FinancialTarget extends Model<FinancialTargetAttributes> implements FinancialTargetAttributes {
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare target_type: TargetType;
  declare timeframe: TargetTimeframe;
  declare category: TargetCategory | string;
  declare target_amount: number;
  declare current_amount: number;
  declare deadline_date: string;
  declare priority: TargetPriority;
  declare status: TargetStatus;
  declare notes: string | null;
  declare display_order: number | null;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

FinancialTarget.init(
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
    target_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'needs',
    },
    timeframe: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'short_term',
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'other_needs_short',
    },
    target_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    current_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    deadline_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'in_progress',
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
    tableName: 'financial_targets',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['target_type'] },
      { fields: ['timeframe'] },
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['display_order'] },
      { fields: ['is_deleted'] },
    ],
  }
);

