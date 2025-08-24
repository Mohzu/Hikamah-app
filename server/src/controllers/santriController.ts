// src/controllers/santriController.ts

// --- IMPORTS ---
import { Request, Response, NextFunction } from "express";
import pool from '../config/db.js';
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { RowDataPacket, OkPacket } from "mysql2/promise";
import { z } from "zod";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- INTERFACES & TYPES & SKEMA ZOD ---

interface RequestWithSantri extends Request {
  id_santri?: number;
}
interface UserPasswordRow extends RowDataPacket {
  kata_sandi: string;
}
interface NilaiRow extends RowDataPacket {
  tahun_ajaran: string;
  semester: string;
  nama_mapel: string;
  nilai_tugas: number | null;
  nilai_uts: number | null;
  nilai_uas: number | null;
  nilai_akhir: number | null;
}
interface RaporNilaiRow extends RowDataPacket {
  nama_mapel: string;
  kategori: string;
  nilai_akhir: number | null;
  deskripsi_guru: string | null;
}
interface RekapAbsensiRow extends RowDataPacket {
  status: string;
  jumlah: number;
}
interface SantriDataRow extends RowDataPacket {
  nama_lengkap: string;
  nomor_induk: string;
  nisn: string;
  tempat_lahir: string;
  tanggal_lahir: Date;
  jenis_kelamin: "L" | "P";
  anak_ke: number;
  dari_bersaudara: number;
  agama: string;
  alamat: string;
  foto_profil: string;
  email_wali: string | null;
}
interface OrangTuaDataRow extends RowDataPacket {
  status_hubungan: "Ayah" | "Ibu";
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: Date;
  pekerjaan: string;
  pendidikan_terakhir: string;
  alamat: string;
  nomor_hp: string;
}

// Skema untuk validasi ganti password
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Password lama harus diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

// Skema untuk validasi ganti username
const changeUsernameSchema = z.object({
  newUsername: z.string().min(3, "Username baru minimal 3 karakter"),
});

// Skema untuk update biodata
const updateBiodataSchema = z
  .object({
    nama_lengkap: z.string().min(3).optional(),
    tanggal_lahir: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
      .optional(),
    jenis_kelamin: z.enum(["L", "P"]).optional(),
    alamat: z.string().min(5).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Setidaknya satu field harus diisi untuk update",
  });

// Skema untuk validasi query parameter
const raporQuerySchema = z.object({
  tahun_ajaran: z
    .string()
    .regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus YYYY/YYYY"),
  semester: z.enum(["Ganjil", "Genap"]),
});

// Tambahkan skema ini di bagian "INTERFACES & TYPES & SKEMA ZOD"
const jadwalQuerySchema = z.object({
  tahun_ajaran: z
    .string()
    .regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus YYYY/YYYY"),
});

// --- FUNGSI MIDDLEWARE ---
export const isSantri = (req: Request, res: Response, next: NextFunction) => {
  if (
    req.session.user &&
    req.session.user.peran === "Santri" &&
    req.session.user.id_santri
  ) {
    return next();
  }
  return res
    .status(401)
    .json({
      success: false,
      error: "Akses ditolak. Anda harus login sebagai santri.",
    });
};
// --- FUNGSI HELPER ---
function getPredikat(nilai: number | null | undefined): string {
  if (nilai === null || nilai === undefined) return "-";
  if (nilai >= 90) return "A";
  if (nilai >= 80) return "B";
  if (nilai >= 70) return "C";
  return "D";
}

// --- FUNGSI CONTROLLER ---

export const changePassword = async (req: Request, res: Response) => {
  const validation = changePasswordSchema.safeParse(req.body);
  if (!validation.success)
    return res
      .status(400)
      .json({
        success: false,
        error: "Data tidak valid",
        details: validation.error.flatten().fieldErrors,
      });
  if (!req.session.user)
    return res.status(401).json({ success: false, error: "Akses ditolak." });

  const { oldPassword, newPassword } = validation.data;
  const { id_pengguna } = req.session.user;
  try {
    const [users] = await pool.query<UserPasswordRow[]>(
      "SELECT kata_sandi FROM pengguna WHERE id = ?",
      [id_pengguna]
    );
    if (users.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "Akun pengguna tidak ditemukan." });

    const isMatch = await bcrypt.compare(oldPassword, users[0].kata_sandi);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, error: "Password lama salah." });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE pengguna SET kata_sandi = ? WHERE id = ?", [
      hashedNewPassword,
      id_pengguna,
    ]);
    res
      .status(200)
      .json({ success: true, data: { message: "Password berhasil diubah." } });
  } catch (error: any) {
    console.error("Error saat ganti password:", error);
    res.status(500).json({ success: false, error: "Gagal mengubah password." });
  }
};

