import type { CrisisDay } from '@/features/crisis/useCrisisCalendar';
import type { RegistroCalendarDay } from '@/features/daily-record/useDailyRecordCalendar';

export type CalendarTab = 'todos' | 'crises' | 'eventos';

export type TimelineEntry =
  | { type: 'crise'; time: Date; data: CrisisDay }
  | { type: 'registro'; time: Date; data: RegistroCalendarDay };
