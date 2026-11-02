import { DIAMOND_BUNDLES } from '../constants';

// We declare the global CdvPurchase namespace as it's injected by the plugin
declare global {
  interface Window {
    CdvPurchase?: any;
  }
}

class StoreService {
  private store: any;
  private initialized = false;
  private onPurchaseSuccess: ((amount: number, id: string) => void) | null = null;

  constructor() {
    // Lazy access to window.CdvPurchase to avoid SSR/Web issues
  }

  initialize(purchaseCallback: (amount: number, id: string) => void) {
    if (this.initialized) return;
    
    // Check if running in a Cordova/Capacitor environment with the plugin
    if (!window.CdvPurchase || !window.CdvPurchase.store) {
      console.warn('StoreService: Plugin not found. Simulation mode active.');
      return;
    }

    this.store = window.CdvPurchase.store;
    this.onPurchaseSuccess = purchaseCallback;

    // 1. Register Products
    const products = DIAMOND_BUNDLES.map(bundle => ({
      id: bundle.productId,
      type: this.store.CONSUMABLE, // Diamonds are consumable
      platform: this.store.GOOGLE_PLAY, // We are targeting Android
    }));

    this.store.register(products);

    // 2. Setup Listeners
    // Handle 'approved' state - when the transaction is successful on the store side
    this.store.when().approved((transaction: any) => {
      console.log('StoreService: Transaction approved', transaction);
      
      // Verify signature if you have a backend validator. 
      // For now, we finish immediately (CLIENT-SIDE TRUST - insecure for real MMOs but ok for simple apps)
      transaction.verify();
    });

    // Handle 'verified' state - ready to deliver content
    this.store.when().verified((transaction: any) => {
        console.log('StoreService: Transaction verified', transaction);
        
        // Find which bundle was bought
        const bundle = DIAMOND_BUNDLES.find(b => b.productId === transaction.id);
        if (bundle && this.onPurchaseSuccess) {
            this.onPurchaseSuccess(bundle.amount, bundle.id);
        }
        
        transaction.finish(); // Acknowledge to the store
    });
    
    // Handle errors
    this.store.error((err: any) => {
        console.error('StoreService: Error', err);
    });

    // 3. Refresh/Update
    this.store.initialize([
      this.store.GOOGLE_PLAY,
    ]);

    this.initialized = true;
    console.log('StoreService: Initialized');
  }

  // Identify internal product ID (e.g. 'd_1') -> External Store ID (e.g. 'lb_diamonds_100')
  purchase(bundleId: string) {
    if (!this.initialized || !this.store) {
      console.warn('StoreService: Store not available, using simulation fallback.');
      return false; // Signal that we should use fallback
    }

    const bundle = DIAMOND_BUNDLES.find(b => b.id === bundleId);
    if (!bundle || !bundle.productId) {
        console.error('StoreService: Invalid bundle or missing product ID');
        return false;
    }

    const offer = this.store.get(bundle.productId);
    if (offer && offer.canPurchase) {
        this.store.order(offer);
        return true;
    } else {
        console.warn(`StoreService: Product ${bundle.productId} not available for purchase.`);
        return false;
    }
  }
  
  // Useful to debug what products are loaded
  dump() {
      if(!this.store) return;
      this.store.products.forEach((p: any) => console.log(p));
  }
}

export const storeService = new StoreService();