export const changeUsername = async (req: Request, res: Response) => {
  const validation = changeUsernameSchema.safeParse(req.body);
  if (!validation.success)
    return res
      .status(400)
      .json({
        success: false,
        error: "Data tidak valid",
        details: validation.error.flatten().fieldErrors,
      });
  if (!req.session.user)
    return res.status(401).json({ success: false, error: "Akses ditolak." });

  const { newUsername } = validation.data;
  const { id_pengguna, username: oldUsername } = req.session.user;

  if (newUsername === oldUsername)
    return res
      .status(400)
      .json({
        success: false,
        error: "Username baru sama dengan username lama.",
      });
  try {
    await pool.query("UPDATE pengguna SET username = ? WHERE id = ?", [
      newUsername,
      id_pengguna,
    ]);
    req.session.user.username = newUsername;
    req.session.save((err) => {
      if (err) {
        console.error("Gagal menyimpan sesi:", err);
        return res
          .status(500)
          .json({ success: false, error: "Gagal update sesi." });
      }
      res
        .status(200)
        .json({
          success: true,
          data: { message: "Username berhasil diubah.", newUsername },
        });
    });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({ success: false, error: "Username ini sudah digunakan." });
    console.error("Error saat ganti username:", error);
    res.status(500).json({ success: false, error: "Gagal mengubah username." });
  }
};

export const uploadPhoto = async (req: Request, res: Response) => {
    const id_santri = req.session?.user?.id_santri;
    if (!id_santri) {
        console.error("ID Santri tidak ditemukan di sesi.");
        return res.status(401).json({ success: false, error: "Sesi tidak valid atau ID santri tidak ditemukan." });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, error: "Tidak ada file yang diunggah." });
    }
    const newPhotoUrl = `/uploads/${req.file.filename}`;

    try {
        const [oldData] = await pool.query<RowDataPacket[]>('SELECT foto_profil FROM santri WHERE id = ?', [id_santri]);
        
        if (oldData.length > 0 && oldData[0].foto_profil) {
            // --- PERBAIKAN DI SINI ---
            const oldPhotoPath = path.join(__dirname, '../public', oldData[0].foto_profil);
            
            try {
                await fs.promises.unlink(oldPhotoPath);
                console.log(`Foto lama berhasil dihapus: ${oldPhotoPath}`);
            } catch (err) {
                if ((err as any).code === "ENOENT") {
                    console.log(`Foto lama tidak ditemukan di jalur: ${oldPhotoPath}`);
                } else {
                    console.error("Gagal menghapus foto lama:", err);
                }
            }
        }
    // 4. Update database dengan path foto baru
        const [result] = await pool.query<OkPacket>(
      "UPDATE santri SET foto_profil = ? WHERE id = ?",
      [newPhotoUrl, id_santri]
    );

    // 5. Log hasil query
    console.log("Hasil update database:", result);

    if (result.affectedRows === 0) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "Tidak ada baris yang diubah. ID santri mungkin tidak ditemukan.",
        });
    }

    res
      .status(200)
      .json({
        success: true,
        data: {
          message: "Foto profil berhasil diunggah.",
          photoUrl: newPhotoUrl,
        },
      });
  } catch (error) {
    console.error("Terjadi error dalam fungsi uploadPhoto:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Gagal menyimpan foto karena kesalahan server.",
      });
  }
};

