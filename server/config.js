module.exports = {
  // İki farklı veritabanı konfigürasyonu
  databases: {
    // Eski veritabanı - CMKKABLO2025
    cmk: {
      server: 'cmk-erp',
      database: 'CMKKABLO2025',
      user: 'sa',
      password: '123',
      port: 1433,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        }
      }
    },
    // Yeni veritabanı - SenkronERP
    senkron: {
      server: 'CMK-PROMETRIK',
      database: 'SenkronERP',
      user: 'sa',
      password: 'Tuana1715',
      port: 1433,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        }
      }
    },
    // SenkronERP - Malzeme Fişleri için
    senkronFis: {
      server: 'CMK-PROMETRIK',
      database: 'SenkronERP',
      user: 'muhendis',
      password: "@R5q@Ou'Rb_K+NA",
      port: 1433,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        }
      }
    }
  },
  // API port
  apiPort: 5000
};
