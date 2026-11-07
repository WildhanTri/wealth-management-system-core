import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export type UrgencyLevel = 'wants' | 'productive' | 'emergency';
export type QuarantineStatus = 'quarantined' | 'purchased' | 'prevented';

export interface QuarantineItemAttributes extends BaseAuditAttributes {
  user_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  quarantine_until: Date;
  work_hours_cost: number;
  daily_s2s_impact: number;
  urgency: UrgencyLevel;
  status: QuarantineStatus;
}

export class QuarantineItem extends Model<QuarantineItemAttributes> implements QuarantineItemAttributes {
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare description: string | null;
  declare price: number;
  declare category: string;
  declare quarantine_until: Date;
  declare work_hours_cost: number;
  declare daily_s2s_impact: number;
  declare urgency: UrgencyLevel;
  declare status: QuarantineStatus;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

QuarantineItem.init(
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
    price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('price');
        return val ? parseFloat(val as any) : 0;
      },
    },
    category: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    quarantine_until: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    work_hours_cost: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    daily_s2s_impact: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    urgency: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'wants',
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'quarantined',
    },
  },
  {
    sequelize,
    tableName: 'quarantine_items',
    modelName: 'QuarantineItem',
    indexes: [
      { fields: ['status'] },
      { fields: ['quarantine_until'] },
      { fields: ['is_deleted'] },
    ],
  }
);

