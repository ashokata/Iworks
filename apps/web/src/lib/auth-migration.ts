/**
 * Auth Migration Utilities
 *
 * Helper functions to facilitate the migration from legacy auth to Clerk
 */

import { User as ClerkUser } from '@clerk/nextjs/server';
import { User as LegacyUser } from '@/types';

/**
 * Map legacy user data to Clerk user metadata
 */
export async function mapLegacyUserToClerk(legacyUser: LegacyUser): Promise<{
  firstName: string;
  lastName: string;
  emailAddress: string;
  publicMetadata: Record<string, any>;
  privateMetadata: Record<string, any>;
}> {
  const [firstName, ...lastNameParts] = legacyUser.name.split(' ');
  const lastName = lastNameParts.join(' ');

  return {
    firstName,
    lastName,
    emailAddress: legacyUser.email,
    publicMetadata: {
      legacyUserId: legacyUser.id,
      role: legacyUser.role,
      tenantId: legacyUser.tenantId,
      migrated: true,
      migratedAt: new Date().toISOString(),
    },
    privateMetadata: {
      legacyPasswordHash: 'MIGRATION_REQUIRED', // Don't store actual password
    },
  };
}

/**
 * Map Clerk user to legacy user format for compatibility
 */
export function mapClerkToLegacyUser(clerkUser: ClerkUser): LegacyUser {
  const publicMetadata = clerkUser.publicMetadata || {};
  const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId);

  return {
    id: publicMetadata.legacyUserId || clerkUser.id,
    email: primaryEmail?.emailAddress || '',
    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    role: publicMetadata.role || 'user',
    tenantId: publicMetadata.tenantId || '',
    avatar: clerkUser.imageUrl,
  };
}

/**
 * Check if a user needs migration from legacy to Clerk
 */
export function needsMigration(email: string, clerkUsers: ClerkUser[]): boolean {
  return !clerkUsers.some(user =>
    user.emailAddresses.some(e => e.emailAddress === email)
  );
}

/**
 * Get tenant ID from either auth system
 */
export function getTenantId(
  legacyUser: LegacyUser | null,
  clerkUser: ClerkUser | null,
  clerkOrgId: string | null
): string | null {
  // Priority 1: Clerk organization ID (most authoritative in new system)
  if (clerkOrgId) {
    return clerkOrgId;
  }

  // Priority 2: Legacy user tenant ID
  if (legacyUser?.tenantId) {
    return legacyUser.tenantId;
  }

  // Priority 3: Clerk user metadata tenant ID (for migrated users)
  if (clerkUser?.publicMetadata?.tenantId) {
    return clerkUser.publicMetadata.tenantId as string;
  }

  return null;
}

/**
 * Sync user data between systems during transition period
 */
export interface UserSyncResult {
  success: boolean;
  message: string;
  clerkUserId?: string;
  error?: any;
}

export async function syncUserData(
  legacyUser: LegacyUser,
  clerkUserId: string
): Promise<UserSyncResult> {
  try {
    // This would typically call an API to update both systems
    // For POC, we're just returning success
    console.log('[Auth Migration] Syncing user data:', {
      legacyUserId: legacyUser.id,
      clerkUserId,
    });

    return {
      success: true,
      message: 'User data synced successfully',
      clerkUserId,
    };
  } catch (error) {
    console.error('[Auth Migration] Sync failed:', error);
    return {
      success: false,
      message: 'Failed to sync user data',
      error,
    };
  }
}

/**
 * Migration status for monitoring
 */
export interface MigrationStatus {
  totalUsers: number;
  migratedUsers: number;
  pendingUsers: number;
  failedUsers: number;
  percentComplete: number;
}

export function calculateMigrationStatus(
  legacyUsers: LegacyUser[],
  clerkUsers: ClerkUser[]
): MigrationStatus {
  const totalUsers = legacyUsers.length;
  const migratedUsers = clerkUsers.filter(u => u.publicMetadata?.migrated).length;
  const pendingUsers = totalUsers - migratedUsers;
  const failedUsers = 0; // Would track this in a real implementation

  return {
    totalUsers,
    migratedUsers,
    pendingUsers,
    failedUsers,
    percentComplete: totalUsers > 0 ? (migratedUsers / totalUsers) * 100 : 0,
  };
}