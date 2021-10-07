import * as stackTraceParser from 'stacktrace-parser';
import BaseLog, { LogType } from './base-log';
import { Severity } from './severity';
export default class Message extends BaseLog {
  static ignoreClasses = new Set<string>();

  severity: Severity;
  message: string;
  tag?: string; // it is intialized after the promise
  stackTrace?: string;
  error?: Error;
  function?: string;
  fileName?: string;
  lineNumber?: number;

  private resolveList: ((message:Message) => void)[] = []; 
  private stackReceived = false;

  constructor(message: string,
              severity: Severity, 
              tag?: string,
              stackTrace?: string,
              error?: Error,
              func?: string,
              file?: string,
              line?: number
  ) {
    super(LogType.Message);
    this.message = message;
    this.severity = severity;
    this.tag = tag;
    this.stackTrace = stackTrace;
    this.error = error;
    this.function = func;
    this.fileName = file;
    this.lineNumber = line;

    if (!file) {
      const stackString = new Error().stack!;
      let stack = stackTraceParser.parse(stackString);
      stack.splice(0,3);
      const symbolicateStackTrace = require("react-native/Libraries/Core/Devtools/symbolicateStackTrace");
      symbolicateStackTrace(stack).then((stackTrace: any) => {
        stack = stackTrace.stack;
        const frame = stack.find(f => !Message.ignoreClasses.has(f.methodName)); // TODO: not correct
        if (frame) {
          this.function = frame.methodName;
          this.fileName = frame.file ?? undefined;
          this.lineNumber = frame.lineNumber ?? undefined;
        }      
        
        if (!tag) {
          let index = this.fileName?.lastIndexOf('.');
          this.tag = this.fileName?.substring(index! + 1) ?? '<unknown>';
        }
        this.stackReceived = true;
        this.resolveList.forEach(resolve => resolve(this));
        this.resolveList = [];
      });
    }

    
    // TODO make that it will except exceptions 
  }

  async getObj(): Promise<Message> {
    if (!this.stackReceived) {
      let promise = new Promise<Message>((resolve) => {
        this.resolveList.push(resolve);
      })

      return promise;
    }
    return this;
  }
}