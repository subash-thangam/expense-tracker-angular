import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.expense.tracker.app',
  appName: 'Expense Tracker',
  webDir: 'dist/expense-tracker-angular',
  server: {
    androidScheme: 'https',
    url: undefined,
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true
    }
  }
};

export default config;
