import AsyncStorage from '@react-native-async-storage/async-storage';
// const  AsyncStorage = require('@react-native-async-storage/async-storage'); //using require so mock from jest will work

class Storage {
  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  }

  async getItem(key:string) {
    return await AsyncStorage.getItem(key);
  }

  async removeItem(key:string) {
    return await AsyncStorage.removeItem(key);
  }

  async setObj(key: string, value: object) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async getObj(key:string) {
    const value = await AsyncStorage.getItem(key);
    if (!value) return undefined;
    return JSON.parse(value);
  }

  async pushArrayObj(key: string, value: object): Promise<void>;
  async pushArrayObj(key: string, value: object[]): Promise<void>;
  async pushArrayObj(key: string, value: object | object[]) {
    const sizeString = await AsyncStorage.getItem(`${key}_size`);
    let size = Number(sizeString ?? "0");

    let valuePairs: string[][]= []
    if (Array.isArray(value)) {
      for (let v of value){
        valuePairs.push([`${key}_${size}`, JSON.stringify(v)]);
        ++size;
      }
    }
    else { //not array
      valuePairs.push([`${key}_${size}`, JSON.stringify(value)]);
      ++size;
    }

    valuePairs.push([`${key}_size`, size.toString()]);
    await AsyncStorage.multiSet(valuePairs);
  }

  async popAllArrayObj(key: string): Promise<object[]> {
    const sizeString = await AsyncStorage.getItem(`${key}_size`);
    let size = Number(sizeString ?? "0");
    if (size === 0) return [];
    let keys: string[] = [];
    for (let i = 0; i < size; ++i) {
      keys.push(`${key}_${i}`);
    }
    const values = <string[][]>await AsyncStorage.multiGet(keys);
    const objects = values.map(value => typeof(value[1]) === 'string' ? JSON.parse(value[1]): undefined);
    keys.push(`${key}_size`);
    await AsyncStorage.multiRemove(keys);
    return objects;
  }; 

  async arraySize(key: string): Promise<number> {
    const sizeString = await AsyncStorage.getItem(`${key}_size`);
    return Number(sizeString ?? "0");
  }
}

export default new Storage();