export interface FaturaData {
  CARIKOD: string;
  CARI_ISIM: string;
  FATIRS_NO: string;
  STOK_ADI: string;
  STRA_GCMIK: number;
  OLCUBR: string;
  TARIH: string;
  SIPARIS_TARIH: string;
}

export interface ApiResponse {
  success: boolean;
  data: FaturaData[];
  count: number;
  filters?: {
    carikod: string;
    baslangicTarih: string;
    bitisTarih: string;
  };
  error?: string;
  details?: string;
  mode?: 'database' | 'test' | 'fallback';
  warning?: string;
}

export interface FilterParams {
  carikod: string;
  baslangicTarih: string;
  bitisTarih: string;
}
