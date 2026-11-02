import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.frozenflame.lazybillionaire',
  appName: 'The Lazy Billionaire',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
