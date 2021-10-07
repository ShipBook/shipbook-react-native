class InnerLog {
  enabled = false;

  e(message?: any, ...optionalParams: any[]) {
    if (!this.enabled) return;    
    console.error("Shipbook: " + message, ...optionalParams);
  } 

  w(message?: any, ...optionalParams: any[]) {
    if (!this.enabled) return;    
    console.warn("Shipbook: " + message, ...optionalParams);
  } 

  i(message?: any, ...optionalParams: any[]) {
    if (!this.enabled) return;    
    console.info("Shipbook: " + message, ...optionalParams);
  }

  d(message?: any, ...optionalParams: any[]) {
    if (!this.enabled) return;    
    console.debug("Shipbook: " + message, ...optionalParams);
  }   
}

export default new InnerLog();