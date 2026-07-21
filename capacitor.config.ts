import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.milliondollardream.app',
  appName: 'MyDreams',
  webDir: 'out',
  server: {
    // Allow client-side routing to work for all paths
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'MyDreams',
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body' as any,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
