import { parseSessionLinkHeader } from '../src/models/session';

describe('parseSessionLinkHeader', () => {
  it('parses appId and sessionId', () => {
    expect(parseSessionLinkHeader('app-1:sess-abc')).toEqual({ appId: 'app-1', sessionId: 'sess-abc' });
  });

  it('splits on the first colon only', () => {
    expect(parseSessionLinkHeader('app:sess:extra')).toEqual({ appId: 'app', sessionId: 'sess:extra' });
  });

  it('returns undefined for undefined, empty, or malformed values', () => {
    expect(parseSessionLinkHeader(undefined)).toBeUndefined();
    expect(parseSessionLinkHeader('')).toBeUndefined();
    expect(parseSessionLinkHeader('no-separator')).toBeUndefined();
    expect(parseSessionLinkHeader(':sess')).toBeUndefined();
    expect(parseSessionLinkHeader('app:')).toBeUndefined();
  });
});
