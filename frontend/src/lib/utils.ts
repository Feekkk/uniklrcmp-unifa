import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert Malaysian phone number to E.164 format
 * @param phoneNumber - Phone number starting with 0 (e.g., 013...)
 * @returns E.164 formatted number (e.g., +6013...)
 */
export function formatMalaysianPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return phoneNumber;
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 0, replace with +60
  if (cleaned.startsWith('0')) {
    return `+60${cleaned.substring(1)}`;
  }
  
  // If it already starts with 60, add +
  if (cleaned.startsWith('60')) {
    return `+${cleaned}`;
  }
  
  // If it already has +, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // Default: assume it's a Malaysian number and add +60
  return `+60${cleaned}`;
}