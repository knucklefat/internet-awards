/**
 * API Request/Response Types for The Internet Awards
 */

import { Nomination, EventDay, DayStats, EventStats } from './event';

// ===== NOMINATION API =====

export interface SubmitNominationRequest {
  postUrl: string;
  dayId: string;
  category: string;
  reason?: string;
}

export interface SubmitNominationResponse {
  success: boolean;
  data?: Nomination;
  error?: string;
}

export interface GetNominationsRequest {
  dayId?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface GetNominationsResponse {
  success: boolean;
  data?: Nomination[];
  total?: number;
  error?: string;
}

export interface PreviewPostRequest {
  url: string;
}

export interface PreviewPostResponse {
  success: boolean;
  data?: {
    title: string;
    thumbnail?: string;
    permalink?: string;
  };
  error?: string;
}

// ===== EVENT MANAGEMENT API =====

export interface GetEventConfigResponse {
  success: boolean;
  data?: {
    eventName: string;
    eventDescription: string;
    startDate: string;
    endDate: string;
    days: EventDay[];
  };
  error?: string;
}

export interface UpdateDayStatusRequest {
  dayId: string;
  active: boolean;
}

export interface UpdateDayStatusResponse {
  success: boolean;
  data?: EventDay;
  error?: string;
}

// ===== STATS & ANALYTICS API =====

export interface GetDayStatsRequest {
  dayId: string;
}

export interface GetDayStatsResponse {
  success: boolean;
  data?: DayStats;
  error?: string;
}

export interface GetEventStatsResponse {
  success: boolean;
  data?: EventStats;
  error?: string;
}

// ===== EXPORT API =====

export interface ExportNominationsRequest {
  dayId?: string;
  category?: string;
  format?: 'csv' | 'json';
}

export interface ExportNominationsResponse {
  success: boolean;
  data?: string; // CSV or JSON string
  filename?: string;
  error?: string;
}

// ===== DELETE/ADMIN API =====

export interface DeleteNominationsRequest {
  dayId?: string;
  category?: string;
  confirmationKey: string;
}

export interface DeleteNominationsResponse {
  success: boolean;
  deletedCount?: number;
  error?: string;
}
