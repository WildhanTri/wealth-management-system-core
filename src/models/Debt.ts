import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export type DebtCategory =
  | 'credit_card'
  | 'personal_loan'
  | 'mortgage'
  | 'vehicle_loan'
  | 'peer_loan'
  | 'paylater'
  | 'other';

export type DebtStatus = 'active' | 'paid_off' | 'paused';

export interface DebtAttributes extends BaseAuditAttributes {
  user_id?: string | null;
  name: string;
  category: DebtCategory;
  lender?: string | null;
  total_amount: number;
  remaining_amount: number;
  monthly_payment?: number | null;
  interest_rate?: number | null;
  deadline_date: string; // 'YYYY-MM-DD'
  status: DebtStatus;
  notes?: string | null;
  display_order?: number | null;
}

export class Debt extends Model<DebtAttributes> implements DebtAttributes {
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare category: DebtCategory;
  declare lender: string | null;
  declare total_amount: number;
  declare remaining_amount: number;
  declare monthly_payment: number | null;
  declare interest_rate: number | null;
  declare deadline_date: string;
  declare status: DebtStatus;
  declare notes: string | null;
  declare display_order: number | null;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

Debt.init(
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
      defaultValue: 'other',
    },
    lender: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    remaining_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    monthly_payment: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
    },
    interest_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
    },
    deadline_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
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
    tableName: 'debts',
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

