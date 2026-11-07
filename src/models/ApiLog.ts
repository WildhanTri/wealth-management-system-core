import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { baseModelAttributes, BaseAuditAttributes } from './BaseModel.js';

export interface ApiLogAttributes extends BaseAuditAttributes {
  name: string;
  description?: string | null;
  method: string;
  endpoint: string;
  status_code: number;
  request_headers: Record<string, any>;
  request_query: Record<string, any>;
  request_params: Record<string, any>;
  request_body: any;
  response_headers: Record<string, any>;
  response_body: any;
  duration_ms: number;
  ip_address?: string | null;
  user_agent?: string | null;
  error_message?: string | null;
}

export class ApiLog extends Model<ApiLogAttributes> implements ApiLogAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare method: string;
  declare endpoint: string;
  declare status_code: number;
  declare request_headers: Record<string, any>;
  declare request_query: Record<string, any>;
  declare request_params: Record<string, any>;
  declare request_body: any;
  declare response_headers: Record<string, any>;
  declare response_body: any;
  declare duration_ms: number;
  declare ip_address: string | null;
  declare user_agent: string | null;
  declare error_message: string | null;

  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare is_active: boolean;
  declare is_deleted: boolean;
}

ApiLog.init(
  {
    ...baseModelAttributes,
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'API Request',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    method: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status_code: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    request_headers: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    request_query: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    request_params: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    request_body: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    response_headers: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    response_body: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    duration_ms: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    ip_address: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'api_logs',
    modelName: 'ApiLog',
    indexes: [
      { fields: ['method'] },
      { fields: ['status_code'] },
      { fields: ['created_at'] },
      { fields: ['is_deleted'] },
    ],
  }
);

