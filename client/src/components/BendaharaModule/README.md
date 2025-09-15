# BendaharaModule

Modul dashboard untuk bendahara pesantren yang mengelola pembayaran dan keuangan.

## Struktur Folder

```
BendaharaModule/
├── components/
│   ├── BendaharaSidebar.tsx    # Sidebar navigasi
│   └── BendaharaHeader.tsx     # Header dengan info user
├── pages/
│   ├── DashboardBendaharaPage.tsx      # Dashboard utama
│   ├── PaymentManagementPage.tsx       # Kelola pembayaran
│   ├── PaymentReportsPage.tsx          # Laporan keuangan
│   └── PaymentSettingsPage.tsx         # Pengaturan
├── templates/
│   └── BendaharaTemplate.tsx   # Layout template
├── types.ts                    # Type definitions
├── BendaharaRoutes.tsx         # Router utama
├── index.ts                    # Export file
└── README.md                   # Dokumentasi
```

## Fitur

### 1. Dashboard Bendahara
- Statistik pembayaran
- Total pendapatan
- Pembayaran terverifikasi
- Pembayaran menunggu verifikasi
- Daftar pembayaran terbaru

### 2. Kelola Pembayaran
- Daftar pembayaran yang menunggu verifikasi
- Verifikasi pembayaran
- Tolak pembayaran dengan alasan
- Lihat detail pembayaran

### 3. Laporan Keuangan
- Filter berdasarkan tanggal
- Export ke CSV
- Statistik pembayaran
- Tabel detail pembayaran

### 4. Pengaturan
- **Profile**: Update informasi profile
- **Kredensial**: Update username dan password
- **Jenis Biaya**: Kelola jenis-jenis biaya
- **Rincian Bank**: Kelola informasi rekening bank

## API Endpoints

### Profile
- `GET /api/bendahara/profile` - Ambil profile bendahara
- `PUT /api/bendahara/profile` - Update profile
- `PUT /api/bendahara/credentials` - Update kredensial

### Pembayaran
- `GET /api/bendahara/pembayaran` - Ambil daftar pembayaran
- `PUT /api/bendahara/pembayaran/verifikasi/:id` - Verifikasi pembayaran
- `POST /api/bendahara/tagihan` - Buat tagihan baru

### Biaya
- `GET /api/bendahara/biaya` - Ambil daftar jenis biaya
- `POST /api/bendahara/biaya` - Tambah jenis biaya

### Rincian Bank
- `PUT /api/bendahara/rincian-pembayaran` - Update rincian bank

## Penggunaan

```tsx
import { BendaharaRoutes } from './components/BendaharaModule';

// Di dalam router
<Route path="/bendahara/*" element={<BendaharaRoutes />} />
```

## Types

```tsx
export type BendaharaPage = 
  | 'dashboard' 
  | 'payment-management' 
  | 'payment-reports' 
  | 'payment-settings';

export interface Pembayaran {
  id: number;
  nama_santri: string;
  jumlah_pembayaran: number;
  bukti_pembayaran: string;
  status: 'MenungguVerifikasi' | 'Diverifikasi' | 'Ditolak';
  dibuat_pada: string;
}
```

## Dependencies

- React
- Lucide React (icons)
- Tailwind CSS (styling)
- Context API (state management)


