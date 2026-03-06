export interface DailyColor {
  date: string;
  color: string;
  emotion: string;
  note: string;
}

export interface CustomEmotion {
  id: number;
  name: string;
  color: string;
  icon: string;
  description: string;
}

export interface CreateJournalBody {
  date: string;
  color: string;
  emotion: string;
  note?: string;
}

export interface CreateEmotionBody {
  name: string;
  color: string;
  icon: string;
  description?: string;
}
