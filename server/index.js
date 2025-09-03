const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const config = require('./config');

const app = express();
const PORT = config.apiPort;

// Middleware
app.use(cors());
app.use(express.json());

// Test modu kontrolü
const TEST_MODE = process.env.TEST_MODE === 'true' || false;

// Türkçe karakter düzeltme fonksiyonu
const fixTurkishChars = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  const charMap = {
    'Ý': 'İ', 'ý': 'ı',
    'Þ': 'Ş', 'þ': 'ş',
    'Ð': 'Ğ', 'ð': 'ğ',
    'Ü': 'Ü', 'ü': 'ü',
    'Ö': 'Ö', 'ö': 'ö',
    'Ç': 'Ç', 'ç': 'ç',
    'Ñ': 'N', 'ñ': 'n',
    'Æ': 'AE', 'æ': 'ae',
    'Ø': 'O', 'ø': 'o',
    'Å': 'A', 'å': 'a',
    'Ä': 'A', 'ä': 'a',
    'Ë': 'E', 'ë': 'e',
    'Ï': 'I', 'ï': 'i',
    'Ò': 'O', 'ò': 'o',
    'Ù': 'U', 'ù': 'u',
    'À': 'A', 'à': 'a',
    'È': 'E', 'è': 'e',
    'Ì': 'I', 'ì': 'i',
    'Á': 'A', 'á': 'a',
    'É': 'E', 'é': 'e',
    'Í': 'I', 'í': 'i',
    'Ó': 'O', 'ó': 'o',
    'Ú': 'U', 'ú': 'u',
    'Â': 'A', 'â': 'a',
    'Ê': 'E', 'ê': 'e',
    'Î': 'I', 'î': 'i',
    'Ô': 'O', 'ô': 'o',
    'Û': 'U', 'û': 'u',
    'Ã': 'A', 'ã': 'a',
    'Õ': 'O', 'õ': 'o'
  };
  
  return text.replace(/[ÝýÞþÐðÜüÖöÇçÑñÆæØøÅåÄäËëÏïÒòÙùÀàÈèÌìÓóÚúÂâÊêÎîÔôÛûÃãÕõ]/g, (match) => charMap[match] || match);
};

// Veri temizleme fonksiyonu
const cleanData = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => cleanData(item));
  } else if (data && typeof data === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        cleaned[key] = fixTurkishChars(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  return data;
};

// Mock data
const mockData = [
  {
    CARIKOD: '320 01 004',
    CARI_ISIM: 'YENÝ ÖZGÜVEN MADENCÝLÝK ÝNÞAAT SAN.TÝC.LTD.ÞTÝ.',
    FATIRS_NO: 'FAT001',
    STOK_ADI: 'Test Stok',
    STRA_GCMIK: 10,
    OLCUBR: 'ADET',
    TARIH: '2025-07-15',
    SIPARIS_TARIH: '2025-07-10'
  },
  {
    CARIKOD: '320 01 004',
    CARI_ISIM: 'Test Cari İsim 2',
    FATIRS_NO: 'FAT002',
    STOK_ADI: 'Test Stok 2',
    STRA_GCMIK: 5,
    OLCUBR: 'ADET',
    TARIH: '2025-07-20',
    SIPARIS_TARIH: '2025-07-18'
  }
];

// SQL Server bağlantı havuzu
let poolPromise = null;
let fisPoolPromise = null;

if (!TEST_MODE) {
  // CMK veritabanını kullan (faturalar için)
  const dbConfig = config.databases.cmk;
  
  poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
      console.log(`SQL Server veritabanına başarıyla bağlandı: ${dbConfig.database}@${dbConfig.server}`);
      return pool;
    })
    .catch(err => {
      console.error('Veritabanı bağlantı hatası:', err);
      console.log('Test moduna geçiliyor...');
      return null;
    });

  // SenkronERP Malzeme Fişleri için ayrı bağlantı
  const fisDbConfig = config.databases.senkronFis;
  
  fisPoolPromise = new sql.ConnectionPool(fisDbConfig)
    .connect()
    .then(pool => {
      console.log(`SenkronERP Malzeme Fişleri veritabanına başarıyla bağlandı: ${fisDbConfig.database}@${fisDbConfig.server}`);
      return pool;
    })
    .catch(err => {
      console.error('SenkronERP Malzeme Fişleri bağlantı hatası:', err);
      return null;
    });
} else {
  console.log('Test modu aktif - Mock data kullanılıyor');
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ message: 'API çalışıyor', status: 'OK' });
});

