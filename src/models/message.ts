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
  file?: string;
  line?: number;

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
    this.file = file;
    this.line = line;

    if (!file) {
      const stackString = new Error().stack!;
      let stack = stackTraceParser.parse(stackString);
      stack.splice(0,3);
      const symbolicateStackTrace = require("react-native/Libraries/Core/Devtools/symbolicateStackTrace");
      symbolicateStackTrace(stack).then((stackTemp: any) => {
        // console.log(stackTemp);
        const frame = stack.find(f => !Message.ignoreClasses.has(f.methodName)); // TODO: not correct
        if (frame) {
          this.function = frame.methodName;
          this.file = frame.file ?? undefined;
          this.line = frame.lineNumber ?? undefined;
        }      
        
        if (!tag) {
          let index = this.file?.lastIndexOf('.');
          this.tag = this.file?.substring(index! + 1) ?? '<unknown>';
        }
      
      });
    }

    
    // TODO make that it will except exceptions 
  }

}