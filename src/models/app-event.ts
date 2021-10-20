import BaseEvent from "./base-event";
import { LogType } from "./base-log";

export default class AppEvent extends BaseEvent {
  state: string; 
  constructor(state: string) {
    super(LogType.AppEvent);
    this.state = state;
  }
}