// Veritabanı bağlantı testi
app.get('/api/db-test', async (req, res) => {
  try {
    if (TEST_MODE) {
      return res.json({
        success: true,
        message: 'Test modu aktif - Veritabanı bağlantısı test edilmedi',
        mode: 'test'
      });
    }

    const pool = await poolPromise;
    if (!pool) {
      return res.json({
        success: false,
        message: 'Veritabanı bağlantı havuzu mevcut değil',
        mode: 'error'
      });
    }

    // Basit bir test sorgusu
    const result = await pool.request().query('SELECT 1 as test');
    
    res.json({
      success: true,
      message: 'Veritabanı bağlantısı başarılı',
      mode: 'database',
      testResult: result.recordset[0]
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Veritabanı bağlantı hatası',
      error: error.message,
      mode: 'error'
    });
  }
});

// Malzeme Fiş Tiplerini getir
app.get('/api/malzeme-fis-tipleri', async (req, res) => {
  try {
    if (TEST_MODE) {
      return res.json({
        success: true,
        data: [
          { MalzemeFisTipID: 1, MalzemeFisTipi: 'Satış Faturası' },
          { MalzemeFisTipID: 2, MalzemeFisTipi: 'Alış Faturası' },
          { MalzemeFisTipID: 3, MalzemeFisTipi: 'İade Faturası' },
          { MalzemeFisTipID: 4, MalzemeFisTipi: 'Proforma Fatura' }
        ],
        mode: 'test'
      });
    }

    const fisPool = await fisPoolPromise;
    if (!fisPool) {
      return res.json({
        success: false,
        message: 'SenkronERP Malzeme Fişleri bağlantı havuzu mevcut değil',
        mode: 'error'
      });
    }

    const query = `
      SELECT [MalzemeFisTipID], [MalzemeFisTipi]
      FROM [SenkronERP].[dbo].[MD_MalzemeFisTipleri]
      ORDER BY [MalzemeFisTipi]
    `;

    const result = await fisPool.request().query(query);
    
    res.json({
      success: true,
      data: result.recordset,
      mode: 'database'
    });
  } catch (error) {
    console.error('Malzeme Fiş Tipleri sorgu hatası:', error);
    
    res.json({
      success: false,
      message: 'Malzeme Fiş Tipleri alınırken hata oluştu',
      error: error.message,
      mode: 'error'
    });
  }
});

// Depo listesini getir
app.get('/api/depolar', async (req, res) => {
  try {
    if (TEST_MODE) {
      return res.json({
        success: true,
        data: [
          { AdresID: 1, DepoID: 1, Adres: 'Merkez Depo', DepoAdi: 'ANA DEPO' },
          { AdresID: 2, DepoID: 2, Adres: 'Yan Depo', DepoAdi: 'YAN DEPO' },
          { AdresID: 3, DepoID: 3, Adres: 'Şube Depo', DepoAdi: 'ŞUBE DEPO' }
        ],
        mode: 'test'
      });
    }

    const fisPool = await fisPoolPromise;
    if (!fisPool) {
      return res.json({
        success: false,
        message: 'SenkronERP Malzeme Fişleri bağlantı havuzu mevcut değil',
        mode: 'error'
      });
    }

    const query = `
      SELECT [AdresID], adres.[DepoID], [Adres], adres.[Pasif], adres.[OzelKodu1], adres.[OzelKodu2], adres.[OzelKodu3], DepoAdi
      FROM [SenkronERP].[dbo].[MD_Adresler] as adres
      INNER JOIN [SenkronERP].[dbo].[MD_Depolar] as depo
      ON depo.DepoID = adres.DepoID
      WHERE adres.[Pasif] = 0
      ORDER BY DepoAdi, [Adres]
    `;

    const result = await fisPool.request().query(query);
    
    res.json({
      success: true,
      data: result.recordset,
      mode: 'database'
    });
  } catch (error) {
    console.error('Depo listesi sorgu hatası:', error);
    
    res.json({
      success: false,
      message: 'Depo listesi alınırken hata oluştu',
      error: error.message,
      mode: 'error'
    });
  }
});

