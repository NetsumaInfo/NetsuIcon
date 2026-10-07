import { useTranslation } from 'react-i18next';
import { MANNERS, type Manner } from '@netsuicon/core';
import { Segmented } from './Segmented';

interface MannerSwitchProps {
  manner: Manner;
  onChange(manner: Manner): void;
}

/** Which of the two manners of an icon plays: the subtle one, or the expressive one. */
export function MannerSwitch({ manner, onChange }: MannerSwitchProps) {
  const { t } = useTranslation();
  return <Segmented label={t('manner.label')} choices={MANNERS.map((value) => ({ value, label: t(`manner.${value}`) }))} value={manner} onChange={onChange} />;
}
