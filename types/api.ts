// Types untuk API NgajiTime
export interface Surah {
  number: number;
  sequence: number;
  numberOfVerses: number;
  name: {
    short: string;
    long: string;
    transliteration: {
      en: string;
      id: string;
    };
    translation: {
      en: string;
      id: string;
    };
  };
  revelation: {
    arab: string;
    en: string;
    id: string;
  };
  tafsir: {
    id: string;
  };
  preBismillah?: any;
}

export interface Ayah {
  number: {
    inQuran: number;
    inSurah: number;
  };
  meta: {
    juz: number;
    page: number;
    manzil: number;
    ruku: number;
    hizbQuarter: number;
    sajda: {
      recommended: boolean;
      obligatory: boolean;
    };
  };
  text: {
    arab: string;
    transliteration: {
      en: string;
    };
  };
  translation: {
    en: string;
    id: string;
  };
  audio: {
    primary: string;
    secondary: string[];
  };
  tafsir: {
    id: {
      short: string;
      long: string;
    };
  };
  surah: Surah;
}

export interface ApiResponse<T> {
  code: number;
  status: string;
  message: string;
  data: T;
}

export type SurahResponse = ApiResponse<Surah[]>;
export type SurahDetailResponse = ApiResponse<Ayah[]>;
export type AyahResponse = ApiResponse<Ayah>;

// Types untuk local storage
export interface BookmarkAyah {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  text: string;
  translation: string;
}

export interface LastRead {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  timestamp: Date;
}

export interface TahfidzTarget {
  id: string;
  surahNumber: number;
  surahName: string;
  totalVerses: number;
  completedVerses: number[];
  createdAt: Date;
  progress: number;
}