// En son fiş numarasını getir
app.get('/api/latest-fis-no', async (req, res) => {
  try {
    if (TEST_MODE) {
      return res.json({
        success: true,
        latestFisNo: 1000,
        nextFisNo: 1001,
        mode: 'test'
      });
    }

    const fisPool = await fisPoolPromise;
    if (!fisPool) {
      return res.json({
        success: false,
        message: 'SenkronERP Malzeme Fişleri bağlantı havuzu mevcut değil',
        mode: 'error'
      });
    }

    // Önce tüm fiş numaralarını alıp JavaScript'te sıralayalım
    const query = `
      SELECT [FisNo]
      FROM [SenkronERP].[dbo].[MD_MalzemeFisleri] 
      WHERE MalzemeFisTurID = 10
        AND [FisNo] IS NOT NULL
        AND [FisNo] != ''
    `;

    const result = await fisPool.request().query(query);
    
    let latestFisNo = 0;
    let nextFisNo = 1;
    
    if (result.recordset.length > 0) {
      // Sayısal olan fiş numaralarını filtrele ve en büyüğünü bul
      const numericFisNos = result.recordset
        .map(row => parseInt(row.FisNo))
        .filter(num => !isNaN(num));
      
      if (numericFisNos.length > 0) {
        latestFisNo = Math.max(...numericFisNos);
        nextFisNo = latestFisNo + 1;
      }
    }
    
    res.json({
      success: true,
      latestFisNo: latestFisNo,
      nextFisNo: nextFisNo,
      mode: 'database'
    });
  } catch (error) {
    console.error('Fiş numarası sorgu hatası:', error);
    
    res.json({
      success: false,
      message: 'Fiş numarası alınırken hata oluştu',
      error: error.message,
      mode: 'error'
    });
  }
});

// Fatura verilerini getir
app.get('/api/faturalar', async (req, res) => {
  try {
    // Test modu kontrolü
    if (TEST_MODE || !poolPromise) {
      console.log('Mock data kullanılıyor');
      return res.json({
        success: true,
        data: cleanData(mockData),
        count: mockData.length,
        mode: 'test'
      });
    }

    const pool = await poolPromise;
    if (!pool) {
      throw new Error('Veritabanı bağlantısı kurulamadı');
    }
    
    const dbConfig = config.databases.cmk;
    const query = `
      SELECT 
        [CARIKOD],
        [CARI_ISIM],
        [FATIRS_NO],
        [STOK_ADI],
        STRA_GCMIK,
        OLCUBR,
        [TARIH],
        TFM.[SIPARIS_TARIH]
      FROM [${dbConfig.database}].[dbo].[TBLEFATMAS] AS TFM
      RIGHT JOIN [${dbConfig.database}].[dbo].[TBLEFATKALEM] AS tfk
        ON TFK.[EFATMASINC] = TFM.[INCKEYNO]
      WHERE 
        FTIRSIP = 2
      ORDER BY [INCKEYNO] DESC
    `;

    const result = await pool.request().query(query);
    
    res.json({
      success: true,
      data: cleanData(result.recordset),
      count: result.recordset.length,
      mode: 'database'
    });
  } catch (error) {
    console.error('Veritabanı sorgu hatası:', error);
    
    // Hata durumunda mock data döndür
    console.log('Hata nedeniyle mock data kullanılıyor');
    res.json({
      success: true,
      data: cleanData(mockData),
      count: mockData.length,
      mode: 'fallback',
      warning: 'Veritabanı bağlantısı kurulamadı, test verileri gösteriliyor'
    });
  }
});

