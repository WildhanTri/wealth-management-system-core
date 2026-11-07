import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export interface AppStatAttributes extends BaseAuditAttributes {
  user_id?: string | null;
  name: string;
  description?: string | null;
  value: number;
}

export class AppStat extends Model<AppStatAttributes> implements AppStatAttributes {
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare description: string | null;
  declare value: number;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

AppStat.init(
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
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    value: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('value');
        return val ? parseFloat(val as any) : 0;
      },
    },
  },
  {
    sequelize,
    tableName: 'app_stats',
    modelName: 'AppStat',
    indexes: [
      { fields: ['user_id', 'name'] },
      { fields: ['is_deleted'] },
    ],
  }
);

