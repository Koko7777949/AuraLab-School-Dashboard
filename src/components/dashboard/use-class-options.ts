'use client';

import { useAppStore } from '@/lib/store';

export interface ClassOption {
  value: string;
  label: string;
}

/**
 * Single source of truth for class dropdowns and id → name lookups.
 * Derives options from the store's `classes` array instead of hardcoded
 * module-level lists, so newly added/renamed/deleted classes are always
 * reflected across every section (students, attendance, exams, grades,
 * sessions, behavior, profile, ...).
 */
export function useClassOptions() {
  const classes = useAppStore((s) => s.classes);

  const classOptions: ClassOption[] = classes.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  /** Resolve a class id to its display name, or '—' when unknown. */
  const getClassName = (classId: string | null | undefined): string => {
    if (!classId) return '—';
    return classes.find((c) => c.id === classId)?.name ?? '—';
  };

  /** First available class id (used as a sensible form default). */
  const firstClassId = classes[0]?.id ?? '';

  return { classes, classOptions, getClassName, firstClassId };
}
