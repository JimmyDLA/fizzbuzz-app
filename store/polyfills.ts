import * as Crypto from 'expo-crypto';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';

const g: any = typeof globalThis !== 'undefined' ? globalThis : {};

if (typeof g.crypto === 'undefined') {
  g.crypto = {};
}
if (!g.crypto.getRandomValues) {
  g.crypto.getRandomValues = (arr: any) => {
    const bytes = Crypto.getRandomBytes(arr.length);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = bytes[i];
    }
    return arr;
  };
}

if (typeof g.Buffer === 'undefined') {
  g.Buffer = Buffer;
}
if (typeof g.process === 'undefined') {
  g.process = { env: {} };
}
if (!g.process.version) {
  g.process.version = 'v20.10.0';
}

