import logManager from "../log-manager";
import sessionManager from "./session-manager";

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  DELETE = 'DELETE',
  PUT = 'PUT'
}

class ConnectionClient {
  public BASE_URL = "https://api.shipbook.io/v1/";
  
  async request(url: string, body?: object, method?: HttpMethod): Promise<Response> {
    let headers: Headers = new Headers({
      'Content-Type': 'application/json'
    });
    if (sessionManager.token) headers.set('Authorization', `Bearer ${sessionManager.token}`);
    let init: RequestInit = { headers };

    if (body) init.body = JSON.stringify(body);

    if (method) init.method = method;

    let resp = await fetch(this.BASE_URL + url, init);
    if (!resp.ok && resp.status === 401 && resp.statusText === 'TokenExpired') { // call refresh token
      if (! await sessionManager.refreshToken()) return resp;
      resp = await this.request(url, body, method);
    }

    return resp;
  }
}

export default new ConnectionClient();