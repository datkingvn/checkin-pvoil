import crypto from 'crypto';

/**
 * Generate a cryptographically secure random index
 * @param max - The exclusive upper bound (0 to max-1)
 * @returns A random index
 */
export function secureRandomIndex(max: number): number {
    if (max <= 0) {
        throw new Error('Max must be greater than 0');
    }

    // Generate random bytes and convert to number
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);

    // Use modulo to get index in range [0, max)
    return randomNumber % max;
}

/**
 * Securely select a random element from an array
 */
export function secureRandomPick<T>(array: T[]): T {
    if (array.length === 0) {
        throw new Error('Array cannot be empty');
    }
    const index = secureRandomIndex(array.length);
    return array[index];
}

/**
 * Generate a random alphanumeric code
 */
export function generateEventCode(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        result += chars[randomBytes[i] % chars.length];
    }

    return result;
}
