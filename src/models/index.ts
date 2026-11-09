import { sequelize } from '../config/database.js';
import { ApiLog } from './ApiLog.js';
import { User } from './User.js';
import { UserProfile } from './UserProfile.js';
import { Asset } from './Asset.js';
import { Transaction } from './Transaction.js';
import { PlannedExpense } from './PlannedExpense.js';
import { QuarantineItem } from './QuarantineItem.js';
import { AssetSnapshot } from './AssetSnapshot.js';
import { AppStat } from './AppStat.js';
import { RevenueStream } from './RevenueStream.js';
import { FixedCost } from './FixedCost.js';
import { FixedCostPayment } from './FixedCostPayment.js';
import { FinancialTarget } from './FinancialTarget.js';
import { Debt } from './Debt.js';

// Entity Relationships
User.hasOne(UserProfile, { foreignKey: 'user_id', as: 'profile' });
UserProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Asset, { foreignKey: 'user_id', as: 'assets' });
Asset.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(PlannedExpense, { foreignKey: 'user_id', as: 'plannedExpenses' });
PlannedExpense.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(QuarantineItem, { foreignKey: 'user_id', as: 'quarantineItems' });
QuarantineItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AssetSnapshot, { foreignKey: 'user_id', as: 'snapshots' });
AssetSnapshot.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AppStat, { foreignKey: 'user_id', as: 'stats' });
AppStat.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Financial Planning Relationships
User.hasMany(RevenueStream, { foreignKey: 'user_id', as: 'revenueStreams' });
RevenueStream.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(FixedCost, { foreignKey: 'user_id', as: 'fixedCosts' });
FixedCost.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

FixedCost.hasMany(FixedCostPayment, { foreignKey: 'fixed_cost_id', as: 'payments' });
FixedCostPayment.belongsTo(FixedCost, { foreignKey: 'fixed_cost_id', as: 'fixedCost' });

User.hasMany(FixedCostPayment, { foreignKey: 'user_id', as: 'fixedCostPayments' });
FixedCostPayment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(FinancialTarget, { foreignKey: 'user_id', as: 'financialTargets' });
FinancialTarget.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Debt, { foreignKey: 'user_id', as: 'debts' });
Debt.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  sequelize,
  ApiLog,
  User,
  UserProfile,
  Asset,
  Transaction,
  PlannedExpense,
  QuarantineItem,
  AssetSnapshot,
  AppStat,
  RevenueStream,
  FixedCost,
  FixedCostPayment,
  FinancialTarget,
  Debt,
};

/**
 * Syncs all Sequelize models with the PostgreSQL database.
 */
export async function syncDatabase(alter = false): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log(' PostgreSQL Database connection established successfully.');

    // In production we usually use migrations, but for dev and initialization alter: true will sync tables
    await sequelize.sync({ alter });
    console.log(' All PostgreSQL database tables synchronized successfully.');
  } catch (error) {
    console.error(' Unable to connect to or sync database:', error);
    throw error;
  }
}

