import * as Crypto from 'expo-crypto';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
import process from 'process';

if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {};
}
if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = (arr: any) => {
    const bytes = Crypto.getRandomBytes(arr.length);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = bytes[i];
    }
    return arr;
  };
}

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}
if (typeof global.process === 'undefined') {
  global.process = process;
}
if (!(global.process as any).version) {
  (global.process as any).version = 'v20.10.0';
}
