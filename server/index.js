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

// Sipariş listesini getir
app.get('/api/siparisler', async (req, res) => {
  try {
    if (TEST_MODE) {
      return res.json({
        success: true,
        data: [
          {
            Sec: false,
            SiparisID: 1,
            SiparisNo: 'SIP2025001',
            Tarih: '2025-01-15',
            FirmaID: 1,
            PersonelID: 1,
            SiparisDurumID: 1,
            OdemeSartlari: '30 Gün',
            Tasima: 'Kargo',
            TeslimYeri: 'Merkez Depo',
            Aciklama: 'Test Siparişi',
            Personel: 'Ahmet Yılmaz',
            FirmaAdi: 'Test Firma',
            FirmaKodu: 'TF001',
            SiparisDurumu: 'Aktif',
            SiparisDetayID: 1,
            MalzemeID: 1,
            BirimID: 1,
            Miktari: 100,
            BirimFiyati: 25.50,
            Doviz: 'TRY',
            TerminTarihi: '2025-02-15',
            TerminHaftasi: 7,
            SiparisDetayAciklama: 'Test Detay',
            BirimAdi: 'Adet',
            MalzemeKodu: 'MAL001',
            MalzemeAdi: 'Test Malzeme',
            TestYontemStandarti: 'TS EN 123',
            IlkGelisTarihi: null,
            IptalMiktari: 0,
            IadeMiktari: 0,
            GelenMiktar: 0,
            KalanMiktar: 100,
            Gecikme: 0,
            MalzemeGrubu: 'Elektrik',
            MalzemeCinsi: 'Kablo',
            MalzemeTuru: 'Güç Kablosu',
            KDVOran: 20,
            KDVTutar: 510,
            KDVliTutar: 3060,
            TesisKodu: 'TES001',
            TesisAdi: 'Ana Tesis',
            Ambalaj: 'Kutu',
            OdemeSekli: 'Havale',
            VadeGunu: 30,
            MalzemeOlculeri: '2.5mm²',
            MalzemeOzelKodu1: 'OZ001',
            MalzemeOzelKodu2: 'OZ002',
            UreticiKodu: 'UR001',
            IlkGecikme: 0,
            LME: 0,
            Premium: 0,
            TalepNo: 'TAL001',
            SozlesmeBirimFiyati: 25.50,
            SozLMEDonemAciklama: '',
            DosyaVarMi: false,
            TeklifNo: 'TEK001',
            AmbalajNo: 'AMB001',
            TalepTerminTarihi: '2025-02-10',
            TalepEden: 'Mehmet Demir',
            BirimUzunluk: 1,
            Uzunluk: 100,
            KapamaDurumu: false,
            SiparisOzelKodu1: 'SIP001',
            SiparisOzelKodu2: 'SIP002',
            MalzemeTedarikciKodu: 'TED001',
            MalzemeTedarikciAdi: 'Test Tedarikçi',
            Tutari: 2550,
            GKTestVarMi: false,
            TalepKaynagi: 'İç Talep',
            TalepMasrafAciklamasi: 'Test Masraf',
            Iskonto: 0,
            IskontoTutar: 0,
            SiparisBakiyeTutari: 2550,
            NumuneID: null,
            NumuneFormNo: null,
            Departman: 'Satın Alma',
            TerminTarihiGunFarki: 0,
            TerminAciklamasi: '',
            Marka: 'Test Marka',
            PozNo: 'POZ001',
            IlkTerminTarihi: '2025-02-15',
            TalepEdenDepartman: 'Üretim',
            SevkSekli: 'Kargo',
            TalepNedeni: 'Stok Eksikliği',
            BirimMiktari: 1,
            Adedi: 100,
            Kesit: '2.5mm²',
            Tip: 'NYA',
            ListeFiyati: 25.50,
            SiraNo: 1,
            GTIPNo: '85444200',
            SatisSiparisNo: 'SS001',
            Metin10: '',
            SonHareketTarihi: '2025-01-15'
          }
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
      SELECT   
        CAST(0 AS BIT) AS Sec,  
        dbo.SA_Siparisler.SiparisID, 
        dbo.SA_Siparisler.SiparisNo, 
        dbo.SA_Siparisler.Tarih, 
        dbo.SA_Siparisler.FirmaID, 
        dbo.SA_Siparisler.PersonelID, 
        dbo.SA_Siparisler.SiparisDurumID, 
        dbo.SA_Siparisler.OdemeSartlari, 
        dbo.SA_Siparisler.Tasima, 
        dbo.SA_Siparisler.TeslimYeri, 
        dbo.SA_Siparisler.Aciklama, 
        dbo.IK_Personeller.Adi + ' ' + dbo.IK_Personeller.Soyadi AS Personel, 
        dbo.FN_Firmalar.FirmaAdi, 
        dbo.FN_Firmalar.FirmaKodu, 
        dbo.SA_SiparisDurumlari.SiparisDurumu,
        dbo.SA_SiparisDetay.SiparisDetayID, 
        dbo.SA_SiparisDetay.SiparisID, 
        dbo.SA_SiparisDetay.MalzemeID, 
        dbo.SA_SiparisDetay.BirimID, 
        dbo.SA_SiparisDetay.Miktari, 
        dbo.SA_SiparisDetay.BirimFiyati, 
        dbo.SA_Siparisler.Doviz, 
        dbo.SA_SiparisDetay.TerminTarihi,
        DATEPART( wk, dbo.SA_SiparisDetay.TerminTarihi) AS TerminHaftasi,
        dbo.SA_SiparisDetay.Aciklama AS SiparisDetayAciklama, 
        dbo.SA_SiparisDetay.OzelKodu1, 
        dbo.SA_SiparisDetay.OzelKodu2, 
        dbo.SA_SiparisDetay.OzelKodu3, 
        dbo.SA_SiparisDetay.OzelKodu4, 
        dbo.SA_SiparisDetay.OzelKodu5, 
        dbo.MD_Birimler.BirimAdi, 
        dbo.MD_Malzemeler.MalzemeKodu, 
        dbo.MD_Malzemeler.MalzemeAdi,
        dbo.MD_Malzemeler.TestYontemStandarti,
        SM.IlkGelisTarihi,
        dbo.SA_SiparisDetay.IptalMiktari,
        dbo.SA_SiparisDetay.IadeMiktari,
        dbo.SA_SiparisDetay.GelenMiktar,
        dbo.SA_SiparisDetay.KalanMiktar,
        CASE 
          WHEN dbo.SA_SiparisDetay.KalanMiktar <= 0.001 THEN 
          ISNULL(DATEDIFF(day,SA_SiparisDetay.TerminTarihi,SM.SonGelisTarihi),0)
          ELSE datediff( day, dbo.SA_SiparisDetay.TerminTarihi, GETDATE())
        END AS Gecikme,
        dbo.MD_MalzemeGruplari.MalzemeGrubu,
        dbo.MD_Malzemeler.MalzemeCinsi,
        dbo.MD_MalzemeTurleri.MalzemeTuru,
        isnull(SA_SiparisDetay.KDVOran, isnull(MD_Malzemeler.KDVOrani,0)) as KDVOran,
        (dbo.SA_SiparisDetay.BirimFiyati*dbo.SA_SiparisDetay.Miktari)*(isnull(SA_SiparisDetay.KDVOran, isnull(MD_Malzemeler.KDVOrani,0)) /cast(100 as decimal)) as KDVTutar,
        (dbo.SA_SiparisDetay.BirimFiyati*dbo.SA_SiparisDetay.Miktari)*(1+isnull(SA_SiparisDetay.KDVOran, isnull(MD_Malzemeler.KDVOrani,0)) /cast(100 as decimal)) as KDVliTutar,
        dbo.MD_Tesisler.TesisKodu,
        dbo.MD_Tesisler.TesisAdi,
        dbo.SA_SiparisDetay.Ambalaj,
        dbo.SA_Siparisler.OdemeSekli,
        dbo.SA_Siparisler.VadeGunu,
        dbo.MD_Malzemeler.MalzemeOlculeri,
        dbo.MD_Malzemeler.OzelKodu1 as MalzemeOzelKodu1,
        dbo.MD_Malzemeler.OzelKodu2 as MalzemeOzelKodu2,
        dbo.MD_Malzemeler.UreticiKodu,
        DateDiff( day , dbo.SA_SiparisDetay.TerminTarihi , SM.IlkGelisTarihi ) AS IlkGecikme,
        dbo.SA_Siparisler.LME,
        dbo.MD_Malzemeler.Premium,
        SA_Talepler.TalepNo,
        SA_SozlesmeDetay.BirimFiyati AS SozlesmeBirimFiyati,
        SA_Sozlesmeler.LMEDonemAciklama AS SozLMEDonemAciklama,
        ISNULL(Dosya.DosyaVarMi,0) as DosyaVarMi,
        SA_Teklifler.TeklifNo,
        MD_Ambalajlar.AmbalajNo,
        SA_TalepDetay.TerminTarihi as TalepTerminTarihi,
        TalepEdenPersonel.Adi + ' ' + TalepEdenPersonel.Soyadi as TalepEden,
        ISNULL(MD_Malzemeler.BirimUzunluk,0) as BirimUzunluk,
        CAST(ISNULL(MD_Malzemeler.BirimUzunluk,0)  * SA_SiparisDetay.Miktari AS DECIMAL(18,2)) AS Uzunluk ,
        CASE WHEN BakiyeKontrol.SiparisSevkBakiyeToplam = 0 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS KapamaDurumu,
        SA_Siparisler.OzelKodu1 AS SiparisOzelKodu1,
        SA_Siparisler.OzelKodu2 AS SiparisOzelKodu2,
        EAN.TedarikciKodu AS MalzemeTedarikciKodu,
        EAN.TedarikciAdi AS MalzemeTedarikciAdi,
        (dbo.SA_SiparisDetay.BirimFiyati*dbo.SA_SiparisDetay.Miktari) as Tutari,
        CAST(ISNULL(Testler.TestVarMi,0) AS BIT) AS GKTestVarMi,
        ISNULL(SA_TalepDetay.TalepKaynagi,'') AS TalepKaynagi,
        ISNULL(SA_TalepDetay.TalepMasrafAciklamasi,'') AS TalepMasrafAciklamasi,
        ISNULL(SA_SiparisDetay.Iskonto,0) AS Iskonto,
        (dbo.SA_SiparisDetay.Miktari * dbo.SA_SiparisDetay.ListeFiyati * SA_SiparisDetay.Iskonto / 100) AS IskontoTutar,
        (SA_SiparisDetay.KalanMiktar*SA_SiparisDetay.BirimFiyati) As SiparisBakiyeTutari,
        dbo.UR_Numune.NumuneID,
        dbo.UR_Numune.NumuneFormNo,
        dbo.IK_Departmanlar.Departman,
        dbo.SA_SiparisDetay.TerminTarihiGunFarki,
        dbo.SA_SiparisDetay.TerminAciklamasi,
        MD_Malzemeler.Marka,
        SA_SiparisDetay.PozNo,
        SA_SiparisDetay.IlkTerminTarihi,
        TalepEdenPersonelDepartman.Departman As TalepEdenDepartman,
        SA_Siparisler.SevkSekli,
        dbo.SA_TalepDetay.TalepNedeni,
        dbo.SA_SiparisDetay.BirimMiktari,
        dbo.SA_SiparisDetay.Adedi,
        dbo.MD_Malzemeler.Kesit,
        dbo.MD_Malzemeler.Tip,
        SA_SiparisDetay.ListeFiyati,
        dbo.SA_SiparisDetay.SiraNo,
        MD_Malzemeler.GTIPNo,
        SA_Siparisler.OdemeSartlari,
        PS_Siparisler.SiparisNo AS SatisSiparisNo,
        MD_Malzemeler.Metin10,
        MD_Malzemeler.SonHareketTarihi
      FROM dbo.SA_SiparisDetay 
        INNER JOIN dbo.MD_Malzemeler ON dbo.SA_SiparisDetay.MalzemeID = dbo.MD_Malzemeler.MalzemeID 
        INNER JOIN dbo.MD_MalzemeGruplari ON dbo.MD_Malzemeler.MalzemeGrupID = dbo.MD_MalzemeGruplari.MalzemeGrupID
        INNER JOIN dbo.MD_MalzemeTurleri ON dbo.MD_Malzemeler.MalzemeTurID = dbo.MD_MalzemeTurleri.MalzemeTurID
        INNER JOIN dbo.MD_Birimler ON dbo.SA_SiparisDetay.BirimID = dbo.MD_Birimler.BirimID
        INNER JOIN dbo.SA_Siparisler ON dbo.SA_Siparisler.SiparisID = dbo.SA_SiparisDetay.SiparisID
        INNER JOIN dbo.SA_SiparisTurleri ON dbo.SA_Siparisler.SiparisTurID = dbo.SA_SiparisTurleri.SiparisTurID
        INNER JOIN dbo.SA_SiparisDurumlari ON dbo.SA_Siparisler.SiparisDurumID = dbo.SA_SiparisDurumlari.SiparisDurumID
        INNER JOIN dbo.FN_Firmalar ON dbo.SA_Siparisler.FirmaID = dbo.FN_Firmalar.FirmaID
        LEFT OUTER JOIN dbo.IK_Personeller ON dbo.SA_Siparisler.PersonelID = dbo.IK_Personeller.PersonelID 	 	
        LEFT OUTER JOIN SA_TalepDetay ON SA_TalepDetay.SA_SiparisDetayID = SA_SiparisDetay.SiparisDetayID
        LEFT OUTER JOIN SA_Talepler ON SA_Talepler.TalepID = SA_TalepDetay.TalepID
        LEFT OUTER JOIN SA_SozlesmeDetay ON SA_SozlesmeDetay.SozlesmeDetayID = SA_SiparisDetay.SozlesmeDetayID
        LEFT OUTER JOIN SA_Sozlesmeler ON SA_Sozlesmeler.SozlesmeID = SA_SozlesmeDetay.SozlesmeID
        LEFT OUTER JOIN dbo.IK_Personeller TalepEdenPersonel ON dbo.SA_Talepler.PersonelID = TalepEdenPersonel.PersonelID 
        OUTER APPLY fMD_MalzemeTedarikciEANKodu(MD_Malzemeler.MalzemeID,SA_Siparisler.FirmaID,0,0) AS EAN
        LEFT OUTER JOIN (
          SELECT     
            dbo.MD_MalzemeFisDetay.SA_SiparisDetayID, 
            MIN(dbo.MD_MalzemeFisleri.Tarih) as IlkGelisTarihi,
            MAX(dbo.MD_Malzemefisleri.Tarih) AS  SonGelisTarihi
          FROM dbo.MD_MalzemeFisDetay 
            INNER JOIN dbo.MD_MalzemeFisleri ON  dbo.MD_MalzemeFisDetay.FisID=dbo.MD_MalzemeFisleri.FisID
          WHERE dbo.MD_MalzemeFisleri.GirisCikis = 1 
            AND dbo.MD_MalzemeFisDetay.SA_SiparisDetayID IS NOT NULL
          GROUP BY dbo.MD_MalzemeFisDetay.SA_SiparisDetayID
        ) AS SM ON SM.SA_SiparisDetayID = dbo.SA_SiparisDetay.SiparisDetayID
        LEFT OUTER JOIN dbo.MD_Tesisler ON dbo.MD_Tesisler.TesisID = dbo.SA_Siparisler.TesisID
        LEFT OUTER JOIN (
          SELECT ID,
            CAST(CASE WHEN MAX(DosyaID) > 0 THEN 1 ELSE 0 END AS BIT) AS DosyaVarMi
          FROM KE_Dosyalar
          WHERE Tablo = 'SA_Siparisler'
          GROUP BY ID
        ) Dosya ON Dosya.ID = SA_Siparisler.SiparisID
        LEFT OUTER JOIN SA_Teklifler ON SA_Teklifler.TeklifID = SA_Siparisler.TeklifID
        LEFT OUTER JOIN MD_Ambalajlar ON MD_Ambalajlar.AmbalajID = SA_SiparisDetay.AmbalajID
        LEFT OUTER JOIN (
          SELECT
            SA_SiparisDetay.SiparisID,
            SUM(CASE WHEN (SA_SiparisDetay.Miktari -  ISNULL(SA_SiparisDetay.IptalMiktari,0) + ISNULL(SA_SiparisDetay.IadeMiktari,0)) <= 0 THEN 0
              ELSE SA_SiparisDetay.Miktari -  ISNULL(SA_SiparisDetay.IptalMiktari,0) + ISNULL(SA_SiparisDetay.IadeMiktari,0)
            END) AS SiparisSevkBakiyeToplam
          FROM SA_SiparisDetay
          GROUP BY SA_SiparisDetay.SiparisID
        ) AS BakiyeKontrol ON BakiyeKontrol.SiparisID  = SA_Siparisler.SiparisID
        LEFT OUTER JOIN (
          SELECT KY_MalzemeTestleri.MalzemeID,
            CASE WHEN COUNT(KY_MalzemeTestleri.MalzemeTestID) > 0 THEN 1 ELSE 0 END AS TestVarmi
          FROM KY_MalzemeTestleri 
            INNER JOIN dbo.KY_Testler ON dbo.KY_MalzemeTestleri.TestID = dbo.KY_Testler.TestID
          WHERE (dbo.KY_MalzemeTestleri.TestTurID = 1) 
          GROUP BY KY_MalzemeTestleri.MalzemeID
        ) AS Testler ON Testler.MalzemeID =  MD_Malzemeler.MalzemeID	
        LEFT OUTER JOIN dbo.UR_Numune ON UR_Numune.NumuneID=dbo.SA_SiparisDetay.NumuneID
        LEFT OUTER JOIN dbo.IK_Departmanlar ON IK_Departmanlar.DepartmanID = SA_Siparisler.DepartmanID
        LEFT JOIN dbo.IK_Departmanlar TalepEdenPersonelDepartman ON TalepEdenPersonelDepartman.DepartmanID = TalepEdenPersonel.DepartmanID
        LEFT JOIN PS_Siparisler ON PS_Siparisler.SiparisID=SA_Siparisler.PS_SiparisID
      WHERE dbo.SA_Siparisler.SiparisDurumID NOT IN (90,99) AND (ISNULL(SA_SiparisDetay.Miktari,0) - ISNULL(SA_SiparisDetay.GelenMiktar,0)) - ISNULL(IptalMiktari,0) + ISNULL(IadeMiktari,0) > 0
      ORDER BY dbo.SA_Siparisler.SiparisNo
    `;

    const result = await fisPool.request().query(query);
    
    res.json({
      success: true,
      data: result.recordset,
      mode: 'database'
    });
  } catch (error) {
    console.error('Sipariş listesi sorgu hatası:', error);
    
    res.json({
      success: false,
      message: 'Sipariş listesi alınırken hata oluştu',
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
