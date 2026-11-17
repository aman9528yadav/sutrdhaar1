/**
 * WebAuthn Biometric & PIN Security Utilities
 * Works across Android (Chrome, Brave, Firefox, Samsung Internet), iOS, Windows Hello, and Mac Touch ID.
 */

// Check if biometric authenticator is supported and available on this hardware
export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return Boolean(available);
    }
  } catch (err) {
    console.warn("Biometrics availability check error:", err);
  }
  return false;
}

// Register device biometric credential locally (triggers native biometric prompt)
export async function registerBiometricCredential(userName: string = 'Sutradhaar User'): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new Uint8Array(16);
    window.crypto.getRandomValues(userIdBytes);

    const createCredentialOptions: CredentialCreationOptions = {
      publicKey: {
        challenge,
        rp: {
          name: 'Sutradhaar Companion',
          id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        },
        user: {
          id: userIdBytes,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Native phone fingerprint/Face ID
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    };

    const credential = (await navigator.credentials.create(createCredentialOptions)) as PublicKeyCredential | null;

    if (credential && credential.id) {
      localStorage.setItem('sutra_biometric_registered', 'true');
      localStorage.setItem('sutra_biometric_cred_id', credential.id);
      return true;
    }
  } catch (err: any) {
    console.warn("Biometric registration cancelled or failed:", err);
    // User might have cancelled prompt or browser security context restricted it
  }
  return false;
}

// Authenticate via native fingerprint / Face ID
export async function verifyBiometricAuth(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const getCredentialOptions: CredentialRequestOptions = {
      publicKey: {
        challenge,
        rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        userVerification: 'required',
        timeout: 60000,
      },
    };

    const assertion = await navigator.credentials.get(getCredentialOptions);
    if (assertion) {
      return true;
    }
  } catch (err: any) {
    console.warn("Biometric verification cancelled or failed:", err);
  }
  return false;
}

// Simple fast SHA-256 hash for local 4-digit backup PIN
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_sutradhaar_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
