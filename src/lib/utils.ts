import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Role hierarchy: Admin > Manager > User
export const ROLE_HIERARCHY = ['User', 'Manager', 'Admin'];

/**
 * Get the numeric level of a role based on hierarchy
 * @param role - The role to check
 * @returns The level (0=User, 1=Manager, 2=Admin, -1=invalid)
 */
export function getRoleLevel(role?: string): number {
  if (!role) return -1;
  return ROLE_HIERARCHY.indexOf(role);
}

/**
 * Get the highest role from user's roles array
 * @param userRoles - Array of user roles
 * @returns The highest role string or undefined
 */
export function getUserHighestRole(userRoles?: string[]): string | undefined {
  if (!userRoles || userRoles.length === 0) return undefined;
  let highestLevel = -1;
  let highestRole: string | undefined;
  for (const role of userRoles) {
    const level = getRoleLevel(role);
    if (level > highestLevel) {
      highestLevel = level;
      highestRole = role;
    }
  }
  return highestRole;
}

/**
 * Check if user has access to an item based on required role
 * @param itemRole - Required role for the item
 * @param userRoles - User's roles array
 * @returns true if user has sufficient access level
 */
export function hasAccess(itemRole?: string, userRoles?: string[]): boolean {
  if (!itemRole) return true;
  const userRole = getUserHighestRole(userRoles);
  const userLevel = getRoleLevel(userRole);
  const requiredLevel = getRoleLevel(itemRole);
  return userLevel >= requiredLevel && requiredLevel !== -1;
}
