import { useTranslation } from 'react-i18next';
import { Segmented } from './Segmented';

const CHOICES = ['dark', 'light'] as const;
export type Paper = (typeof CHOICES)[number];

/** The two backgrounds an icon is tried on, with the colour `currentColor` takes on each. */
export const PAPERS: Record<Paper, string> = {
  dark: 'bg-bg text-fg',
  light: 'bg-paper-light text-ink-light',
};

interface PaperSwitchProps {
  paper: Paper;
  onChange(paper: Paper): void;
}

export function PaperSwitch({ paper, onChange }: PaperSwitchProps) {
  const { t } = useTranslation();
  return <Segmented label={t('stage.paper')} choices={CHOICES.map((value) => ({ value, label: t(`stage.${value}`) }))} value={paper} onChange={onChange} />;
}
