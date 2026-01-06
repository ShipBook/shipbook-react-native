import BaseLog, { LogType } from "./base-log";
import * as stackTraceParser from 'stacktrace-parser';

export class StackTraceElement {
  methodName?: string;
  fileName?: string;
  lineNumber?: number;
  column?: number;
  arguments?: string[];
  constructor(stackFrame: stackTraceParser.StackFrame) {
    this.methodName = stackFrame.methodName ?? undefined;
    this.fileName = stackFrame.file ?? undefined;
    this.lineNumber = stackFrame.lineNumber ?? undefined;
    this.column = this.column ?? undefined;
    this.arguments = this.arguments ?? undefined;
  }
}

export default class Exception extends BaseLog {
  name: string;
  reason: string;
  stack: string;
  callStackSymbols?: string[];
  stackTrace?: StackTraceElement[];
  constructor(name: string, reason: string, stack: string) {
    super(LogType.Exception);
    this.name = name;
    this.reason = reason;
    this.stack = stack;
    // this.callStackSymbols = stack.split('\n');
  }

  async getObj() {
    if (this.stackTrace) return this;
    const stack = stackTraceParser.parse(this.stack);
    const symbolicateStackTrace = require("react-native/Libraries/Core/Devtools/symbolicateStackTrace");
    let stackTrace: stackTraceParser.StackFrame[] | undefined = undefined;
    try {
      if (typeof symbolicateStackTrace === 'function') {
        const symbolicated = await symbolicateStackTrace(stack);
        if (symbolicated && symbolicated.stack) {
          stackTrace = <stackTraceParser.StackFrame[]>symbolicated.stack;
        }
      }
    } catch (e) {
      // console.error("Symbolication failed", e);
    }

    if (!stackTrace) {
      // Fallback to basic parsing if symbolication fails or is unavailable
      stackTrace = stack;
    }
    this.stackTrace = stackTrace.map(sf => new StackTraceElement(sf));
    return this;
  }
}