export const updateBiodata = async (req: Request, res: Response) => {
  // 1. Validasi input body terlebih dahulu
  const validation = updateBiodataSchema.safeParse(req.body);
  if (!validation.success) {
    return res
      .status(400)
      .json({
        success: false,
        error: "Data tidak valid",
        details: validation.error.flatten().fieldErrors,
      });
  }

  try {
    // 2. Verifikasi sesi dan ambil id_santri LANGSUNG dari sesi
    if (!req.session.user || !req.session.user.id_santri) {
      console.error(
        "[DEBUG] GAGAL: Sesi pengguna atau id_santri tidak ditemukan di updateBiodata."
      );
      return res
        .status(401)
        .json({ success: false, error: "Sesi tidak valid." });
    }
    const id_santri = req.session.user.id_santri;
    console.log(
      `[DEBUG] updateBiodata dipanggil untuk id_santri dari SESI: ${id_santri}`
    );

    // 3. Gunakan data yang sudah divalidasi oleh Zod
    const fieldsToUpdate = validation.data;

    const updateKeys = Object.keys(fieldsToUpdate);

    // Cek jika tidak ada data yang dikirim (meskipun Zod sudah menangani ini dengan .refine)
    if (updateKeys.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Tidak ada data valid yang dikirim untuk diupdate.",
        });
    }

    const setClause = updateKeys.map((key) => `${key} = ?`).join(", ");
    const values = [...Object.values(fieldsToUpdate), id_santri];
    const sql = `UPDATE santri SET ${setClause} WHERE id = ?`;

    console.log(`[DEBUG] Menjalankan query UPDATE:`, sql);
    console.log(`[DEBUG] Dengan nilai:`, values);

    const [result] = await pool.query<OkPacket>(sql, values);

    console.log(
      `[DEBUG] Hasil query UPDATE, affectedRows:`,
      result.affectedRows
    );

    if (result.affectedRows === 0) {
      // Cek apakah santri memang tidak ada
      const [santriCheck] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM santri WHERE id = ?",
        [id_santri]
      );
      if (santriCheck.length === 0) {
        console.error(
          `[DEBUG] GAGAL: Santri dengan id ${id_santri} tidak ditemukan di database.`
        );
        return res
          .status(404)
          .json({ success: false, error: `Santri tidak ditemukan.` });
      } else {
        // Jika santri ada, berarti data yang dikirim sama
        return res
          .status(200)
          .json({
            success: true,
            data: {
              message: "Tidak ada data yang diubah karena nilainya sama.",
            },
          });
      }
    }

    res
      .status(200)
      .json({
        success: true,
        data: { message: "Biodata santri berhasil diperbarui." },
      });
  } catch (error: any) {
    console.error("Error saat memperbarui biodata:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Gagal memperbarui biodata karena kesalahan server.",
      });
  }
};

