import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './components/LoginPage'; // Pastikan path benar
import { RegistrationPage } from './components/RegistrationPage'; // Impor halaman registrasi

// Buat komponen placeholder untuk dashboard (atau komponen lain)
const DashboardPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <h1 className="text-3xl font-bold text-gray-800">Selamat Datang di Dashboard!</h1>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      {/* Tambahkan rute lain di sini sesuai kebutuhan aplikasi Anda */}
    </Routes>
  );
}

export default App;
