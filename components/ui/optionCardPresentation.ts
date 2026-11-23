export type OptionCardSupportingTextTone = 'content' | 'muted';

export function optionCardSupportingTextTone(checked: boolean): OptionCardSupportingTextTone {
  return checked ? 'content' : 'muted';
}
