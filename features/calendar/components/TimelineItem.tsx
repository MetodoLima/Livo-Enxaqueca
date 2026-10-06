import type { TimelineEntry } from '@/features/calendar/types';
import CrisisListItem from '@/features/calendar/components/CrisisListItem';
import DailyRecordListItem from '@/features/calendar/components/DailyRecordListItem';

export default function TimelineItem({ entry, index }: { entry: TimelineEntry; index: number }) {
  if (entry.type === 'crise') return <CrisisListItem crisis={entry.data} index={index} />;
  return <DailyRecordListItem registro={entry.data} index={index} />;
}
