export enum LogType {
  Message = 'message', 
}

export default class BaseLog {
  static count = 0;
  time: Date;
  orderId: number;
  // threadInfo: ThreadInfo
  type: LogType;

  constructor(type: LogType) {
    this.type = type;
    this.time = new Date();
    this.orderId = ++BaseLog.count;
  }
}