# Senkron Netsis

React, Tailwind CSS ve Node.js kullanarak Netsis veritabanı entegrasyonu projesi.

## Özellikler

- **Backend API**: Express.js ile SQL Server bağlantısı
- **Frontend**: React + TypeScript + Tailwind CSS
- **Veritabanı**: SQL Server (Netsis)
- **Responsive Design**: Modern ve kullanıcı dostu arayüz
- **Filtreleme**: Tarih aralığı ve cari kod filtreleme
- **İstatistikler**: Toplam tutarlar ve kayıt sayıları

## Kurulum

### 1. Bağımlılıkları Yükle

```bash
# Tüm bağımlılıkları yükle
npm run install-all
```

### 2. Backend Sunucusunu Başlat

```bash
# Server klasörüne git
cd server

# Bağımlılıkları yükle (eğer yapılmadıysa)
npm install

# Normal modda başlat (veritabanı bağlantısı gerekli)
npm run dev

# Test modunda başlat (mock data kullanır)
npm run test
```

Backend API `http://localhost:5000` adresinde çalışacak.

**Not:** Veritabanı bağlantısı kurulamazsa otomatik olarak test moduna geçer.

### 3. Frontend Uygulamasını Başlat

```bash
# Client klasörüne git
cd client

# Bağımlılıkları yükle (eğer yapılmadıysa)
npm install

# Uygulamayı başlat
npm start
```

Frontend uygulaması `http://localhost:3000` adresinde çalışacak.

### 4. Her İkisini Birden Başlat

```bash
# Ana dizinde
npm run dev
```

## Veritabanı Konfigürasyonu

Veritabanı bağlantı bilgileri `server/config.js` dosyasında tanımlanmıştır:

```javascript
module.exports = {
  server: 'cmk-erp',
  database: 'CMKKABLO2025',
  user: 'sa',
  password: '123',
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  port: 5000
};
```

## API Endpoints

### GET /api/health
API sağlık kontrolü

### GET /api/faturalar
Tüm fatura verilerini getirir (varsayılan filtrelerle)

### GET /api/faturalar/filtreli
Filtrelenmiş fatura verilerini getirir

**Query Parameters:**
- `carikod`: Cari kod (varsayılan: '320 01 004')
- `baslangicTarih`: Başlangıç tarihi (varsayılan: '2025-07-01')
- `bitisTarih`: Bitiş tarihi (varsayılan: '2025-07-31')

## Kullanılan Teknolojiler

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **mssql**: SQL Server bağlantı kütüphanesi
- **cors**: Cross-origin resource sharing

### Frontend
- **React**: UI kütüphanesi
- **TypeScript**: Tip güvenli JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client

## Proje Yapısı

```
senkron-netsis/
├── server/                 # Backend API
│   ├── index.js           # Ana server dosyası
│   ├── config.js          # Veritabanı konfigürasyonu
│   └── package.json       # Backend bağımlılıkları
├── client/                # Frontend React uygulaması
│   ├── src/
│   │   ├── components/    # React bileşenleri
│   │   ├── services/      # API servisleri
│   │   ├── types/         # TypeScript tip tanımları
│   │   └── App.tsx        # Ana uygulama bileşeni
│   ├── public/
│   └── package.json       # Frontend bağımlılıkları
├── package.json           # Ana proje dosyası
└── README.md             # Bu dosya
```

## Özellikler

### Filtreleme
- Cari kod ile filtreleme
- Tarih aralığı ile filtreleme
- Gerçek zamanlı filtreleme

### Veri Görüntüleme
- Responsive tablo tasarımı
- Para birimi formatlaması
- Tarih formatlaması
- Sayfalama (gelecekte eklenecek)

### İstatistikler
- Toplam kayıt sayısı
- Benzersiz fatura sayısı
- Genel toplam tutar
- Brüt toplam tutar

### Test Modu
- Veritabanı bağlantısı olmadan çalışma
- Mock data ile test
- Otomatik fallback sistemi
- Veri kaynağı göstergesi

## Geliştirme

### Yeni Özellik Ekleme
1. Backend için yeni endpoint ekleyin (`server/index.js`)
2. Frontend için yeni servis fonksiyonu ekleyin (`client/src/services/api.ts`)
3. Gerekirse yeni tip tanımları ekleyin (`client/src/types/index.ts`)
4. UI bileşenlerini güncelleyin

### Hata Ayıklama
- Backend logları: Terminal çıktısını kontrol edin
- Frontend logları: Browser Developer Tools > Console
- API istekleri: Network sekmesinde kontrol edin

## Lisans

MIT License
