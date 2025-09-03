import React, { useState, useEffect } from 'react';
import { FaturaData } from '../types';
import { apiService } from '../services/api';

interface FaturaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  fatura: FaturaData | null;
}

interface FaturaDetailData {
  fisNo: string;
  faturaNo: string;
  tipi: string;
  tarih: string;
  tedarikciKodu: string;
  doviz: string;
  mteYazdirma: boolean;
  kur: number;
  vade: number;
  depo: string;
}

interface MalzemeFisTipi {
  MalzemeFisTipID: number;
  MalzemeFisTipi: string;
}

interface Depo {
  AdresID: number;
  DepoID: number;
  Adres: string;
  Pasif: number;
  OzelKodu1: string;
  OzelKodu2: string;
  OzelKodu3: string;
  DepoAdi: string;
}

const FaturaDetailModal: React.FC<FaturaDetailModalProps> = ({ isOpen, onClose, fatura }) => {
  const [formData, setFormData] = useState<FaturaDetailData>({
    fisNo: '',
    faturaNo: '',
    tipi: '',
    tarih: '',
    tedarikciKodu: '',
    doviz: 'TRY',
    mteYazdirma: false,
    kur: 1,
    vade: 30,
    depo: ''
  });

  const [loading, setLoading] = useState(false);
  const [fisNoLoading, setFisNoLoading] = useState(false);
  const [fisTipleri, setFisTipleri] = useState<MalzemeFisTipi[]>([]);
  const [fisTipleriLoading, setFisTipleriLoading] = useState(false);
  const [depolar, setDepolar] = useState<Depo[]>([]);
  const [depolarLoading, setDepolarLoading] = useState(false);

  useEffect(() => {
    if (fatura && isOpen) {
      loadFisNoAndSetFormData();
      loadFisTipleri();
      loadDepolar();
    }
  }, [fatura, isOpen]);

  const loadFisNoAndSetFormData = async () => {
    setFisNoLoading(true);
    try {
      // En son fiş numarasını al
      const fisResponse = await apiService.getLatestFisNo();
      let nextFisNo = '1';
      
      if (fisResponse.success) {
        nextFisNo = fisResponse.nextFisNo.toString();
      } else {
        console.warn('Fiş numarası alınamadı, varsayılan değer kullanılıyor:', fisResponse.message);
      }

      // Form verilerini ayarla
      setFormData({
        fisNo: nextFisNo,
        faturaNo: fatura?.FATIRS_NO || '',
        tipi: 'Satış Faturası',
        tarih: fatura?.TARIH || '',
        tedarikciKodu: fatura?.CARIKOD || '',
        doviz: 'TRY',
        mteYazdirma: false,
        kur: 1,
        vade: 30, // 30 gün vade
        depo: 'ANA DEPO'
      });
    } catch (error) {
      console.error('Fiş numarası yüklenirken hata:', error);
      // Hata durumunda varsayılan değerler
      setFormData({
        fisNo: '1',
        faturaNo: fatura?.FATIRS_NO || '',
        tipi: 'Satış Faturası',
        tarih: fatura?.TARIH || '',
        tedarikciKodu: fatura?.CARIKOD || '',
        doviz: 'TRY',
        mteYazdirma: false,
        kur: 1,
        vade: 30,
        depo: 'ANA DEPO'
      });
    } finally {
      setFisNoLoading(false);
    }
  };

  const loadFisTipleri = async () => {
    setFisTipleriLoading(true);
    try {
      const response = await apiService.getMalzemeFisTipleri();
      if (response.success) {
        setFisTipleri(response.data);
      } else {
        console.warn('Fiş tipleri alınamadı:', response.message);
        // Varsayılan değerler
        setFisTipleri([
          { MalzemeFisTipID: 1, MalzemeFisTipi: 'Satış Faturası' },
          { MalzemeFisTipID: 2, MalzemeFisTipi: 'Alış Faturası' },
          { MalzemeFisTipID: 3, MalzemeFisTipi: 'İade Faturası' },
          { MalzemeFisTipID: 4, MalzemeFisTipi: 'Proforma Fatura' }
        ]);
      }
    } catch (error) {
      console.error('Fiş tipleri yüklenirken hata:', error);
      // Hata durumunda varsayılan değerler
      setFisTipleri([
        { MalzemeFisTipID: 1, MalzemeFisTipi: 'Satış Faturası' },
        { MalzemeFisTipID: 2, MalzemeFisTipi: 'Alış Faturası' },
        { MalzemeFisTipID: 3, MalzemeFisTipi: 'İade Faturası' },
        { MalzemeFisTipID: 4, MalzemeFisTipi: 'Proforma Fatura' }
      ]);
    } finally {
      setFisTipleriLoading(false);
    }
  };

  const loadDepolar = async () => {
    setDepolarLoading(true);
    try {
      const response = await apiService.getDepolar();
      if (response.success && response.data) {
        setDepolar(response.data);
      } else {
        console.warn('Depo listesi alınamadı:', response.message);
        // Varsayılan değerler
        setDepolar([
          { AdresID: 1, DepoID: 1, Adres: 'Merkez Depo', DepoAdi: 'ANA DEPO', Pasif: 0, OzelKodu1: '', OzelKodu2: '', OzelKodu3: '' },
          { AdresID: 2, DepoID: 2, Adres: 'Yan Depo', DepoAdi: 'YAN DEPO', Pasif: 0, OzelKodu1: '', OzelKodu2: '', OzelKodu3: '' },
          { AdresID: 3, DepoID: 3, Adres: 'Şube Depo', DepoAdi: 'ŞUBE DEPO', Pasif: 0, OzelKodu1: '', OzelKodu2: '', OzelKodu3: '' }
        ]);
      }
    } catch (error) {
      console.error('Depo listesi yüklenirken hata:', error);
      // Hata durumunda varsayılan değerler
      setDepolar([
        { AdresID: 1, DepoID: 1, Adres: 'Merkez Depo', DepoAdi: 'ANA DEPO', Pasif: 0, OzelKodu1: '', OzelKodu2: '', OzelKodu3: '' },
        { AdresID: 2, DepoID: 2, Adres: 'Yan Depo', DepoAdi: 'YAN DEPO', Pasif: 0, OzelKodu1: '', OzelKodu2: '', OzelKodu3: '' },
        { AdresID: 3, DepoID: 3, Adres: 'Şube Depo', DepoAdi: 'ŞUBE DEPO', Pasif: 0, OzelKodu1: '', OzelKodu2: '', OzelKodu3: '' }
      ]);
    } finally {
      setDepolarLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'vade' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simüle edilmiş API çağrısı
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Fatura Detayları
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fiş No */}
              <div>
                <label htmlFor="fisNo" className="block text-sm font-medium text-gray-700 mb-2">
                  Fiş No
                  {fisNoLoading && (
                    <span className="ml-2 text-xs text-blue-600">
                      <svg className="inline animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Yükleniyor...
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  id="fisNo"
                  name="fisNo"
                  value={formData.fisNo}
                  onChange={handleInputChange}
                  disabled={fisNoLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Fatura No */}
              <div>
                <label htmlFor="faturaNo" className="block text-sm font-medium text-gray-700 mb-2">
                  Fatura No
                </label>
                <input
                  type="text"
                  id="faturaNo"
                  name="faturaNo"
                  value={formData.faturaNo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Tipi */}
              <div>
                <label htmlFor="tipi" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipi
                  {fisTipleriLoading && (
                    <span className="ml-2 text-xs text-blue-600">
                      <svg className="inline animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Yükleniyor...
                    </span>
                  )}
                </label>
                <select
                  id="tipi"
                  name="tipi"
                  value={formData.tipi}
                  onChange={handleInputChange}
                  disabled={fisTipleriLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Seçiniz</option>
                  {fisTipleri.map((tip) => (
                    <option key={tip.MalzemeFisTipID} value={tip.MalzemeFisTipi}>
                      {tip.MalzemeFisTipi}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tarih */}
              <div>
                <label htmlFor="tarih" className="block text-sm font-medium text-gray-700 mb-2">
                  Tarih
                </label>
                <input
                  type="date"
                  id="tarih"
                  name="tarih"
                  value={formData.tarih}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Tedarikçi Kodu */}
              <div>
                <label htmlFor="tedarikciKodu" className="block text-sm font-medium text-gray-700 mb-2">
                  Tedarikçi Kodu
                </label>
                <input
                  type="text"
                  id="tedarikciKodu"
                  name="tedarikciKodu"
                  value={formData.tedarikciKodu}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Döviz */}
              <div>
                <label htmlFor="doviz" className="block text-sm font-medium text-gray-700 mb-2">
                  Döviz
                </label>
                <select
                  id="doviz"
                  name="doviz"
                  value={formData.doviz}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="CHF">CHF</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="RUB">RUB</option>
                  <option value="TL">TL</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              {/* MTE Yazdırma */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mteYazdirma"
                  name="mteYazdirma"
                  checked={formData.mteYazdirma}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="mteYazdirma" className="ml-2 block text-sm text-gray-700">
                  MTE Yazdırma
                </label>
              </div>

              {/* Kur */}
              <div>
                <label htmlFor="kur" className="block text-sm font-medium text-gray-700 mb-2">
                  Kur
                </label>
                <input
                  type="number"
                  id="kur"
                  name="kur"
                  value={formData.kur}
                  onChange={handleInputChange}
                  step="0.0001"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Vade */}
              <div>
                <label htmlFor="vade" className="block text-sm font-medium text-gray-700 mb-2">
                  Vade (Gün)
                </label>
                <input
                  type="number"
                  id="vade"
                  name="vade"
                  value={formData.vade}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Depo */}
              <div>
                <label htmlFor="depo" className="block text-sm font-medium text-gray-700 mb-2">
                  Depo
                </label>
                <select
                  id="depo"
                  name="depo"
                  value={formData.depo}
                  onChange={handleInputChange}
                  disabled={depolarLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Seçiniz</option>
                  {depolar.map((depo) => (
                    <option key={depo.AdresID} value={`${depo.DepoAdi} - ${depo.Adres}`}>
                      {depo.DepoAdi} - {depo.Adres}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kaydediliyor...
                  </div>
                ) : (
                  'Kaydet'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FaturaDetailModal;
