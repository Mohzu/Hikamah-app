import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, UserCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

// Helper components
const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <h2 className="text-xl font-bold text-gray-800 border-b-2 border-teal-500 pb-2 mb-4">{title}</h2>
);

const InputField: React.FC<{ label: string; name: string; value: string; onChange: any; placeholder?: string; type?: string; required?: boolean }> = 
({ label, name, value, onChange, placeholder, type = 'text', required = true }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
    />
  </div>
);

export function RegistrationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Santri
    noInduk: '',
    namaLengkap: '',
    tempatLahirSantri: '',
    tanggalLahirSantri: '',
    jenisKelamin: '',
    anakKe: '',
    dariBersaudara: '',
    agama: 'Islam',
    alamatSantri: '',
    // Ayah
    namaAyah: '',
    tempatLahirAyah: '',
    tanggalLahirAyah: '',
    pekerjaanAyah: '',
    pendidikanAyah: '',
    alamatAyah: '',
    noHpAyah: '',
    // Ibu
    namaIbu: '',
    tempatLahirIbu: '',
    tanggalLahirIbu: '',
    pekerjaanIbu: '',
    pendidikanIbu: '',
    alamatIbu: '',
    noHpIbu: '',
    // Akun Wali
    emailWali: '',
    hubunganWali: 'Ayah',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
        // Data Santri
        nomor_induk: formData.noInduk,
        nama_santri: formData.namaLengkap,
        tempat_lahir_santri: formData.tempatLahirSantri,
        tanggal_lahir_santri: formData.tanggalLahirSantri,
        jenis_kelamin: formData.jenisKelamin,
        anak_ke: parseInt(formData.anakKe, 10) || 0,
        dari_bersaudara: parseInt(formData.dariBersaudara, 10) || 0,
        agama: formData.agama,
        alamat_santri: formData.alamatSantri,
        
        // Data Ayah
        nama_ayah: formData.namaAyah,
        tempat_lahir_ayah: formData.tempatLahirAyah,
        tanggal_lahir_ayah: formData.tanggalLahirAyah,
        pekerjaan_ayah: formData.pekerjaanAyah,
        pendidikan_ayah: formData.pendidikanAyah,
        alamat_ayah: formData.alamatAyah,
        nomor_hp_ayah: formData.noHpAyah,

        // Data Ibu
        nama_ibu: formData.namaIbu,
        tempat_lahir_ibu: formData.tempatLahirIbu,
        tanggal_lahir_ibu: formData.tanggalLahirIbu,
        pekerjaan_ibu: formData.pekerjaanIbu,
        pendidikan_ibu: formData.pendidikanIbu,
        alamat_ibu: formData.alamatIbu,
        nomor_hp_ibu: formData.noHpIbu,

        // Data Akun Wali (tanpa kata sandi)
        email_wali: formData.emailWali,
        hubungan_wali: formData.hubunganWali
    };

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, dataToSubmit);
      if (response.status === 201) {
        toast.success('Pendaftaran berhasil! Data Anda akan segera diverifikasi oleh admin.');
        navigate('/auth/login');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data?.error || 'Pendaftaran gagal. Silakan coba lagi.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <div className="mb-8 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Formulir Pendaftaran Santri Baru</h1>
            <p className="text-gray-600">Silakan isi data dengan lengkap dan benar.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Data Santri */}
            <div>
              <SectionTitle title="A. Data Calon Santri" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="No. Induk" name="noInduk" value={formData.noInduk} onChange={handleChange} placeholder="Nomor Induk Santri (13 Digit)" />
                <InputField label="Nama Lengkap" name="namaLengkap" value={formData.namaLengkap} onChange={handleChange} placeholder="Nama Lengkap Santri" />
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Tempat Lahir" name="tempatLahirSantri" value={formData.tempatLahirSantri} onChange={handleChange} placeholder="Kota Kelahiran"/>
                    <InputField label="Tanggal Lahir" name="tanggalLahirSantri" value={formData.tanggalLahirSantri} onChange={handleChange} type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input type="radio" name="jenisKelamin" value="L" checked={formData.jenisKelamin === 'L'} onChange={handleChange} className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300"/>
                      <span className="ml-2 text-gray-700">Laki-laki</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="jenisKelamin" value="P" checked={formData.jenisKelamin === 'P'} onChange={handleChange} className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300"/>
                      <span className="ml-2 text-gray-700">Perempuan</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Anak Ke" name="anakKe" value={formData.anakKe} onChange={handleChange} placeholder="Contoh: 1" type="number"/>
                    <InputField label="Dari Bersaudara" name="dariBersaudara" value={formData.dariBersaudara} onChange={handleChange} placeholder="Contoh: 3" type="number"/>
                </div>
                <div>
                  <label htmlFor="agama" className="block text-sm font-medium text-gray-700 mb-1">Agama</label>
                  <select id="agama" name="agama" value={formData.agama} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500">
                    <option>Islam</option>
                    <option>Kristen</option>
                    <option>Katolik</option>
                    <option>Hindu</option>
                    <option>Buddha</option>
                    <option>Khonghucu</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="alamatSantri" className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                    <textarea id="alamatSantri" name="alamatSantri" value={formData.alamatSantri} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" placeholder="Alamat lengkap santri"></textarea>
                </div>
              </div>
            </div>

            {/* Data Orang Tua / Wali Santri */}
            <div>
              <SectionTitle title="B. Data Orang Tua / Wali Santri" />
              <div className="space-y-6">
                {/* Ayah */}
                <div className="p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2 text-gray-700">Data Ayah</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Nama Ayah" name="namaAyah" value={formData.namaAyah} onChange={handleChange} placeholder="Nama Lengkap Ayah" />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Tempat Lahir" name="tempatLahirAyah" value={formData.tempatLahirAyah} onChange={handleChange} placeholder="Kota Kelahiran"/>
                        <InputField label="Tanggal Lahir" name="tanggalLahirAyah" value={formData.tanggalLahirAyah} onChange={handleChange} type="date" />
                    </div>
                    <InputField label="Pekerjaan" name="pekerjaanAyah" value={formData.pekerjaanAyah} onChange={handleChange} placeholder="Pekerjaan Ayah" />
                    <InputField label="Pendidikan Terakhir" name="pendidikanAyah" value={formData.pendidikanAyah} onChange={handleChange} placeholder="Pendidikan Terakhir Ayah" />
                    <div className="md:col-span-2">
                        <label htmlFor="alamatAyah" className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                        <textarea id="alamatAyah" name="alamatAyah" value={formData.alamatAyah} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" placeholder="Alamat lengkap ayah"></textarea>
                    </div>
                    <InputField label="No. HP/WA" name="noHpAyah" value={formData.noHpAyah} onChange={handleChange} placeholder="Nomor HP/WA Ayah" />
                  </div>
                </div>
                {/* Ibu */}
                <div className="p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2 text-gray-700">Data Ibu</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Nama Ibu" name="namaIbu" value={formData.namaIbu} onChange={handleChange} placeholder="Nama Lengkap Ibu" />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Tempat Lahir" name="tempatLahirIbu" value={formData.tempatLahirIbu} onChange={handleChange} placeholder="Kota Kelahiran"/>
                        <InputField label="Tanggal Lahir" name="tanggalLahirIbu" value={formData.tanggalLahirIbu} onChange={handleChange} type="date" />
                    </div>
                    <InputField label="Pekerjaan" name="pekerjaanIbu" value={formData.pekerjaanIbu} onChange={handleChange} placeholder="Pekerjaan Ibu" />
                    <InputField label="Pendidikan Terakhir" name="pendidikanIbu" value={formData.pendidikanIbu} onChange={handleChange} placeholder="Pendidikan Terakhir Ibu" />
                    <div className="md:col-span-2">
                        <label htmlFor="alamatIbu" className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                        <textarea id="alamatIbu" name="alamatIbu" value={formData.alamatIbu} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" placeholder="Alamat lengkap ibu"></textarea>
                    </div>
                    <InputField label="No. HP/WA" name="noHpIbu" value={formData.noHpIbu} onChange={handleChange} placeholder="Nomor HP/WA Ibu" />
                  </div>
                </div>
              </div>
            </div>

            {/* Data Akun Wali (tanpa kata sandi) */}
            <div>
              <SectionTitle title="C. Data Akun Wali" />
              <div className="p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Email Wali" name="emailWali" value={formData.emailWali} onChange={handleChange} placeholder="cth: wali@email.com" type="email" />
                <div>
                  <label htmlFor="hubunganWali" className="block text-sm font-medium text-gray-700 mb-1">Akun Didaftarkan Atas Nama</label>
                  <select id="hubunganWali" name="hubunganWali" value={formData.hubunganWali} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500">
                      <option value="Ayah">Ayah</option>
                      <option value="Ibu">Ibu</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <Link to="/auth/login" className="flex items-center text-sm text-gray-600 hover:text-teal-500">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Login
              </Link>
              <button type="submit" className="px-6 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-md shadow-sm hover:from-teal-700 hover:to-teal-800 flex items-center">
                <UserCheck className="w-4 h-4 mr-2"/>
                Daftar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}