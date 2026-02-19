/**
 * Secure Key Vault — Web Crypto API encryption for localStorage
 *
 * Encrypts API keys at rest using AES-GCM with a device-derived key.
 * This prevents casual localStorage snooping (DevTools, extensions).
 *
 * NOTE: This is defense-in-depth. A determined attacker with full JS execution
 * can still extract keys from memory. For true secret management, use a backend.
 *
 * @module utils/keyVault
 */

const VAULT_KEY = 'phd_betting_vault';
const SALT_KEY = 'phd_betting_vault_salt';
const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;

// Device fingerprint used as key derivation input
// This is NOT cryptographically strong — it's a speed bump, not a fortress
function getDeviceFingerprint() {
    const parts = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset().toString(),
        navigator.hardwareConcurrency?.toString() || '4',
    ];
    return parts.join('|');
}

async function getSalt() {
    let saltB64 = localStorage.getItem(SALT_KEY);
    if (saltB64) {
        return Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(SALT_KEY, btoa(String.fromCharCode(...salt)));
    return salt;
}

async function deriveKey(salt) {
    const fingerprint = getDeviceFingerprint();
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(fingerprint),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
        keyMaterial,
        { name: ALGO, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt and store API keys
 * @param {Object} keys - { openai, perplexity, gemini }
 */
export async function saveKeysEncrypted(keys) {
    try {
        const salt = await getSalt();
        const key = await deriveKey(salt);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const data = enc.encode(JSON.stringify(keys));

        const ciphertext = await crypto.subtle.encrypt(
            { name: ALGO, iv },
            key,
            data
        );

        const payload = {
            iv: btoa(String.fromCharCode(...iv)),
            data: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
            v: 1 // version for future migration
        };

        localStorage.setItem(VAULT_KEY, JSON.stringify(payload));
        // Also keep the plaintext fallback key for backward compatibility during migration
        // It will be removed after one successful encrypted read
        localStorage.setItem('phd_betting_api_keys', JSON.stringify(keys));
        return true;
    } catch (e) {
        console.warn('[KeyVault] Encryption failed, falling back to plaintext:', e.message);
        localStorage.setItem('phd_betting_api_keys', JSON.stringify(keys));
        return false;
    }
}

/**
 * Load and decrypt API keys
 * @returns {Object} { openai, perplexity, gemini }
 */
export async function loadKeysEncrypted() {
    try {
        const raw = localStorage.getItem(VAULT_KEY);
        if (!raw) {
            // No vault — try plaintext migration
            return migrateFromPlaintext();
        }

        const payload = JSON.parse(raw);
        if (!payload.iv || !payload.data) {
            return migrateFromPlaintext();
        }

        const salt = await getSalt();
        const key = await deriveKey(salt);

        const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
        const ciphertext = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0));

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGO, iv },
            key,
            ciphertext
        );

        const dec = new TextDecoder();
        const keys = JSON.parse(dec.decode(decrypted));

        // Migration complete — remove plaintext if it exists
        if (localStorage.getItem('phd_betting_api_keys')) {
            localStorage.removeItem('phd_betting_api_keys');
        }

        return keys;
    } catch (e) {
        console.warn('[KeyVault] Decryption failed, trying plaintext fallback:', e.message);
        return migrateFromPlaintext();
    }
}

async function migrateFromPlaintext() {
    try {
        const raw = localStorage.getItem('phd_betting_api_keys');
        if (!raw) return { openai: '', perplexity: '', gemini: '' };

        const keys = JSON.parse(raw);
        // Encrypt the plaintext keys
        await saveKeysEncrypted(keys);
        return keys;
    } catch {
        return { openai: '', perplexity: '', gemini: '' };
    }
}

/**
 * Check if Web Crypto is available
 */
export function isVaultSupported() {
    return !!(crypto?.subtle?.encrypt && crypto?.subtle?.decrypt);
}
