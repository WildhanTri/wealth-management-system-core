import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export type EmotionalTrigger =
  | 'Boredom'
  | 'StressReward'
  | 'FOMO'
  | 'FlashSale'
  | 'Need';

export type TransactionType = 'income' | 'expense';

export interface TransactionAttributes extends BaseAuditAttributes {
  user_id?: string | null;
  name: string;
  description?: string | null;
  type?: TransactionType;
  amount: number;
  category: string;
  date: string;
  emotional_trigger: EmotionalTrigger;
  is_impulse: boolean;
}

export class Transaction extends Model<TransactionAttributes> implements TransactionAttributes {
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare description: string | null;
  declare type: TransactionType;
  declare amount: number;
  declare category: string;
  declare date: string;
  declare emotional_trigger: EmotionalTrigger;
  declare is_impulse: boolean;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

Transaction.init(
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
    type: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'expense',
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('amount');
        return val ? parseFloat(val as any) : 0;
      },
    },
    category: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    emotional_trigger: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'Need',
    },
    is_impulse: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'transactions',
    modelName: 'Transaction',
    indexes: [
      { fields: ['date'] },
      { fields: ['type'] },
      { fields: ['category'] },
      { fields: ['emotional_trigger'] },
      { fields: ['is_impulse'] },
      { fields: ['is_deleted'] },
    ],
  }
);

