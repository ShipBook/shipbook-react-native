import Shipbook from '../src/index';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('detectAppVersion', () => {
  const originalCwd = process.cwd();
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-appver-'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads version from package.json in cwd', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'my-app', version: '3.1.4' }));
    process.chdir(tmpDir);
    expect(Shipbook['detectAppVersion']()).toBe('3.1.4');
  });

  it('walks up parent directories to find package.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'my-app', version: '2.0.0' }));
    const nested = path.join(tmpDir, 'dist', 'lib');
    fs.mkdirSync(nested, { recursive: true });
    process.chdir(nested);
    expect(Shipbook['detectAppVersion']()).toBe('2.0.0');
  });

  it('stops at the nearest package.json even if it has no version', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'workspace-root', version: '9.9.9' }));
    const nested = path.join(tmpDir, 'packages', 'app');
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, 'package.json'), JSON.stringify({ name: 'app', private: true }));
    process.chdir(nested);
    expect(Shipbook['detectAppVersion']()).toBeUndefined();
  });

  it('returns undefined for unparsable package.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), 'not json {');
    process.chdir(tmpDir);
    expect(Shipbook['detectAppVersion']()).toBeUndefined();
  });
});
