
import storage from "../src/storage";

describe('storage unit tests', () => {
  beforeEach(async () => {
    await storage.setItem("testString", "value");
    await storage.setObj("testObj", {value: "value"});
    await storage.pushArrayObj("testArray", {value: "value1"});
    await storage.pushArrayObj("testArray", {value: "value2"});
  });

  test('should be string value', async () => {
    const value = await storage.getItem("testString");
    expect(value).toBe('value');
  });

  test('should be object with value', async () => {
    const value = await storage.getItem("testObj");
    expect(value).toBe({value: "value"});
  });
});
