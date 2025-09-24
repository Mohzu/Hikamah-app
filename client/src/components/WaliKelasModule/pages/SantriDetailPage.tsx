import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { WKButton } from '../atoms/Button';
import { PerilakuList } from '../organisms/PerilakuList';
import type { CatatanPerilaku } from '../organisms/PerilakuList';
import { NilaiTable } from '../organisms/NilaiTable';
import { TahunAjaranFilter } from '../molecules/TahunAjaranFilter';
import { SemesterFilter } from '../molecules/SemesterFilter';
import { Modal } from '../molecules/Modal';

type Note = CatatanPerilaku;

export function SantriDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [kenaikanStatus, setKenaikanStatus] = useState<'Naik Kelas' | 'Tidak Naik Kelas' | 'Lulus' | ''>('');
  const [tahunAjaran, setTahunAjaran] = useState<string>('');
  const [catatan, setCatatan] = useState<Note[]>([]);
  const [nilai, setNilai] = useState<Record<string, any[]> | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ kategori: Note['kategori']; deskripsi: string }>({ kategori: 'Positif', deskripsi: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [profil, setProfil] = useState<{ nama_lengkap: string; nisn: string; foto_profil?: string | null; nama_kelas?: string; nama_jenjang?: string } | null>(null);
  const [form, setForm] = useState({ tahun_ajaran: '', semester: 'Ganjil', tanggal_catatan: '', kategori: 'Positif', deskripsi: '' });
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addForm, setAddForm] = useState({ tahun_ajaran: '', semester: 'Ganjil' as 'Ganjil' | 'Genap', tanggal_catatan: '', kategori: 'Positif' as Note['kategori'], deskripsi: '' });
  const [showKenaikanModal, setShowKenaikanModal] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const tahun = new Date().getFullYear();
        const params = new URLSearchParams(location.search);
        const tahun_ajaran_param = params.get('tahun_ajaran');
        const defaultTA = `${tahun}/${tahun+1}`;
        const chosenTA = tahun_ajaran_param || defaultTA;
        setTahunAjaran(chosenTA);
        if (!form.tahun_ajaran) {
          setForm(prev => ({ ...prev, tahun_ajaran: chosenTA }));
        }
        // Prefill profil dari state jika tersedia
        const stateAny: any = (location as any).state;
        if (stateAny?.santri) {
          const s = stateAny.santri;
          setProfil({ nama_lengkap: s.nama_lengkap, nisn: s.nisn, foto_profil: s.foto_profil, nama_kelas: s.nama_kelas, nama_jenjang: s.nama_jenjang });
        }
        const url = new URL(`${import.meta.env.VITE_API_URL}/api/account/wali-kelas/santri/${id}/perilaku`);
        if (tahun_ajaran_param) url.searchParams.set('tahun_ajaran', tahun_ajaran_param);
        const res = await axios.get(url.toString(), { withCredentials: true });
        if (res.data.success) setCatatan(res.data.data);
        else setError(res.data.error || 'Gagal memuat catatan');

        // Fetch nilai untuk wali kelas
        const semester_param = params.get('semester') || undefined;
        const nilaiUrl = new URL(`${import.meta.env.VITE_API_URL}/api/account/wali-kelas/santri/${id}/nilai`);
        if (tahun_ajaran_param) nilaiUrl.searchParams.set('tahun_ajaran', tahun_ajaran_param);
        if (semester_param) nilaiUrl.searchParams.set('semester', semester_param);
        const nilaiRes = await axios.get(nilaiUrl.toString(), { withCredentials: true });
        if (nilaiRes.data.success) setNilai(nilaiRes.data.data);

        // Fetch profil santri dari daftar dan pilih yang sesuai id
        const listUrl = new URL(`${import.meta.env.VITE_API_URL}/api/account/wali-kelas/santri`);
        if (tahun_ajaran_param) listUrl.searchParams.set('tahun_ajaran', tahun_ajaran_param);
        const listRes = await axios.get(listUrl.toString(), { withCredentials: true });
        if (listRes.data.success) {
          const found = (listRes.data.data as any[]).find(s => String(s.id) === String(id));
          if (found) setProfil({ nama_lengkap: found.nama_lengkap, nisn: found.nisn, foto_profil: found.foto_profil, nama_kelas: found.nama_kelas, nama_jenjang: found.nama_jenjang });
        }
      } catch (e: any) {
        setError(e.response?.data?.error || 'Gagal memuat catatan');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, location.search]);

  const handleSetKenaikan = async () => {
    if (!kenaikanStatus || !tahunAjaran) return;
    try {
      // Simpan untuk tahun ajaran selanjutnya
      const startYear = parseInt(tahunAjaran.split('/')[0] || '0', 10);
      const nextStart = isNaN(startYear) ? new Date().getFullYear() + 1 : startYear + 1;
      const nextTA = `${nextStart}/${nextStart + 1}`;
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/account/wali-kelas/santri/${id}/status-kenaikan`,
        { status_kenaikan: kenaikanStatus, tahun_ajaran: nextTA },
        { withCredentials: true }
      );
      toast.success(`Status kenaikan disimpan untuk tahun ajaran ${nextTA}`);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Gagal menyimpan status');
    }
  };

  const handleCreateCatatan = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/account/wali-kelas/santri/${id}/perilaku`,
        addForm,
        { withCredentials: true }
      );
      if (res.data.success) {
        const refresh = await axios.get(`${import.meta.env.VITE_API_URL}/api/account/wali-kelas/santri/${id}/perilaku`, { withCredentials: true });
        setCatatan(refresh.data.data);
        setAddForm({ tahun_ajaran: '', semester: 'Ganjil', tanggal_catatan: '', kategori: 'Positif', deskripsi: '' });
        setShowAddModal(false);
        toast.success('Catatan perilaku berhasil ditambahkan');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Gagal menambah catatan');
    }
  };

  const handleUpdateCatatan = async (catatanId: number, kategori: Note['kategori'], deskripsi: string) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/account/wali-kelas/perilaku/${catatanId}`,
        { kategori, deskripsi },
        { withCredentials: true }
      );
      const refresh = await axios.get(`${import.meta.env.VITE_API_URL}/api/account/wali-kelas/santri/${id}/perilaku`, { withCredentials: true });
      setCatatan(refresh.data.data);
      toast.success('Catatan perilaku berhasil diperbarui');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Gagal memperbarui catatan');
    }
  };

  const handleDeleteCatatan = async (catatanId: number) => {
    setConfirmDeleteId(catatanId);
  };

  if (loading) return <div>Memuat...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#e0e7ff_0%,_#eef2ff_60%,_#ffffff_100%)]" />
        <div className="relative p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={profil?.foto_profil ? `${import.meta.env.VITE_API_URL}${profil.foto_profil}` : '/placeholder.png'}
              className="w-14 h-14 rounded-xl object-cover ring-2 ring-indigo-100"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profil?.nama_lengkap || 'Detail Santri'}</h2>
              <p className="text-sm text-gray-600">NISN {profil?.nisn || '-'}</p>
              {(profil?.nama_kelas || profil?.nama_jenjang) && (
                <p className="text-xs text-gray-500">{profil?.nama_kelas || ''}{profil?.nama_kelas && profil?.nama_jenjang ? ' • ' : ''}{profil?.nama_jenjang || ''}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-md border text-sm text-gray-700 hover:bg-gray-50">Kembali</button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Status Kenaikan</h3>
          <button onClick={() => setShowKenaikanModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm">Atur Kenaikan</button>
        </div>
        <p className="text-xs text-gray-500">Klik tombol untuk mengatur status kenaikan pada tahun ajaran berikutnya.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Catatan Perilaku</h3>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm">Tambah Catatan</button>
        </div>

        <PerilakuList
          items={catatan}
          onEdit={(noteId) => {
            const item = catatan.find(x => x.id === noteId);
            if (!item) return;
            setEditId(noteId);
            setEditForm({ kategori: item.kategori, deskripsi: item.deskripsi });
          }}
          onDelete={handleDeleteCatatan}
        />
      </div>

      <Modal
        isOpen={editId !== null}
        title="Edit Catatan Perilaku"
        onClose={() => setEditId(null)}
        actions={(
          <>
            <button onClick={() => setEditId(null)} className="px-4 py-2 border rounded-md text-sm">Batal</button>
            <button
              onClick={() => {
                if (editId !== null) handleUpdateCatatan(editId, editForm.kategori, editForm.deskripsi);
                setEditId(null);
              }}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm"
            >Simpan</button>
          </>
        )}
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-700">Kategori</label>
            <select
              className="mt-1 w-full border rounded px-3 py-2"
              value={editForm.kategori}
              onChange={e => setEditForm({ ...editForm, kategori: e.target.value as Note['kategori'] })}
            >
              <option>Positif</option>
              <option>Negatif</option>
              <option>Lainnya</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700">Deskripsi</label>
            <textarea
              className="mt-1 w-full border rounded px-3 py-2"
              rows={4}
              value={editForm.deskripsi}
              onChange={e => setEditForm({ ...editForm, deskripsi: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={confirmDeleteId !== null}
        title="Hapus Catatan"
        onClose={() => setConfirmDeleteId(null)}
        actions={(
          <>
            <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 border rounded-md text-sm">Batal</button>
            <button
              onClick={async () => {
                if (confirmDeleteId !== null) {
                  try {
                    await axios.delete(`${import.meta.env.VITE_API_URL}/api/account/wali-kelas/perilaku/${confirmDeleteId}`, { withCredentials: true });
                    setCatatan(prev => prev.filter(c => c.id !== confirmDeleteId));
                    toast.success('Catatan perilaku berhasil dihapus');
                  } catch (e: any) {
                    toast.error(e.response?.data?.error || 'Gagal menghapus catatan');
                  } finally {
                    setConfirmDeleteId(null);
                  }
                }
              }}
              className="px-4 py-2 rounded-md bg-red-600 text-white text-sm"
            >Hapus</button>
          </>
        )}
      >
        <p className="text-sm text-gray-700">Anda yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>

      {/* Modal Tambah Catatan */}
      <Modal
        isOpen={showAddModal}
        title="Tambah Catatan Perilaku"
        onClose={() => setShowAddModal(false)}
        actions={(
          <>
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-md text-sm">Batal</button>
            <button onClick={handleCreateCatatan} className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm">Simpan</button>
          </>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-700">Tahun Ajaran</label>
            <input value={addForm.tahun_ajaran} onChange={e => setAddForm({ ...addForm, tahun_ajaran: e.target.value })} placeholder="YYYY/YYYY" className="w-full border rounded px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Semester</label>
            <select value={addForm.semester} onChange={e => setAddForm({ ...addForm, semester: e.target.value as any })} className="w-full border rounded px-3 py-2 mt-1">
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700">Tanggal</label>
            <input type="date" value={addForm.tanggal_catatan} onChange={e => setAddForm({ ...addForm, tanggal_catatan: e.target.value })} className="w-full border rounded px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Kategori</label>
            <select value={addForm.kategori} onChange={e => setAddForm({ ...addForm, kategori: e.target.value as any })} className="w-full border rounded px-3 py-2 mt-1">
              <option>Positif</option>
              <option>Negatif</option>
              <option>Lainnya</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Deskripsi</label>
            <textarea value={addForm.deskripsi} onChange={e => setAddForm({ ...addForm, deskripsi: e.target.value })} rows={4} className="w-full border rounded px-3 py-2 mt-1" />
          </div>
        </div>
      </Modal>

      {/* Modal Kenaikan */}
      <Modal
        isOpen={showKenaikanModal}
        title="Atur Status Kenaikan"
        onClose={() => setShowKenaikanModal(false)}
        actions={(
          <>
            <button onClick={() => setShowKenaikanModal(false)} className="px-4 py-2 border rounded-md text-sm">Batal</button>
            <button onClick={async () => { await handleSetKenaikan(); setShowKenaikanModal(false); }} className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm">Simpan</button>
          </>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-700">Status Kenaikan</label>
            <select value={kenaikanStatus} onChange={e => setKenaikanStatus(e.target.value as any)} className="w-full border rounded px-3 py-2 mt-1">
              <option value="">Pilih status</option>
              <option value="Naik Kelas">Naik Kelas</option>
              <option value="Tidak Naik Kelas">Tidak Naik Kelas</option>
              <option value="Lulus">Lulus</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700">Tahun Ajaran Saat Ini</label>
            <input value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} placeholder="YYYY/YYYY" className="w-full border rounded px-3 py-2 mt-1" />
          </div>
          <p className="text-xs text-gray-500 md:col-span-2">Status akan disimpan pada tahun ajaran berikutnya secara otomatis.</p>
        </div>
      </Modal>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Nilai Akademik</h3>
          <div className="flex items-center gap-3">
            <SemesterFilter />
          </div>
        </div>
        {nilai ? <NilaiTable grouped={nilai} /> : <p className="text-gray-500">Memuat nilai...</p>}
      </div>
    </div>
  );
}


