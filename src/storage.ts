import AsyncStorage from '@react-native-async-storage/async-storage';

class Storage {
  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  }

  async getItem(key:string) {
    return await AsyncStorage.getItem(key);
  }

  async setObj(key: string, value: object) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async getObj(key:string) {
    const value = await AsyncStorage.getItem(key);
    if (!value) return undefined;
    return JSON.parse(value);
  }

}

export default new Storage();