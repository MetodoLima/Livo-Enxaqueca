export const PDF_COLORS = {
  page: '#FFFFFF',
  card: '#FAFAFA',
  bodyText: '#1A1A2E',
  subtleText: '#59636A',
  header: '#112F3D',
  headerText: '#FFFFFF',
  headerMuted: '#BBC8CD',
  brand: '#25B7BB',
  statCard: '#F0FAFA',
  statLabel: '#4B5563',
  pillBackground: '#E8F9F9',
  pillText: '#0B5F61',
  line: '#6B7280',
  badgeText: '#FFFFFF',
} as const;

export const PDF_INTENSITY_BACKGROUNDS = {
  low: '#166534',
  medium: '#92400E',
  high: '#991B1B',
} as const;

export function pdfIntensityBackground(value: number): string {
  if (value <= 3) return PDF_INTENSITY_BACKGROUNDS.low;
  if (value <= 6) return PDF_INTENSITY_BACKGROUNDS.medium;
  return PDF_INTENSITY_BACKGROUNDS.high;
}
