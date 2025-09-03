import axios from 'axios';
import { ApiResponse, FilterParams } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API isteklerini interceptor ile loglama
api.interceptors.request.use(
  (config) => {
    console.log(`API İsteği: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API İstek Hatası:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`API Yanıtı: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Yanıt Hatası:', error);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Sağlık kontrolü
  healthCheck: async (): Promise<{ message: string; status: string }> => {
    const response = await api.get('/health');
    return response.data;
  },

  // Tüm fatura verilerini getir
  getFaturalar: async (): Promise<ApiResponse> => {
    const response = await api.get('/faturalar');
    return response.data;
  },

  // Filtrelenmiş fatura verilerini getir
  getFaturalarFiltreli: async (params: FilterParams): Promise<ApiResponse> => {
    const response = await api.get('/faturalar/filtreli', {
      params: {
        carikod: params.carikod,
        baslangicTarih: params.baslangicTarih,
        bitisTarih: params.bitisTarih,
      },
    });
    return response.data;
  },

  // En son fiş numarasını getir
  getLatestFisNo: async (): Promise<{
    success: boolean;
    latestFisNo: number;
    nextFisNo: number;
    mode?: string;
    message?: string;
    error?: string;
  }> => {
    const response = await api.get('/latest-fis-no');
    return response.data;
  },

  // Malzeme Fiş Tiplerini getir
  getMalzemeFisTipleri: async (): Promise<{
    success: boolean;
    data: Array<{
      MalzemeFisTipID: number;
      MalzemeFisTipi: string;
    }>;
    mode?: string;
    message?: string;
    error?: string;
  }> => {
    const response = await api.get('/malzeme-fis-tipleri');
    return response.data;
  },

  // Depo listesini getir
  getDepolar: async (): Promise<{
    success: boolean;
    data: Array<{
      AdresID: number;
      DepoID: number;
      Adres: string;
      Pasif: number;
      OzelKodu1: string;
      OzelKodu2: string;
      OzelKodu3: string;
      DepoAdi: string;
    }>;
    mode?: string;
    message?: string;
    error?: string;
  }> => {
    const response = await api.get('/depolar');
    return response.data;
  },
};

export default api;
