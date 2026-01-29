export interface MonthlyStats {
  month: string;
  consultations: number;
  contracts: number;
  installations: number;
  conversion_rate: number;
}

export interface RegionStats {
  region: string;
  consultations: number;
  contracts: number;
  handlers: number;
}

export interface HandlerStats {
  handler_id: string;
  handler_name: string;
  consultations: number;
  contracts: number;
  conversion_rate: number;
  level: number;
}
