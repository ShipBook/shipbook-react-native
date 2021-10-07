// const  AsyncStorage = require('@react-native-async-storage/async-storage');

import storage from "../src/storage";

describe('storage unit tests', () => {
  test('should be string value', async () => {
    const key = "testString"
    const value = 'value';

    await storage.setItem(key, value);
    expect(storage.getItem(key)).resolves.toEqual(value);
  });

  test('should be object with value', async () => {
    const key = "testObj"
    const value = {value: "value"};

    await storage.setObj(key, value);

    await expect(storage.getObj(key)).resolves.toEqual(value);
  });


  test('should be array of objects with value', async () => {
    const key = "testArray"
    const array  = [
      {value: "value1"},
      {value: "value2"}
    ];
    await storage.pushArrayObj(key, array[0]);
    await storage.pushArrayObj(key, array[1]);
    await expect(storage.arraySize(key)).resolves.toEqual(array.length);
    await expect(storage.popAllArrayObj(key)).resolves.toEqual(array);
  });
});
