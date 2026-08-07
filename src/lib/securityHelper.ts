/**
 * Heaven Touching Earth International Ministries (HTEIM) School of Ministry
 * Security & Defense Helper Module
 * 
 * Provides client-side defense against Cross-Site Scripting (XSS), 
 * SQL/HTML injection, path traversal, and malicious uploads.
 */

/**
 * Sanitizes generic user text inputs to prevent XSS and HTML injection.
 * Escapes common HTML special characters.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strips out dangerous script tags, iframe tags, or javascript: protocols
 * while preserving standard text content.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  let cleaned = input.trim();
  
  // Strip script tags and content inside them
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Strip on* event attributes (e.g. onload, onerror, onclick, etc.)
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=\s*\w+\([^)]*\)/gi, '');
  
  // Strip javascript: URI protocols
  cleaned = cleaned.replace(/javascript\s*:\s*/gi, '');
  
  // Strip iframe and object tags
  cleaned = cleaned.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  cleaned = cleaned.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
  
  return cleaned;
}

/**
 * Sanitizes a file name to prevent path traversal (../), command injection,
 * or unexpected characters that could cause storage bucket issues.
 */
export function sanitizeFileName(fileName: string | null | undefined): string {
  if (!fileName) return `file_${Date.now()}`;
  
  // Get filename part and extension
  const parts = fileName.split('/');
  const baseName = parts[parts.length - 1] || fileName;
  
  // Remove path traversal patterns like ".."
  let cleanName = baseName.replace(/\.\./g, '').trim();
  
  // Replace anything that is not alphanumeric, a period, a hyphen, or underscore
  cleanName = cleanName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  
  // Ensure the filename is not blank or empty
  if (!cleanName || cleanName === '.' || cleanName === '..') {
    cleanName = `upload_${Date.now()}`;
  }
  
  return cleanName;
}

/**
 * Validates whether an email format is structurally sound and secure.
 */
export function validateEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  // Standard robust email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Assesses the strength of a user-entered password and provides clear
 * metric scores and security recommendations.
 */
export interface PasswordStrengthReport {
  score: number; // 0 (weakest) to 4 (strongest)
  isSecure: boolean;
  feedback: string[];
}

export function checkPasswordStrength(password: string | null | undefined): PasswordStrengthReport {
  const report: PasswordStrengthReport = {
    score: 0,
    isSecure: false,
    feedback: []
  };

  if (!password) {
    report.feedback.push('Password cannot be empty.');
    return report;
  }

  if (password.length < 8) {
    report.feedback.push('Password should be at least 8 characters long.');
  } else {
    report.score += 1;
  }

  // Check for lowercase and uppercase letters
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    report.score += 1;
  } else {
    report.feedback.push('Mix uppercase and lowercase characters.');
  }

  // Check for numbers
  if (/\d/.test(password)) {
    report.score += 1;
  } else {
    report.feedback.push('Include at least one numerical digit (0-9).');
  }

  // Check for special character symbols
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    report.score += 1;
  } else {
    report.feedback.push('Include a special symbol (e.g. !, @, #, $, &).');
  }

  report.isSecure = report.score >= 3 && password.length >= 8;

  return report;
}
