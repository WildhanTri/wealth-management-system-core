import { Asset } from '../models/Asset.js';
import { Transaction } from '../models/Transaction.js';
import { UserProfile } from '../models/UserProfile.js';

export interface FinancialHealthMetrics {
  healthScore: number;
  healthGrade: string;
  dailySafeToSpend: number;
  totalLiquidCash: number;
  totalHardAssets: number;
  totalInvestments: number;
  totalNetWorth: number;
  runwayMonths: number;
  dtiPercent: number;
  hourlyWage: number;
  monthlyDiscretionaryPool: number;
  totalSpentThisMonth: number;
  totalImpulseSpent: number;
  impulseRatioPercent: number;
  healthPillars: {
    liquidityBuffer: { score: number; label: string };
    discretionaryCushion: { score: number; label: string };
    debtSafety: { score: number; label: string };
    purityRate: { score: number; label: string };
  };
}

export function computeFinancialHealth(
  profile: UserProfile | null,
  assets: Asset[],
  transactions: Transaction[]
): FinancialHealthMetrics {
  const income = profile ? Number(profile.monthly_income) : 0;
  const installments = profile ? Number(profile.monthly_installments) : 0;

  // 1. Asset aggregation
  let totalLiquidCash = 0;
  let totalHardAssets = 0;
  let totalInvestments = 0;

  for (const a of assets) {
    const val = Number(a.estimated_value) || 0;
    if (a.asset_class === 'cash_equivalent') {
      totalLiquidCash += val;
    } else if (
      a.asset_class === 'hard_asset_movable' ||
      a.asset_class === 'hard_asset_immovable'
    ) {
      totalHardAssets += val;
    } else if (a.asset_class === 'investment') {
      totalInvestments += val;
    }
  }

  const totalNetWorth = totalLiquidCash + totalHardAssets + totalInvestments;

  // 2. Transaction aggregation (current calendar month)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let totalSpentThisMonth = 0;
  let totalImpulseSpent = 0;
  let totalIncomeThisMonth = 0;

  for (const t of transactions) {
    if (t.date && t.date.startsWith(currentMonthStr)) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncomeThisMonth += amt;
      } else {
        totalSpentThisMonth += amt;
        if (t.is_impulse) {
          totalImpulseSpent += amt;
        }
      }
    }
  }

  const impulseRatioPercent =
    totalSpentThisMonth > 0 ? Math.round((totalImpulseSpent / totalSpentThisMonth) * 100) : 0;

  // 3. Life Energy Hourly Rate (standard 160 hrs/month)
  const hourlyWage = income > 0 ? Math.round(income / 160) : 0;

  // 4. Safe-to-Spend (S2S) Calculation
  // Pool = Income - Debt Installments - 20% Target Savings - Running Outflow
  const targetSavings = income * 0.2;
  const totalAllocated = installments + targetSavings + totalSpentThisMonth;
  const remainingDiscretionaryPool = Math.max(0, income + totalIncomeThisMonth - totalAllocated);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);
  const dailySafeToSpend = Math.round(remainingDiscretionaryPool / daysRemaining);

  // 5. Runway in Months
  const monthlyBaselineBurn = Math.max(1, installments + totalSpentThisMonth);
  const runwayMonths = Math.round((totalLiquidCash / monthlyBaselineBurn) * 10) / 10;

  // 6. DTI Percent
  const dtiPercent = income > 0 ? Math.round((installments / income) * 1000) / 10 : 0;

  // 7. Four Pillar Scoring
  // Pillar 1: Liquidity Buffer (runway >= 6 months is 100%)
  const p1Score = Math.min(100, Math.round((runwayMonths / 6) * 100));

  // Pillar 2: Discretionary Cushion (S2S > 0)
  const idealDaily = Math.max(1, (income * 0.3) / daysInMonth);
  const p2Score = Math.min(100, Math.round((dailySafeToSpend / idealDaily) * 100));

  // Pillar 3: Debt Safety Margin (DTI <= 30% is 100%)
  const p3Score = dtiPercent <= 30 ? 100 : Math.max(0, Math.round(100 - (dtiPercent - 30) * 2.5));

  // Pillar 4: Purity Rate (100% - impulse ratio)
  const p4Score = Math.max(0, 100 - impulseRatioPercent);

  // Weighted overall Health Score
  const healthScore = Math.round(
    p1Score * 0.35 + p2Score * 0.25 + p3Score * 0.2 + p4Score * 0.2
  );

  let healthGrade = 'Prime Health';
  if (healthScore < 50) {
    healthGrade = 'Critical (Halt Discretionary Spending)';
  } else if (healthScore < 75) {
    healthGrade = 'Caution (Tight Safe Buffer)';
  }

  return {
    healthScore,
    healthGrade,
    dailySafeToSpend,
    totalLiquidCash,
    totalHardAssets,
    totalInvestments,
    totalNetWorth,
    runwayMonths,
    dtiPercent,
    hourlyWage,
    monthlyDiscretionaryPool: remainingDiscretionaryPool,
    totalSpentThisMonth,
    totalImpulseSpent,
    impulseRatioPercent,
    healthPillars: {
      liquidityBuffer: {
        score: p1Score,
        label: p1Score >= 80 ? 'Robust' : p1Score >= 50 ? 'Moderate' : 'Underfunded',
      },
      discretionaryCushion: {
        score: p2Score,
        label: p2Score >= 80 ? 'Healthy' : p2Score >= 50 ? 'Tight' : 'Depleted',
      },
      debtSafety: {
        score: p3Score,
        label: p3Score >= 80 ? 'Safe' : p3Score >= 50 ? 'Manageable' : 'Overleveraged',
      },
      purityRate: {
        score: p4Score,
        label: p4Score >= 80 ? 'Disciplined' : p4Score >= 50 ? 'Moderate' : 'High Impulse',
      },
    },
  };
}