// Filtrelenmiş fatura verilerini getir
app.get('/api/faturalar/filtreli', async (req, res) => {
  try {
    const { 
      carikod = '320 01 004', 
      baslangicTarih = '2025-07-01', 
      bitisTarih = '2025-07-31' 
    } = req.query;

    // Test modu kontrolü
    if (TEST_MODE || !poolPromise) {
      console.log('Mock data kullanılıyor (filtreli)');
      const filteredData = mockData.filter(item => 
        item.CARIKOD === carikod &&
        new Date(item.TARIH) >= new Date(baslangicTarih) &&
        new Date(item.TARIH) <= new Date(bitisTarih)
      );
      
      return res.json({
        success: true,
        data: cleanData(filteredData),
        count: filteredData.length,
        filters: { carikod, baslangicTarih, bitisTarih },
        mode: 'test'
      });
    }

    const pool = await poolPromise;
    if (!pool) {
      throw new Error('Veritabanı bağlantısı kurulamadı');
    }
    
    const dbConfig = config.databases.cmk;
    const query = `
      SELECT 
        [CARIKOD],
        [CARI_ISIM],
        [FATIRS_NO],
        [STOK_ADI],
        STRA_GCMIK,
        OLCUBR,
        [TARIH],
        TFM.[SIPARIS_TARIH]
      FROM [${dbConfig.database}].[dbo].[TBLEFATMAS] AS TFM
      RIGHT JOIN [${dbConfig.database}].[dbo].[TBLEFATKALEM] AS tfk
        ON TFK.[EFATMASINC] = TFM.[INCKEYNO]
      WHERE 
        FTIRSIP = 2
      ORDER BY [INCKEYNO] DESC
    `;

    const result = await pool.request().query(query);
    
    res.json({
      success: true,
      data: cleanData(result.recordset),
      count: result.recordset.length,
      filters: { carikod, baslangicTarih, bitisTarih },
      mode: 'database'
    });
  } catch (error) {
    console.error('Veritabanı sorgu hatası:', error);
    
    // Hata durumunda mock data döndür
    console.log('Hata nedeniyle mock data kullanılıyor (filtreli)');
    const { 
      carikod = '320 01 004', 
      baslangicTarih = '2025-07-01', 
      bitisTarih = '2025-07-31' 
    } = req.query;
    
    const filteredData = mockData.filter(item => 
      item.CARIKOD === carikod &&
      new Date(item.TARIH) >= new Date(baslangicTarih) &&
      new Date(item.TARIH) <= new Date(bitisTarih)
    );
    
    res.json({
      success: true,
      data: cleanData(filteredData),
      count: filteredData.length,
      filters: { carikod, baslangicTarih, bitisTarih },
      mode: 'fallback',
      warning: 'Veritabanı bağlantısı kurulamadı, test verileri gösteriliyor'
    });
  }
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log(`API URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Sunucu kapatılıyor...');
  try {
    const pool = await poolPromise;
    if (pool) {
      await pool.close();
      console.log('CMK veritabanı bağlantısı kapatıldı');
    }
    
    const fisPool = await fisPoolPromise;
    if (fisPool) {
      await fisPool.close();
      console.log('SenkronERP Malzeme Fişleri bağlantısı kapatıldı');
    }
  } catch (error) {
    console.error('Veritabanı bağlantıları kapatılırken hata:', error);
  }
  process.exit(0);
});
