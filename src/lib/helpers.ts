/**
 * Slugify a string for use as a normalized key
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '')    // Remove special chars
        .replace(/\s+/g, '-')            // Replace spaces with hyphens
        .replace(/-+/g, '-')             // Replace multiple hyphens
        .replace(/^-+|-+$/g, '');        // Trim hyphens
}

/**
 * Create a normalized key from name and department
 */
export function createNormalizedKey(fullName: string, department: string): string {
    return `${slugify(fullName)}|${slugify(department)}`;
}

/**
 * Normalize Vietnamese phone number to digits-only format (84xxxxxxxxx)
 * Handles: 03x, 05x, 07x, 08x, 09x, +84xxx, 84xxx
 */
export function normalizePhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('84') && digits.length === 11) {
        return digits;
    }
    if (digits.startsWith('0') && digits.length === 10) {
        return '84' + digits.slice(1);
    }
    return digits;
}

/**
 * Validate Vietnamese phone number (10-11 digits, mobile prefixes: 03, 05, 07, 08, 09)
 */
export function isValidVietnamPhone(phone: string): boolean {
    const normalized = normalizePhoneNumber(phone.trim());
    if (normalized.length === 11 && normalized.startsWith('84')) {
        const suffix = normalized.slice(2);
        return /^[35789]\d{8}$/.test(suffix); // 03x, 05x, 07x, 08x, 09x
    }
    if (normalized.length === 10 && normalized.startsWith('0')) {
        return /^0[35789]\d{8}$/.test(normalized);
    }
    return false;
}

/**
 * Validate non-empty string
 */
export function isValidString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format ticket number with leading zeros
 */
export function formatTicketNumber(num: number, digits: number = 5): string {
    return num.toString().padStart(digits, '0');
}
