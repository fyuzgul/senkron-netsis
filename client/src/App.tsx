import React, { useState, useEffect } from 'react';
import { FaturaData, FilterParams } from './types';
import { apiService } from './services/api';
import FilterForm from './components/FilterForm';
import FaturaTable from './components/FaturaTable';
import StatsCard from './components/StatsCard';
import FaturaDetailModal from './components/FaturaDetailModal';

function App() {
  const [allData, setAllData] = useState<FaturaData[]>([]);
  const [filteredData, setFilteredData] = useState<FaturaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [dataMode, setDataMode] = useState<'database' | 'test' | 'fallback' | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterParams>({
    carikod: '',
    baslangicTarih: '',
    bitisTarih: '',
  });
  const [selectedFatura, setSelectedFatura] = useState<FaturaData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // API sağlık kontrolü
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        await apiService.healthCheck();
        setApiStatus('online');
      } catch (error) {
        console.error('API sağlık kontrolü başarısız:', error);
        setApiStatus('offline');
      }
    };

    checkApiHealth();
  }, []);

  // Sayfa yüklendiğinde varsayılan verileri getir
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtreleme fonksiyonu
  const applyFilters = (data: FaturaData[], filters: FilterParams) => {
    return data.filter(item => {
      const carikodMatch = !filters.carikod || item.CARIKOD === filters.carikod;
      const tarihMatch = !filters.baslangicTarih || !filters.bitisTarih || 
        (new Date(item.TARIH) >= new Date(filters.baslangicTarih) && 
         new Date(item.TARIH) <= new Date(filters.bitisTarih));
      
      return carikodMatch && tarihMatch;
    });
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    setWarning(null);
    
    try {
      const response = await apiService.getFaturalar();
      if (response.success) {
        setAllData(response.data);
        const filtered = applyFilters(response.data, currentFilters);
        setFilteredData(filtered);
        setDataMode(response.mode || 'database');
        if (response.warning) {
          setWarning(response.warning);
        }
      } else {
        setError(response.error || 'Veri yüklenirken hata oluştu');
      }
    } catch (err) {
      setError('API bağlantısı kurulamadı. Lütfen sunucunun çalıştığından emin olun.');
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (params: FilterParams) => {
    setCurrentFilters(params);
    const filtered = applyFilters(allData, params);
    setFilteredData(filtered);
  };

  const handleRowClick = (fatura: FaturaData) => {
    setSelectedFatura(fatura);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFatura(null);
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'online':
        return 'API Bağlantısı Aktif';
      case 'offline':
        return 'API Bağlantısı Kesik';
      default:
        return 'API Bağlantısı Kontrol Ediliyor...';
    }
  };

  const getDataModeText = () => {
    switch (dataMode) {
      case 'database':
        return 'Veritabanı Verisi';
      case 'test':
        return 'Test Verisi';
      case 'fallback':
        return 'Yedek Veri';
      default:
        return '';
    }
  };

  const getDataModeColor = () => {
    switch (dataMode) {
      case 'database':
        return 'text-green-600 bg-green-100';
      case 'test':
        return 'text-blue-600 bg-blue-100';
      case 'fallback':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Senkron Netsis</h1>
              <p className="mt-1 text-sm text-gray-500">
                Netsis veritabanı entegrasyonu ve fatura yönetimi
              </p>
            </div>
            <div className="flex space-x-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${apiStatus === 'online' ? 'bg-green-400' : apiStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'}`}></div>
                {getStatusText()}
              </div>
              {dataMode && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDataModeColor()}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${dataMode === 'database' ? 'bg-green-400' : dataMode === 'test' ? 'bg-blue-400' : 'bg-yellow-400'}`}></div>
                  {getDataModeText()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Warning Banner */}
          {warning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Uyarı</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>{warning}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Form */}
          <FilterForm onFilter={handleFilter} loading={loading} initialFilters={currentFilters} />

          {/* Stats Cards */}
          <StatsCard data={filteredData} loading={loading} />

          {/* Data Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Fatura Verileri</h2>
              <p className="mt-1 text-sm text-gray-500">
                {loading ? 'Veriler yükleniyor...' : `${filteredData.length} kayıt bulundu (Toplam: ${allData.length})`}
              </p>
            </div>
            <div className="p-6">
              <FaturaTable 
                data={filteredData} 
                loading={loading} 
                error={error || undefined} 
                onRowClick={handleRowClick}
              />
            </div>
          </div>

          {/* Refresh Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={loadInitialData}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Yenileniyor...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Verileri Yenile
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2025 Senkron Netsis. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>

      {/* Fatura Detail Modal */}
      <FaturaDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        fatura={selectedFatura}
      />
    </div>
  );
}

export default App;
