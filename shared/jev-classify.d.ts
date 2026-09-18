export const JEV_MODEL: string;
export const JEV_ENDPOINT: string;
export const JEV_NOTIFY_MIN_P_ALERT: number;
export const THREAT_LEVELS: readonly string[];
export const THREAT_CATEGORIES: readonly string[];
export const LEVEL_CRITERIA: Record<string, string>;
export const CATEGORY_CRITERIA: Record<string, string>;
export interface JevLabel { i: number; l: string; c: string; levelConf: number; pAlert: number }
export function jevGateAllowsAlert(label: { src?: unknown; pAlert?: unknown }): boolean;
export function hasNonLatinLetters(title: string): boolean;
export function sanitizeHeadline(title: string, maxTextChars?: number): string;
export function buildJevRequest(titles: string[], opts?: { maxTextChars?: number; model?: string }): { model: string; state: unknown; questions: Record<string, unknown> };
export function parseJevAnswers(body: unknown, count: number): JevLabel[];
