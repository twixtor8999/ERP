/**
 * Common API response contracts for system diagnostics and telemetry.
 */

export interface HealthResponse {
  status: string;
  version: string;
  service: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
}

export interface DatabaseHealthResponse {
  status: string;
  database: string;
  engine: string;
  responseTimeMs: number;
  timestamp: string;
}
