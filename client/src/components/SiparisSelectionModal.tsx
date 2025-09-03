import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { SiparisData } from '../types/siparis';

interface SiparisSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (siparis: SiparisData) => void;
  selectedSiparisler?: SiparisData[];
}

const SiparisSelectionModal: React.FC<SiparisSelectionModalProps> = ({ isOpen, onClose, onSelect, selectedSiparisler = [] }) => {
  const [siparisler, setSiparisler] = useState<SiparisData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSiparis, setSelectedSiparis] = useState<SiparisData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSiparisler();
    }
  }, [isOpen]);

  const loadSiparisler = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getSiparisler();
      if (response.success && response.data) {
        setSiparisler(response.data);
      } else {
        setError(response.message || 'Sipariş listesi alınamadı');
      }
    } catch (error) {
      console.error('Sipariş listesi yüklenirken hata:', error);
      setError('Sipariş listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedSiparis) {
      onSelect(selectedSiparis);
      onClose();
    }
  };

  const filteredSiparisler = siparisler.filter(siparis =>
    siparis.SiparisNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    siparis.MalzemeKodu.toLowerCase().includes(searchTerm.toLowerCase()) ||
    siparis.MalzemeAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    siparis.FirmaAdi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Sipariş Seçimi</h2>
            <p className="text-sm text-gray-600 mt-1">
              Sipariş listesinden bir sipariş seçin
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Sipariş No, Malzeme Kodu, Malzeme Adı veya Firma Adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>



        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Sipariş listesi yükleniyor...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">⚠️</div>
                <p className="text-red-600">{error}</p>
                <button
                  onClick={loadSiparisler}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seç
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sipariş No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Firma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Malzeme Kodu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Malzeme Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Miktar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Birim Fiyat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Termin Tarihi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSiparisler.map((siparis) => (
                    <tr
                      key={siparis.SiparisDetayID}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedSiparis?.SiparisDetayID === siparis.SiparisDetayID ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedSiparis(siparis)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="radio"
                          name="selectedSiparis"
                          checked={selectedSiparis?.SiparisDetayID === siparis.SiparisDetayID}
                          onChange={() => setSelectedSiparis(siparis)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {siparis.SiparisNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(siparis.Tarih)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{siparis.FirmaAdi}</div>
                          <div className="text-xs text-gray-400">{siparis.FirmaKodu}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {siparis.MalzemeKodu}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={siparis.MalzemeAdi}>
                          {siparis.MalzemeAdi}
                        </div>
                        <div className="text-xs text-gray-400">
                          {siparis.MalzemeGrubu} - {siparis.MalzemeCinsi}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{siparis.Miktari.toLocaleString('tr-TR')}</div>
                          <div className="text-xs text-gray-400">{siparis.BirimAdi}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(siparis.BirimFiyati)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(siparis.Tutari)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(siparis.TerminTarihi)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          siparis.SiparisDurumu === 'Aktif' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {siparis.SiparisDurumu}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredSiparisler.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">📋</div>
                  <p className="text-gray-600">Arama kriterlerinize uygun sipariş bulunamadı</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {filteredSiparisler.length} sipariş gösteriliyor
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedSiparis}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Seç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiparisSelectionModal;
