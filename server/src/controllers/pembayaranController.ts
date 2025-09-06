// src/controllers/pembayaranController.ts

import { Request, Response } from 'express';
import { RowDataPacket, OkPacket } from 'mysql2/promise';
import pool from '../config/db.js';
import { z } from 'zod';

// Zod schema to validate the payment submission data
 

// --- Controller untuk Santri ---

/**
 * Mengambil histori pembayaran untuk santri yang sedang login.
 */
export const getDaftarPembayaranSantri = async (req: Request, res: Response) => {
    const user = req.session.user;
    if (!user || user.peran !== 'Santri' || !user.id_santri) {
        return res.status(401).json({ success: false, error: 'Akses ditolak.' });
    }

    try {
        const [histori] = await pool.query<RowDataPacket[]>(
            `
            SELECT 
                p.*, 
                rb.nama_biaya
            FROM 
                pembayaran p
            JOIN 
                rincian_biaya rb ON p.id_biaya = rb.id
            WHERE 
                p.id_santri = ? 
            ORDER BY 
                p.dibuat_pada DESC
            `,
            [user.id_santri]
        );
        res.status(200).json({ success: true, data: histori });
    } catch (error: any) {
        console.error("Error saat mengambil histori pembayaran:", error);
        res.status(500).json({ success: false, error: "Gagal mengambil histori pembayaran." });
    }
};

/**
 * Mengirimkan bukti pembayaran untuk sebuah tagihan.
 */
const submitPaymentSchema = z.object({
    id_pembayaran: z.array(z.coerce.number().int().positive()), // Expect an array of IDs
    jumlah: z.coerce.number().positive(), // Total amount transferred
});

// ... (rest of the file)

export const submitPayment = async (req: Request, res: Response) => {
    const id_santri = req.session.user?.id_santri;
    if (!id_santri) {
        return res.status(401).json({ success: false, error: 'Akses ditolak. Sesi santri tidak ditemukan.' });
    }

    const validation = submitPaymentSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            success: false,
            error: 'Data tidak valid',
            details: validation.error.flatten().fieldErrors,
        });
    }

    const { id_pembayaran: idsToUpdate, jumlah: totalAmountTransferred } = validation.data;
    const bukti_transfer = req.file?.filename ? `/uploads/bukti-transfer/${req.file.filename}` : null;

    if (!bukti_transfer) {
        return res.status(400).json({ success: false, error: 'Bukti transfer tidak diunggah.' });
    }

    if (idsToUpdate.length === 0) {
        return res.status(400).json({ success: false, error: 'Tidak ada tagihan yang dipilih untuk dibayar.' });
    }

    try {
        // 1. Fetch details of selected bills to validate total amount and status
        const [selectedBills] = await pool.query<RowDataPacket[]>(
            `
            SELECT 
                p.id, 
                p.status, 
                rb.jumlah AS jumlah_tagihan 
            FROM 
                pembayaran p
            JOIN
                rincian_biaya rb ON p.id_biaya = rb.id
            WHERE 
                p.id IN (?) AND p.id_santri = ?
            `,
            [idsToUpdate, id_santri]
        );

        if (selectedBills.length !== idsToUpdate.length) {
            return res.status(404).json({ success: false, error: 'Beberapa tagihan tidak ditemukan atau bukan milik Anda.' });
        }

        let totalExpectedAmount = 0;
        for (const bill of selectedBills) {
            if (bill.status !== 'BelumDibayar') {
                return res.status(400).json({ success: false, error: `Tagihan ${bill.id} sudah dibayar atau dalam proses verifikasi.` });
            }
            totalExpectedAmount += parseFloat(bill.jumlah_tagihan);
        }

        // 2. Validate total amount transferred against expected total
        if (totalAmountTransferred !== totalExpectedAmount) {
            return res.status(400).json({ success: false, error: 'Jumlah transfer tidak sesuai dengan total tagihan yang dipilih.' });
        }

        // 3. Update selected payments
        const query = `
            UPDATE pembayaran
            SET 
                bukti_pembayaran = ?,
                status = 'MenungguVerifikasi',
                tanggal_pembayaran = NOW()
            WHERE id IN (?) AND id_santri = ? AND status = 'BelumDibayar';
        `;
        
        const [result] = await pool.query<OkPacket>(query, [
            bukti_transfer,
            idsToUpdate,
            id_santri,
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tidak ada tagihan yang berhasil diperbarui. Pastikan statusnya BelumDibayar.',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                message: `${result.affectedRows} pembayaran berhasil dikirim. Menunggu verifikasi.`, // Dynamic message
                bukti_transfer,
            },
        });
    } catch (error) {
        console.error('Error submitting payment:', error);
        res.status(500).json({ success: false, error: 'Gagal mengirim pembayaran karena kesalahan server.' });
    }
};

/**
 * Mengambil rincian rekening bank yang aktif untuk tujuan transfer.
 */
export const getRincianPembayaran = async (req: Request, res: Response) => {
    try {
        const [rincian] = await pool.query<RowDataPacket[]>(`SELECT * FROM rincian_bank LIMIT 1`);
        res.status(200).json({ success: true, data: rincian[0] || null });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Gagal mengambil rincian pembayaran.' });
    }
};

/**
 * Mengambil daftar tagihan yang belum dibayar untuk santri yang sedang login.
 */
export const getDaftarTagihanSantri = async (req: Request, res: Response) => {
    const user = req.session.user;
    if (!user || user.peran !== 'Santri' || !user.id_santri) {
        return res.status(401).json({ success: false, error: 'Akses ditolak.' });
    }
    try {
        const [tagihan] = await pool.query<RowDataPacket[]>(
            `
            SELECT 
                p.id,
                rb.nama_biaya,
                rb.keterangan, 
                rb.jumlah AS jumlah_tagihan,
                p.status,
                b.nama_bank,
                b.nomor_rekening,
                b.atas_nama
            FROM pembayaran p
            JOIN rincian_biaya rb ON p.id_biaya = rb.id
            LEFT JOIN rincian_bank b ON p.id_bank = b.id
            WHERE p.id_santri = ? AND p.status = 'BelumDibayar'
            `,
            [user.id_santri]
        );

        if (tagihan.length === 0) {
            return res.status(200).json({ success: true, data: [], message: 'Tidak ada tagihan yang belum dibayar.' });
        }
        
        res.status(200).json({ success: true, data: tagihan });
    } catch (error: any) {
        console.error("Error saat mengambil daftar tagihan:", error);
        res.status(500).json({ success: false, error: "Gagal mengambil daftar tagihan." });
    }
};
