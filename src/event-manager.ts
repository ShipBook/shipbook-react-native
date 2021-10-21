import { AppState, NativeEventSubscription } from "react-native";
import logManager from "./log-manager";
import AppEvent from "./models/app-event";

export type AppStateStatus = 'active' | 'background' | 'inactive' | 'unknown' | 'extension';
class EventManager {
  private appStateSubscription?: NativeEventSubscription;
  private eventListener =  (state: AppStateStatus) => {
    const event = new AppEvent(state);
    logManager.push(event);
  }; 

  enableAppState() {
    this.eventListener = (state) => {
      const event = new AppEvent(state);
      logManager.push(event);
    };
    this.appStateSubscription  = AppState.addEventListener("change", this.eventListener);
  }

  removeAppState() {
    if (this.appStateSubscription) this.appStateSubscription.remove();
    else AppState.removeEventListener('change', this.eventListener); //for old versions or expo
    this.appStateSubscription = undefined;
  }
}

export default new EventManager();