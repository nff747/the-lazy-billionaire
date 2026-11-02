
const SALT = "LAZY_BILLIONAIRE_QUANTUM_SALT_V99_SECURE_HASH";

export const securityService = {
  // Generate a signature for the save state to prevent tampering
  signData: async (data: any): Promise<string> => {
     // Extract critical values to sign
     // We assume data is the clean GameState
     const money = Math.floor(data.money || 0);
     const diamonds = Math.floor(data.diamonds || 0);
     const prestige = Math.floor(data.prestigeCount || 0);
     const uid = data.userId || "anon";
     
     const criticalChain = `${money}:${diamonds}:${prestige}:${uid}:${SALT}`;
     return await sha256(criticalChain);
  },

  // Validate the signature
  validateData: async (data: any): Promise<{ valid: boolean, reason?: string }> => {
      if (!data.securitySignature) {
          // If it's a legacy save (no sig), we might accept it but flag it
          // OR if we want "Highest Quality", we migrate it.
          return { valid: true }; 
      }

      const generatedSig = await securityService.signData(data);
      if (generatedSig !== data.securitySignature) {
          return { valid: false, reason: "Signature Mismatch - Possible Tampering" };
      }

      // 2. Logic Sanity Checks
      // Check for Infinite/NaN
      if (!isFinite(data.money) || isNaN(data.money)) return { valid: false, reason: "Invalid Money Value" };
      if (!isFinite(data.diamonds) || isNaN(data.diamonds)) return { valid: false, reason: "Invalid Diamonds Value" };
      
      // Check for impossible negative values
      if (data.money < 0) return { valid: false, reason: "Negative Money Detected" };
      if (data.diamonds < 0) return { valid: false, reason: "Negative Diamonds Detected" };

      // Check for impossible diamond inflation without purchases
      if (data.diamonds > 10000000 && !data.starterKitPurchased && !data.purchasedPermanentIds?.includes('vip_pass')) {
          return { valid: false, reason: "Unauthorized Resource Inflation Detected" };
      }

      return { valid: true };
  },

  // Obfuscate local storage key
  getStorageKey: () => {
      // Rotate keys or obfuscate them
      return "lb_sec_store_v1_x99";
  }
};

// Standard SHA-256 implementation for browser
async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
