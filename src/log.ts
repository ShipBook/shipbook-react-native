import { CONFIG_CHANGE, eventEmitter } from "./event-emitter";
import InnerLog from "./inner-log";
import LogManager from "./log-manager";
import Message from "./models/message";
import { Severity, SeverityUtil } from "./models/severity";

export default class Log {
  private tag: string;
  private severity: Severity;
  private callStackSeverity: Severity;
  private static counter = 0;

  constructor(tag: string) {
    this.tag = tag;
    this.severity = LogManager.getSeverity(tag);
    this.callStackSeverity = LogManager.getCallStackSeverity(tag);
    eventEmitter.addListener(CONFIG_CHANGE, () => {
      InnerLog.i('config changed');
      this.severity = LogManager.getSeverity(tag);
      this.callStackSeverity = LogManager.getCallStackSeverity(tag);  
    });
  }

  static e(msg: string, e?: Error) {
    Log.message(msg, Severity.Error, e)
  }

  static w(msg: string, e?: Error) {
    Log.message(msg, Severity.Warning, e)
  }

  static i(msg: string, e?: Error) {
    Log.message(msg, Severity.Info, e)
  }

  static d(msg: string, e?: Error) {
    Log.message(msg, Severity.Debug, e)
  }

  static v(msg: string, e?: Error) {
    Log.message(msg, Severity.Verbose, e)
  }

  static message(msg: string,
                 severity: Severity,
                 error?: Error,
                 tag?:string,
                 func?: string,
                 file?: string,
                 line?: number) {
    let message: Message;
    if (!tag) {
      message = new Message(msg, severity, undefined, undefined, error, func, file, line)
      if (!message.tag) return;
      
      if (SeverityUtil.value(severity) > SeverityUtil.value(LogManager.getSeverity(message.tag))) return
      const stackTrace = (SeverityUtil.value(severity) <= SeverityUtil.value(LogManager.getCallStackSeverity(message.tag))) ? new Error().stack : undefined;
      message.stackTrace = stackTrace
    }
    else {
      if (SeverityUtil.value(severity) > SeverityUtil.value(LogManager.getSeverity(tag))) return
      const stackTrace = (SeverityUtil.value(severity) <= SeverityUtil.value(LogManager.getCallStackSeverity(tag))) ? new Error().stack : undefined;
      message = new Message(msg, severity, tag, stackTrace, error, func, file, line);
    }
    LogManager.push(message)
  }

  e(msg: string, e?: Error) {
    this.message(msg, Severity.Error, e);
  }

  w(msg: string, e?: Error) {
    this.message(msg, Severity.Warning, e);
  }

  i(msg: string, e?: Error) {
    this.message(msg, Severity.Info, e);
  }

  d(msg: string, e?: Error) {
    this.message(msg, Severity.Debug, e);
  }

  v(msg: string, e?: Error) {
    this.message(msg, Severity.Verbose, e);
  }

  message(msg: string, severity: Severity, e?: Error, func?: string, file?: string, line?: number, className?: string) {
    if (SeverityUtil.value(severity) > SeverityUtil.value(this.severity)) return
    const stackTrace = (SeverityUtil.value(severity) <= SeverityUtil.value(this.callStackSeverity)) ? new Error().stack : undefined;
    const message = new Message( msg, severity, this.tag, stackTrace, e, func, file,  line);
    LogManager.push(message);
  }
}