interface ConfigResponse {
  [key:string]: any;
  eventLoggingDisabled?: boolean;
  exceptionReportDisabled?: boolean;
  
  appenders: AppenderResponse[];
  loggers: LoggerResponse[];
  root?: RootResponse;
}

interface AppenderResponse {
  type: string;
  name: string;
  config?: any;
  
}

interface LoggerResponse {
  name?: string;
  severity: string
  callStackSeverity?: string
  appenderRef: string
}

interface RootResponse{
  severity: string
  appenderRef: string
}