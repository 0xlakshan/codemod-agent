export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
}

export interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: Date;
}
