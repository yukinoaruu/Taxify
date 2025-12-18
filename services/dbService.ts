import { Income, UserProfile, Alert, FopGroup, TaxRate } from "../types";

const KEYS = {
  PROFILE: 'taxify_profile',
  INCOMES: 'taxify_incomes',
  ALERTS: 'taxify_alerts'
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Entrepreneur',
  group: FopGroup.GROUP_3,
  taxRate: TaxRate.PERCENT_5,
  hasEmployees: false,
  isOnboarded: false,
};

export const dbService = {
  getProfile: (): UserProfile => {
    const data = localStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : DEFAULT_PROFILE;
  },

  saveProfile: (profile: UserProfile): void => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  getIncomes: (): Income[] => {
    const data = localStorage.getItem(KEYS.INCOMES);
    return data ? JSON.parse(data) : [];
  },

  addIncome: (income: Income): void => {
    const incomes = dbService.getIncomes();
    incomes.unshift(income); // Add to top
    localStorage.setItem(KEYS.INCOMES, JSON.stringify(incomes));
  },

  deleteIncome: (id: string): void => {
    const incomes = dbService.getIncomes().filter(i => i.id !== id);
    localStorage.setItem(KEYS.INCOMES, JSON.stringify(incomes));
  },

  getAlerts: (): Alert[] => {
    const data = localStorage.getItem(KEYS.ALERTS);
    return data ? JSON.parse(data) : [];
  }
};