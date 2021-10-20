import { AppState, NativeEventSubscription } from "react-native";
import logManager from "./log-manager";
import AppEvent from "./models/app-event";

export type AppStateStatus = 'active' | 'background' | 'inactive' | 'unknown' | 'extension';
class EventManager {
  private appStateSubscription?: NativeEventSubscription;

  enableAppState() {
    this.appStateSubscription  = AppState.addEventListener("change", (state) => {
      const event = new AppEvent(state);
      logManager.push(event);
    });
  }

  removeAppState() {
    this.appStateSubscription?.remove();
    this.appStateSubscription = undefined;
  }
}

export default new EventManager();