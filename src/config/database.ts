import { Sequelize } from 'sequelize';
import { Client } from 'pg';
import { env } from './env.js';

/**
 * Ensures the target PostgreSQL database exists before initializing Sequelize.
 */
export async function ensureDatabaseExists(): Promise<void> {
  const defaultClient = new Client({
    host: env.database.host,
    port: env.database.port,
    user: env.database.user,
    password: env.database.password,
    database: 'postgres',
  });

  try {
    await defaultClient.connect();
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const res = await defaultClient.query(checkDbQuery, [env.database.name]);

    if (res.rowCount === 0) {
      console.log(` Database '${env.database.name}' not found. Creating...`);
      // Database names cannot be parameterized in CREATE DATABASE
      await defaultClient.query(`CREATE DATABASE "${env.database.name}"`);
      console.log(` Database '${env.database.name}' created successfully.`);
    } else {
      console.log(` Database '${env.database.name}' is ready.`);
    }
  } catch (error) {
    console.error(` Failed to verify or create database '${env.database.name}':`, error);
    throw error;
  } finally {
    await defaultClient.end();
  }
}

/**
 * Sequelize connection instance for Crescent Wealth Management System.
 */
export const sequelize = new Sequelize(
  env.database.name,
  env.database.user,
  env.database.password,
  {
    host: env.database.host,
    port: env.database.port,
    dialect: 'postgres',
    logging: env.database.logging ? (msg: string) => console.log(`[Sequelize] ${msg}`) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

