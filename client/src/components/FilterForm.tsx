import React, { useState } from 'react';
import { FilterParams } from '../types';

interface FilterFormProps {
  onFilter: (params: FilterParams) => void;
  loading: boolean;
  initialFilters?: FilterParams;
}

const FilterForm: React.FC<FilterFormProps> = ({ onFilter, loading, initialFilters }) => {
  const [filters, setFilters] = useState<FilterParams>(
    initialFilters || {
      carikod: '320 01 004',
      baslangicTarih: '2025-07-01',
      bitisTarih: '2025-07-31',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleInputChange = (field: keyof FilterParams, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetFilters = () => {
    const defaultFilters = {
      carikod: '',
      baslangicTarih: '',
      bitisTarih: '',
    };
    setFilters(defaultFilters);
    onFilter(defaultFilters);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Filtreler</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="carikod" className="block text-sm font-medium text-gray-700 mb-1">
              Cari Kod
            </label>
            <input
              type="text"
              id="carikod"
              value={filters.carikod}
              onChange={(e) => handleInputChange('carikod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Tüm cari kodlar (boş bırakın)"
            />
          </div>
          
          <div>
            <label htmlFor="baslangicTarih" className="block text-sm font-medium text-gray-700 mb-1">
              Başlangıç Tarihi (Opsiyonel)
            </label>
            <input
              type="date"
              id="baslangicTarih"
              value={filters.baslangicTarih}
              onChange={(e) => handleInputChange('baslangicTarih', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="bitisTarih" className="block text-sm font-medium text-gray-700 mb-1">
              Bitiş Tarihi (Opsiyonel)
            </label>
            <input
              type="date"
              id="bitisTarih"
              value={filters.bitisTarih}
              onChange={(e) => handleInputChange('bitisTarih', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Yükleniyor...
              </>
            ) : (
              'Filtrele'
            )}
          </button>
          
          <button
            type="button"
            onClick={resetFilters}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sıfırla
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilterForm;
