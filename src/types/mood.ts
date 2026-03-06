import type { LucideIcon } from 'lucide-react';

export interface Mood {
  id?: number;
  name: string;
  color: string;
  icon: LucideIcon;
  description?: string;
}
