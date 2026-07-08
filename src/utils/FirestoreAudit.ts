import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const isDev = import.meta.env.DEV;

/**
 * Comprehensive audit of authentication and admin status
 * Call this to diagnose why queries might be failing
 */
export async function auditAdminAccess() {
  if (!isDev) return;
  console.log('[AUDIT] Starting Firestore Access Audit...\n');

  try {
    // Phase 1: Check current authentication
    const currentUser = auth.currentUser;
    console.log('[AUTH] Current User:', {
      uid: currentUser?.uid || 'NOT AUTHENTICATED',
      email: currentUser?.email || 'NO EMAIL',
      displayName: currentUser?.displayName || 'NO DISPLAY NAME',
      emailVerified: currentUser?.emailVerified || false,
    });

    if (!currentUser) {
      console.warn('[AUTH] ⚠️  NO USER AUTHENTICATED - Admin panel cannot access Firestore');
      return;
    }

    // Phase 2: Check user document and role
    console.log('\n[AUTH] Checking Firestore User Document...');
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.warn('[AUTH] ⚠️  User document does NOT exist in Firestore');
      console.log('[AUTH] Expected path: users/' + currentUser.uid);
    } else {
      const userData = userDocSnap.data();
      console.log('[AUTH] User Document Found:', {
        path: 'users/' + currentUser.uid,
        role: userData.role || 'NO ROLE',
        displayName: userData.displayName || 'NO NAME',
        email: userData.email || 'NO EMAIL IN DOC',
      });
    }

    // Phase 3: Determine if isAdmin() would return true (check role only)
    const isAdminRole = userDocSnap.exists() && userDocSnap.data()?.role === 'admin';

    console.log('\n[ADMIN] Final Admin Status:', {
      userRole: userDocSnap.exists() ? userDocSnap.data()?.role : 'NO ROLE',
      isAdmin: isAdminRole ? '✅ TRUE' : '❌ FALSE',
    });

    if (!isAdminRole) {
      console.error('[ADMIN] ❌ CRITICAL: User role is NOT admin - Firestore queries will be DENIED');
      console.error('[ADMIN] Fix: Set user document role field to "admin" in Firestore path: users/' + currentUser.uid);
    } else {
      console.log('[ADMIN] ✅ User has admin role - should have access to admin collections');
    }

    // Phase 5: Test basic query access
    console.log('\n[QUERY] Testing Query Access...');
    try {
      await getDoc(doc(db, 'users', currentUser.uid));
      console.log('[QUERY] ✅ Can read own user document: SUCCESS');
    } catch (e) {
      console.error('[QUERY] ❌ Cannot read own user document:', (e as any).message);
    }

  } catch (err) {
    console.error('[AUDIT] Error during audit:', err);
  }

  console.log('\n[AUDIT] Audit Complete\n');
}

/**
 * Logs detailed info when a Firestore listener encounters an error
 */
export function logFirestoreError(context: string, error: any) {
  console.error(`[FIRESTORE] ${context}:`, {
    code: error.code,
    message: error.message,
    name: error.name,
  });

  if (isDev && error.code === 'permission-denied') {
    console.error('[FIRESTORE] ⚠️  PERMISSION DENIED');
    console.error('[FIRESTORE] This means the user does not have the required permissions');
    console.error('[FIRESTORE] Verify: User document has role="admin" in Firestore');
  }
}
