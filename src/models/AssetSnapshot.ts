import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export interface AssetSnapshotAttributes extends BaseAuditAttributes {
  user_id?: string | null;
  name: string;
  description?: string | null;
  snapshot_date: string;
  total_net_worth: number;
  total_cash: number;
  total_hard: number;
  total_investment: number;
  notes?: string | null;
  items_snapshot: any[];
}

export class AssetSnapshot extends Model<AssetSnapshotAttributes> implements AssetSnapshotAttributes {
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare description: string | null;
  declare snapshot_date: string;
  declare total_net_worth: number;
  declare total_cash: number;
  declare total_hard: number;
  declare total_investment: number;
  declare notes: string | null;
  declare items_snapshot: any[];

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

AssetSnapshot.init(
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
      defaultValue: 'Net Worth Valuation',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    snapshot_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    total_net_worth: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('total_net_worth');
        return val ? parseFloat(val as any) : 0;
      },
    },
    total_cash: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('total_cash');
        return val ? parseFloat(val as any) : 0;
      },
    },
    total_hard: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('total_hard');
        return val ? parseFloat(val as any) : 0;
      },
    },
    total_investment: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('total_investment');
        return val ? parseFloat(val as any) : 0;
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    items_snapshot: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'asset_snapshots',
    modelName: 'AssetSnapshot',
    indexes: [
      { fields: ['snapshot_date'] },
      { fields: ['is_deleted'] },
    ],
  }
);

