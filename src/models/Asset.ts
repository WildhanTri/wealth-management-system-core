import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export type AssetClass =
  | 'cash_equivalent'
  | 'hard_asset_movable'
  | 'hard_asset_immovable'
  | 'investment';

export type LiquidityTier = 'instant_liquid' | 'marketable_semi_liquid' | 'illiquid';
export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high';

export interface AssetAttributes extends BaseAuditAttributes {
  user_id?: string | null;
  name: string;
  description?: string | null;
  asset_class: AssetClass;
  type: string;
  estimated_value: number;
  liquidity_tier: LiquidityTier;
  risk_level: RiskLevel;
  appreciation_type?: 'appreciating' | 'depreciating' | null;
  display_order?: number | null;
}

export class Asset extends Model<AssetAttributes> implements AssetAttributes {
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare description: string | null;
  declare asset_class: AssetClass;
  declare type: string;
  declare estimated_value: number;
  declare liquidity_tier: LiquidityTier;
  declare risk_level: RiskLevel;
  declare appreciation_type: 'appreciating' | 'depreciating' | null;
  declare display_order: number | null;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

Asset.init(
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
    asset_class: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    estimated_value: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('estimated_value');
        return val ? parseFloat(val as any) : 0;
      },
    },
    liquidity_tier: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'instant_liquid',
    },
    risk_level: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'low',
    },
    appreciation_type: {
      type: DataTypes.STRING(32),
      allowNull: true,
      defaultValue: null,
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'assets',
    modelName: 'Asset',
    indexes: [
      { fields: ['asset_class'] },
      { fields: ['liquidity_tier'] },
      { fields: ['display_order'] },
      { fields: ['is_deleted'] },
    ],
  }
);

