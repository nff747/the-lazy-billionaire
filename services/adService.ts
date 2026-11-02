import { AdMob, AdMobRewardItem } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Production AdMob credentials from Google AdMob Console
export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-2861442719937741~3498355249',
  REWARDED_AD_UNIT_ID: 'ca-app-pub-2861442719937741/1473333844',
  TEST_REWARDED_AD_UNIT_ID: 'ca-app-pub-3940256099942544/5224354917',
};

class AdService {
  private isInitialized = false;
  private isAdLoaded = false;
  private isTesting = false;

  async initialize(testing = false) {
    this.isTesting = testing;
    if (!Capacitor.isNativePlatform()) {
      console.log('AdService: Running on Web platform. Fallback simulated neural ad available.');
      this.isInitialized = true;
      return;
    }

    try {
      await AdMob.initialize({
        initializeForTesting: this.isTesting,
      });

      this.isInitialized = true;
      console.log('AdService: Google AdMob Initialized successfully on Android.');
      this.prepareRewardedAd();
    } catch (error) {
      console.warn('AdService: AdMob initialization failed or running in non-native container:', error);
    }
  }

  async prepareRewardedAd() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const adId = this.isTesting 
        ? ADMOB_CONFIG.TEST_REWARDED_AD_UNIT_ID 
        : ADMOB_CONFIG.REWARDED_AD_UNIT_ID;

      await AdMob.prepareRewardVideoAd({
        adId,
      });
      this.isAdLoaded = true;
      console.log('AdService: Rewarded Video Ad pre-loaded.');
    } catch (error) {
      this.isAdLoaded = false;
      console.warn('AdService: Error preparing rewarded ad:', error);
    }
  }

  async showRewardedAd(): Promise<{ watched: boolean; reward?: AdMobRewardItem; fallbackToWeb: boolean }> {
    if (!Capacitor.isNativePlatform()) {
      return { watched: false, fallbackToWeb: true };
    }

    try {
      if (!this.isAdLoaded) {
        await this.prepareRewardedAd();
      }

      const reward = await AdMob.showRewardVideoAd();
      this.isAdLoaded = false;
      this.prepareRewardedAd();
      return { watched: true, reward, fallbackToWeb: false };
    } catch (error) {
      console.warn('AdService: Failed to show AdMob rewarded video:', error);
      this.isAdLoaded = false;
      return { watched: false, fallbackToWeb: true };
    }
  }
}

export const adService = new AdService();