export const getFullProfile = async (req: Request, res: Response) => {
  try {
    // 1. Verifikasi sesi sekali lagi di dalam controller
    if (!req.session.user || !req.session.user.id_santri) {
      console.error(
        "[DEBUG] GAGAL: Sesi pengguna atau id_santri tidak ditemukan di getFullProfile."
      );
      return res
        .status(401)
        .json({ success: false, error: "Sesi tidak valid." });
    }

    // 2. Ambil id_santri LANGSUNG dari sesi
    const id_santri = req.session.user.id_santri;
    console.log(
      `[DEBUG] getFullProfile dipanggil untuk id_santri dari SESI: ${id_santri}`
    );

    // 3. Gunakan LEFT JOIN untuk keamanan, seperti sebelumnya
    const querySantri = `SELECT 
    s.nama_lengkap, s.nomor_induk, s.nisn, s.tempat_lahir, s.tanggal_lahir, 
    s.jenis_kelamin, s.anak_ke, s.dari_bersaudara, s.agama, s.alamat, s.foto_profil,
    p_wali.email AS email_wali
    FROM santri s
    LEFT JOIN pengguna p_wali ON s.id_wali = p_wali.id
    WHERE s.id = ?`;
    const [santriData] = await pool.query<SantriDataRow[]>(querySantri, [
      id_santri,
    ]);

    console.log(`[DEBUG] Hasil query santriData:`, santriData);

    if (santriData.length === 0) {
      console.error(
        `[DEBUG] GAGAL: Tidak ada data ditemukan di tabel 'santri' untuk id_santri: ${id_santri}`
      );
      return res
        .status(404)
        .json({ success: false, error: "Data profil santri tidak ditemukan." });
    }

    const [orangTuaData] = await pool.query<OrangTuaDataRow[]>(
      "SELECT * FROM orang_tua WHERE id_santri = ?",
      [id_santri]
    );

    console.log(`[DEBUG] Hasil query orangTuaData:`, orangTuaData);

    const ayahData =
      orangTuaData.find((ortu) => ortu.status_hubungan === "Ayah");
    const ibuData =
      orangTuaData.find((ortu) => ortu.status_hubungan === "Ibu");

    const fullProfile = {
      santri: santriData[0],
      ayah: {
        nama_lengkap: ayahData?.nama_lengkap,
        tempat_lahir: ayahData?.tempat_lahir,
        tanggal_lahir: ayahData?.tanggal_lahir,
        pekerjaan: ayahData?.pekerjaan,
        pendidikan_terakhir: ayahData?.pendidikan_terakhir,
        alamat: ayahData?.alamat,
        nomor_hp: ayahData?.nomor_hp,
      },
      ibu: {
        nama_lengkap: ibuData?.nama_lengkap,
        tempat_lahir: ibuData?.tempat_lahir,
        tanggal_lahir: ibuData?.tanggal_lahir,
        pekerjaan: ibuData?.pekerjaan,
        pendidikan_terakhir: ibuData?.pendidikan_terakhir,
        alamat: ibuData?.alamat,
        nomor_hp: ibuData?.nomor_hp,
      },
    };

    res.status(200).json({ success: true, data: fullProfile });
  } catch (error: any) {
    console.error("Error saat mengambil profil lengkap santri:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Gagal mengambil data profil karena kesalahan server.",
      });
  }
};

// Tambahkan fungsi ini di bagian "FUNGSI CONTROLLER"
export const getJadwalPelajaran = async (
  req: RequestWithSantri,
  res: Response
) => {
  // Validasi input
  console.log(
    `[DEBUG] Controller getJadwalPelajaran: Menerima request untuk ID Santri: ${req.id_santri}`
  );
  const validation = jadwalQuerySchema.safeParse(req.query);
  if (!validation.success) {
    return res
      .status(400)
      .json({
        success: false,
        error: "Parameter query tidak valid.",
        details: validation.error.flatten().fieldErrors,
      });
  }

  const id_santri = req.id_santri!;
  const { tahun_ajaran } = validation.data;

  try {
    // Query untuk mendapatkan ID kelas santri di tahun ajaran tertentu
    const [kelasSantri] = await pool.query<
      { id_kelas: number }[] & RowDataPacket[]
    >(
      `SELECT id_kelas FROM santri_kelas WHERE id_santri = ? AND tahun_ajaran = ?`,
      [id_santri, tahun_ajaran]
    );

    if (kelasSantri.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          error:
            "Santri tidak terdaftar di kelas manapun untuk tahun ajaran ini.",
        });
    }

    const id_kelas = kelasSantri[0].id_kelas;

    // Query untuk mendapatkan jadwal pelajaran berdasarkan ID kelas
        const queryJadwal = `SELECT 
        jm.hari, 
        jm.waktu_mulai, 
        jm.waktu_selesai, 
        mp.nama_mapel, 
        p.nama_lengkap AS nama_guru
    FROM jadwal_mengajar jm
    JOIN mata_pelajaran mp ON jm.id_mapel = mp.id
    JOIN guru g ON jm.id_guru = g.id
    JOIN pengguna p ON g.id_pengguna = p.id
    WHERE jm.id_kelas = ?
    ORDER BY FIELD(jm.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'), jm.waktu_mulai ASC
    `;
    const [jadwal] = await pool.query<RowDataPacket[]>(queryJadwal, [id_kelas]);

    // Pengelompokan jadwal berdasarkan hari
    const groupedJadwal = jadwal.reduce((acc, item) => {
      const hari = item.hari;
      if (!acc[hari]) acc[hari] = [];
      acc[hari].push({
        mata_pelajaran: item.nama_mapel,
        nama_guru: item.nama_guru,
        waktu: `${item.waktu_mulai.substring(
          0,
          5
        )} - ${item.waktu_selesai.substring(0, 5)}`,
      });
      return acc;
    }, {} as Record<string, any[]>);

    if (Object.keys(groupedJadwal).length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          error:
            "Tidak ada jadwal ditemukan untuk kelas Anda di tahun ajaran ini.",
        });
    }

    res
      .status(200)
      .json({ success: true, data: { tahun_ajaran, jadwal: groupedJadwal } });
  } catch (error: any) {
    console.error("Error saat mengambil jadwal pelajaran:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Gagal mengambil data jadwal pelajaran.",
      });
  }
};

