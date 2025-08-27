# AdminModule

Modul ini berisi semua komponen dan halaman untuk dashboard admin.

## Struktur Folder

```
AdminModule/
├── components/
│   ├── AdminSidebar.tsx      # Sidebar navigasi admin
│   └── AdminHeader.tsx       # Header admin
├── pages/
│   ├── DashboardAdminPage.tsx        # Dashboard utama admin
│   ├── TeachersManagementPage.tsx    # Manajemen guru
│   ├── StudentsManagementPage.tsx    # Manajemen santri
│   ├── ClassManagementPage.tsx       # Manajemen kelas
│   ├── AcademicManagementPage.tsx    # Manajemen akademik
│   └── SettingsPage.tsx              # Pengaturan admin
├── templates/
│   └── AdminTemplate.tsx     # Template utama admin
├── AdminRoutes.tsx           # Routing untuk admin
├── index.ts                  # Export semua komponen
└── README.md                 # Dokumentasi ini
```

## Fitur

### 1. Dashboard Admin
- Statistik pembayaran
- Tabel pembayaran dengan filter
- Validasi pembayaran
- Modal detail pembayaran

### 2. Manajemen Guru
- CRUD guru
- Tambah guru baru
- Edit data guru
- Hapus guru

### 3. Manajemen Santri
- Verifikasi pendaftaran santri
- Kelola data santri
- Update NISN
- Hapus santri

### 4. Manajemen Kelas
- Tambah kelas baru
- Tetapkan wali kelas
- Tempatkan santri ke kelas
- Hapus kelas

### 5. Manajemen Akademik
- Kelola mata pelajaran
- Kelola jadwal mengajar
- Assign guru ke jadwal
- Hapus jadwal

### 6. Pengaturan
- Update profil admin
- Ganti password
- Ganti username

## API Endpoints

Modul ini menggunakan API endpoints berikut:

### Guru Management
- `GET /api/admin/guru` - Ambil semua guru
- `POST /api/admin/guru` - Tambah guru baru
- `PUT /api/admin/guru/:id` - Update guru
- `DELETE /api/admin/guru/:id` - Hapus guru

### Santri Management
- `GET /api/admin/santri` - Ambil semua santri
- `GET /api/admin/pendaftaran` - Ambil pendaftaran belum terverifikasi
- `POST /api/admin/verifikasi/:id` - Verifikasi pendaftaran
- `PUT /api/admin/santri/:id/nisn` - Update NISN
- `DELETE /api/admin/santri/:id` - Hapus santri

### Kelas Management
- `GET /api/admin/wali-kelas` - Ambil data wali kelas
- `POST /api/admin/kelas` - Tambah kelas baru
- `PUT /api/admin/kelas/:id/assign-wali` - Tetapkan wali kelas
- `DELETE /api/admin/kelas/:id/unassign-wali` - Lepas wali kelas
- `POST /api/admin/:id/assign-santri` - Tempatkan santri
- `DELETE /api/admin/kelas/:id` - Hapus kelas

### Akademik Management
- `GET /api/admin/akademik/mapel` - Ambil mata pelajaran
- `POST /api/admin/akademik/mapel` - Tambah mata pelajaran
- `DELETE /api/admin/akademik/mapel/:id` - Hapus mata pelajaran
- `GET /api/admin/akademik/jadwal` - Ambil jadwal
- `POST /api/admin/akademik/kelas/:id/mapel/:id/assign-guru` - Assign guru ke jadwal
- `DELETE /api/admin/akademik/jadwal/:id` - Hapus jadwal

### Admin Settings
- `POST /api/admin/change-password` - Ganti password
- `PUT /api/admin/change-username` - Ganti username

## Penggunaan

```tsx
import { AdminRoutes } from './components/AdminModule';

// Di dalam App.tsx
<Route
  path="/admin/*"
  element={
    <ProtectedRoute isAllowed={isLoggedIn && user?.peran === "Admin"}>
      <AdminRoutes />
    </ProtectedRoute>
  }
/>
```

## Context

Modul ini menggunakan beberapa context:

- `AuthContext` - Untuk data user dan autentikasi
- `PaymentDataContext` - Untuk data pembayaran (dashboard)

## Styling

Menggunakan Tailwind CSS dengan komponen yang sudah didesain dengan:
- Rounded corners (rounded-xl, rounded-3xl)
- Shadow effects (shadow-xl, shadow-2xl)
- Gradient backgrounds
- Hover effects
- Responsive design

## Dependencies

- React Router DOM
- Axios
- React Toastify
- Lucide React (icons)
- Tailwind CSS
