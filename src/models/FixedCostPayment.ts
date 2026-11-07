import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export interface FixedCostPaymentAttributes extends BaseAuditAttributes {
  fixed_cost_id: string;
  user_id?: string | null;
  month_year: string; // e.g. "2026-11"
  is_paid: boolean;
  paid_amount: number;
  paid_at?: Date | null;
  notes?: string | null;
}

export class FixedCostPayment extends Model<FixedCostPaymentAttributes> implements FixedCostPaymentAttributes {
  declare id: string;
  declare fixed_cost_id: string;
  declare user_id: string | null;
  declare month_year: string;
  declare is_paid: boolean;
  declare paid_amount: number;
  declare paid_at: Date | null;
  declare notes: string | null;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

FixedCostPayment.init(
  {
    ...baseModelAttributes,
    fixed_cost_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fixed_costs',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    month_year: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    paid_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'fixed_cost_payments',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['fixed_cost_id', 'month_year'],
        where: {
          is_deleted: false,
        },
      },
    ],
  }
);

