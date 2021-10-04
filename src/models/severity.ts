export enum Severity {
  Off = 'Off',
  Error = 'Error',
  Warning = 'Warning',
  Info = 'Info',
  Debug = 'Debug',
  Verbose = 'Verbose'
}

export class SeverityUtil {
  static value(severity: Severity) {
    switch(severity) {
      case Severity.Off: return 0;
      case Severity.Error: return 1;
      case Severity.Warning: return 2;
      case Severity.Info: return 3;
      case Severity.Debug: return 4;
      case Severity.Verbose: return 5;
      default: return 0;
    }
  }
}