export const getMyNilai = async (req: RequestWithSantri, res: Response) => {
  const id_santri = req.id_santri!;
  try {
    const query = `SELECT n.tahun_ajaran, n.semester, mp.nama_mapel, n.nilai_tugas, n.nilai_uts, n.nilai_uas, n.nilai_akhir
    FROM nilai n JOIN mata_pelajaran mp ON n.id_mapel = mp.id
    WHERE n.id_santri = ? ORDER BY n.tahun_ajaran DESC, n.semester DESC, mp.nama_mapel ASC`;
    const [nilaiList] = await pool.query<NilaiRow[]>(query, [id_santri]);

    // Logika pengelompokan Anda sudah benar
    const groupedNilai = nilaiList.reduce((acc, nilai) => {
      const key = `${nilai.tahun_ajaran} - Semester ${nilai.semester}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        mata_pelajaran: nilai.nama_mapel,
        nilai_tugas: nilai.nilai_tugas,
        nilai_uts: nilai.nilai_uts,
        nilai_uas: nilai.nilai_uas,
        nilai_akhir: nilai.nilai_akhir,
      });
      return acc;
    }, {} as Record<string, any[]>);

    res.status(200).json({ success: true, data: groupedNilai });
  } catch (error: any) {
    console.error("Error saat santri mengambil data nilai:", error);
    res
      .status(500)
      .json({ success: false, error: "Gagal mengambil data nilai." });
  }
};

export const getRaporSemester = async (
  req: RequestWithSantri,
  res: Response
) => {
  const validation = raporQuerySchema.safeParse(req.query);
  if (!validation.success)
    return res
      .status(400)
      .json({
        success: false,
        error: "Parameter query tidak valid",
        details: validation.error.flatten().fieldErrors,
      });

  const id_santri = req.id_santri!;
  const { tahun_ajaran, semester } = validation.data;

  try {
    const [nilaiList] = await pool.query<RaporNilaiRow[]>(
      `SELECT mp.nama_mapel, mp.kategori, n.nilai_akhir, n.deskripsi_guru FROM nilai n JOIN mata_pelajaran mp ON n.id_mapel = mp.id WHERE n.id_santri = ? AND n.tahun_ajaran = ? AND n.semester = ? ORDER BY mp.kategori, mp.nama_mapel`,
      [id_santri, tahun_ajaran, semester]
    );
    if (nilaiList.length === 0)
      return res
        .status(404)
        .json({
          success: false,
          error: `Tidak ada data nilai untuk periode ini.`,
        });

    const [rekapAbsensi] = await pool.query<RekapAbsensiRow[]>(
      `SELECT status, COUNT(id) as jumlah FROM absensi 
WHERE id_santri = ? AND tahun_ajaran = ? GROUP BY status`,
      [id_santri, tahun_ajaran]
    );

    const [catatanPerilaku] = await pool.query<RowDataPacket[]>(
      "SELECT kategori, deskripsi, tanggal_catatan FROM catatan_perilaku WHERE id_santri = ? AND tahun_ajaran = ? AND semester = ? ORDER BY tanggal_catatan DESC",
      [id_santri, tahun_ajaran, semester]
    );

    // Semua logika penyusunan rapor Anda di bawah ini sudah benar
    const absensi = { Sakit: 0, Izin: 0, Alfa: 0 };
    rekapAbsensi.forEach((item) => {
      absensi[item.status] = item.jumlah;
    });

    let jumlah_nilai = 0;
    nilaiList.forEach((n) => {
      jumlah_nilai += n.nilai_akhir ? Number(n.nilai_akhir) : 0;
    });
    const rata_rata =
      nilaiList.length > 0 ? jumlah_nilai / nilaiList.length : 0;
    const predikat_keseluruhan = getPredikat(rata_rata);

    const [statusData] = await pool.query<
      RowDataPacket[] & { status_kenaikan: string }[]
    >(
      "SELECT status_kenaikan FROM santri_kelas WHERE id_santri = ? AND tahun_ajaran = ?",
      [id_santri, tahun_ajaran]
    );
    const status_kenaikan =
      statusData.length > 0
        ? statusData[0].status_kenaikan
        : "Belum Ditentukan";

    const nilai_per_kategori = nilaiList.reduce((acc, nilai) => {
      const kategori = nilai.kategori || "Lainnya";
      if (!acc[kategori]) acc[kategori] = [];
      acc[kategori].push({
        mata_pelajaran: nilai.nama_mapel,
        nilai_akhir: nilai.nilai_akhir,
        predikat: getPredikat(nilai.nilai_akhir),
        deskripsi: nilai.deskripsi_guru || "Belum ada deskripsi dari guru.",
      });
      return acc;
    }, {} as Record<string, any[]>);

    const rapor = {
      rekapitulasi: {
        jumlah_nilai: parseFloat(jumlah_nilai.toFixed(2)),
        rata_rata: parseFloat(rata_rata.toFixed(2)),
        predikat: predikat_keseluruhan,
        status_kenaikan,
      },
      detail_nilai: nilai_per_kategori,
      rekap_non_akademik: { absensi, catatan_perilaku: catatanPerilaku },
    };

    res.status(200).json({ success: true, data: rapor });
  } catch (error: any) {
    console.error("Error saat generate rapor:", error);
    res
      .status(500)
      .json({ success: false, error: "Gagal mengambil data rapor." });
  }
};

// Fungsi baru untuk mengambil ringkasan dashboard santri
export const getSantriDashboardSummary = async (req: Request, res: Response) => {
    if (!req.session.user || req.session.user.peran !== 'Santri' || !req.session.user.id_santri) {
        return res.status(401).json({ success: false, error: 'Akses ditolak. Anda harus login sebagai Santri.' });
    }
    
    const id_santri = req.session.user.id_santri;
    
    try {
        // Mengambil data nilai rata-rata
        const [nilaiData] = await pool.query<RowDataPacket[]>('SELECT AVG(nilai_akhir) AS rata_rata_nilai FROM nilai WHERE id_santri = ?', [id_santri]);
        const rataRataNilai = nilaiData[0].rata_rata_nilai ? parseFloat(nilaiData[0].rata_rata_nilai) : 0;

        // Mengambil data pembayaran (asumsi total tagihan hardcoded 13.300.000)
        const [pembayaranData] = await pool.query<RowDataPacket[]>('SELECT SUM(jumlah) AS total_terbayar FROM pembayaran WHERE id_santri = ?', [id_santri]);
        const totalTerbayar = pembayaranData[0].total_terbayar ? parseFloat(pembayaranData[0].total_terbayar) : 0;
        const sisaTagihan = 13300000 - totalTerbayar; 

        // Mengambil data hafalan (asumsi 'nama_juz_surah' berisi angka juz, misal '3 Juz')
        const [hafalanData] = await pool.query<RowDataPacket[]>('SELECT nama_juz_surah FROM progres_hafalan WHERE id_santri = ? ORDER BY tanggal_setoran DESC LIMIT 1', [id_santri]);
        const progressHafalan = hafalanData.length > 0 && hafalanData[0].nama_juz_surah ? parseInt(hafalanData[0].nama_juz_surah.split(' ')[0]) : 0;

        res.status(200).json({
            success: true,
            data: {
                sisa_tagihan: sisaTagihan,
                total_terbayar: totalTerbayar,
                rata_rata_nilai: rataRataNilai,
                progress_hafalan: progressHafalan
            }
        });
        
    } catch (error: any) {
        console.error("Error saat mengambil data dashboard summary santri:", error);
        res.status(500).json({ success: false, error: "Gagal mengambil data dashboard summary." });
    }
};
