import { RollItem, RollUsageLog } from '../types';

export const INITIAL_ROLLS: RollItem[] = [];

export const INITIAL_USAGE_LOGS: RollUsageLog[] = [];

const ROLLS_STORAGE_KEY = 'erp_rolls_inventory_matrix_v2';
const USAGE_STORAGE_KEY = 'erp_rolls_usage_history_v2';

export function getStoredRolls(): RollItem[] {
  if (typeof window === 'undefined') return INITIAL_ROLLS;
  try {
    const raw = localStorage.getItem(ROLLS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ROLLS_STORAGE_KEY, JSON.stringify(INITIAL_ROLLS));
      return INITIAL_ROLLS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ROLLS;
  } catch {
    return INITIAL_ROLLS;
  }
}

export function saveStoredRolls(rolls: RollItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROLLS_STORAGE_KEY, JSON.stringify(rolls));
  } catch (e) {
    console.error('Failed to save rolls', e);
  }
}

export function getStoredUsageLogs(): RollUsageLog[] {
  if (typeof window === 'undefined') return INITIAL_USAGE_LOGS;
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(INITIAL_USAGE_LOGS));
      return INITIAL_USAGE_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_USAGE_LOGS;
  } catch {
    return INITIAL_USAGE_LOGS;
  }
}

export function saveStoredUsageLogs(logs: RollUsageLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save usage logs', e);
  }
}
