import { DataTypes, ModelAttributes } from 'sequelize';

export interface BaseAuditAttributes {
  id: string;
  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
  is_active: boolean;
  is_deleted: boolean;
}

/**
 * Standard table columns required by architecture:
 * - id (UUID)
 * - created_at (TIMESTAMP)
 * - created_by (VARCHAR)
 * - updated_at (TIMESTAMP)
 * - updated_by (VARCHAR)
 * - is_active (BOOLEAN)
 * - is_deleted (BOOLEAN)
 */
export const baseModelAttributes = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  created_by: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'system',
  },
  updated_by: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'system',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
};
