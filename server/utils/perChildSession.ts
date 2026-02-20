/**
 * Utility functions for managing per-child session data
 * Abstracts Design 1 (inline per-child) vs Design 2 (task list level) logic
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { CAPSession, ChildPlan, PerChildAnswer } from '../@types/session';

// Type for session that may or may not be fully initialized
type SessionLike = Partial<CAPSession>;

/**
 * Check if the per-child PoC is enabled for this session
 * Returns true only if the user selected the PoC version in the UR toggle
 */
export function isPerChildPoCEnabled(session: SessionLike): boolean {
  return session.usePerChildPoC === true;
}

/**
 * Check if the session is using Design 2 (task list level per-child)
 */
export function isDesign2(session: SessionLike): boolean {
  return session.perChildDesignMode === 'design2';
}

/**
 * Check if the session is using Design 3 (answer once + "Or specify per child" option)
 */
export function isDesign3(session: SessionLike): boolean {
  return session.perChildDesignMode === 'design3';
}

/**
 * Check if the session is using Design 4 (inline per-child with checkboxes instead of dropdown)
 */
export function isDesign4(session: SessionLike): boolean {
  return session.perChildDesignMode === 'design4';
}

/**
 * Check if the session is using inline per-child mode (Design 1)
 * This is the mode where users can add different answers for different children on the same page
 * using the "Add answer for a specific child" button
 */
export function isAnswerPerChild(session: SessionLike): boolean {
  return !isDesign2(session);
}

/**
 * Get the current child index (for Design 2)
 */
export function getCurrentChildIndex(session: SessionLike): number {
  return session.currentChildIndex ?? 0;
}

/**
 * Get the current child plan (for Design 2)
 */
export function getCurrentChildPlan(session: SessionLike): ChildPlan | undefined {
  if (!isDesign2(session)) {
    return undefined;
  }

  const currentIndex = getCurrentChildIndex(session);
  return session.childPlans?.find((p) => p.childIndex === currentIndex);
}

/**
 * Get a value from session, abstracting Design 1 vs Design 2
 * For Design 2, gets from current child's plan
 * For Design 1, gets from main session
 */
export function getSessionValue<T>(
  session: SessionLike,
  section: keyof ChildPlan,
  field?: string,
): T | undefined {
  if (isDesign2(session)) {
    const childPlan = getCurrentChildPlan(session);
    if (!childPlan) return undefined;

    const sectionData = childPlan[section];
    if (!sectionData) return undefined;

    if (field) {
      return (sectionData as any)[field];
    }
    return sectionData as T;
  }

  // Design 1: get from main session
  const sectionData = session[section as keyof CAPSession];
  if (!sectionData) return undefined;

  if (field) {
    return (sectionData as any)[field];
  }
  return sectionData as T;
}

/**
 * Set a value in session, abstracting Design 1 vs Design 2
 * For Design 2, sets in current child's plan
 * For Design 1, sets in main session
 */
export function setSessionValue(
  session: SessionLike,
  section: keyof ChildPlan,
  field: string,
  value: any,
): void {
  if (isDesign2(session)) {
    const currentIndex = getCurrentChildIndex(session);

    // Ensure child plans exist
    if (!session.childPlans) {
      session.childPlans = [];
    }

    // Find or create child plan
    let childPlan = session.childPlans.find((p) => p.childIndex === currentIndex);
    if (!childPlan) {
      childPlan = {
        childIndex: currentIndex,
        childName: session.namesOfChildren?.[currentIndex] ?? '',
        isComplete: false,
      };
      session.childPlans.push(childPlan);
    }

    // Ensure section exists
    if (!childPlan[section]) {
      (childPlan as any)[section] = {};
    }

    // Set the field value
    ((childPlan as any)[section] as any)[field] = value;
  } else {
    // Design 1: set in main session
    if (!session[section as keyof CAPSession]) {
      (session as any)[section] = {};
    }
    ((session as any)[section] as any)[field] = value;
  }
}

/**
 * Set an entire section in session, abstracting Design 1 vs Design 2
 */
export function setSessionSection(
  session: SessionLike,
  section: keyof ChildPlan,
  value: any,
): void {
  if (isDesign2(session)) {
    const currentIndex = getCurrentChildIndex(session);

    // Ensure child plans exist
    if (!session.childPlans) {
      session.childPlans = [];
    }

    // Find or create child plan
    let childPlan = session.childPlans.find((p) => p.childIndex === currentIndex);
    if (!childPlan) {
      childPlan = {
        childIndex: currentIndex,
        childName: session.namesOfChildren?.[currentIndex] ?? '',
        isComplete: false,
      };
      session.childPlans.push(childPlan);
    }

    // Set the section value
    (childPlan as any)[section] = value;
  } else {
    // Design 1: set in main session
    (session as any)[section] = value;
  }
}

/**
 * Helper to create a PerChildAnswer for Design 1
 */
export function createPerChildAnswer<T>(defaultValue: T): PerChildAnswer<T> {
  return {
    default: defaultValue,
  };
}

/**
 * Helper to get the default value from a PerChildAnswer or plain value
 */
export function getDefaultValue<T>(value: T | PerChildAnswer<T> | undefined): T | undefined {
  if (!value) return undefined;
  if (typeof value === 'object' && value !== null && 'default' in value) {
    return (value as PerChildAnswer<T>).default;
  }
  return value as T;
}

/**
 * Helper to check if a value is a PerChildAnswer
 */
export function isPerChildAnswer<T>(value: any): value is PerChildAnswer<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'default' in value &&
    (value.byChild === undefined || typeof value.byChild === 'object')
  );
}
