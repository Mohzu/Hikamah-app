// src/controllers/bendaharaController.ts

import { Request, Response } from 'express';
import { RowDataPacket, OkPacket } from 'mysql2/promise';
import pool from '../config/db.js';
import { z } from 'zod';

// --- Zod Schemas for Validation ---

const validasiPembayaranSchema = z.object({
    id_pembayaran: z.coerce.number().int().positive(),
    status: z.enum(['Diverifikasi', 'Ditolak']),
    alasan_penolakan: z.string().optional().nullable() // Diperbaiki: Boleh null
});

const rincianPembayaranSchema = z.object({
    nama_bank: z.string().min(1, 'Nama bank harus diisi.'),
    nomor_rekening: z.string().min(1, 'Nomor rekening harus diisi.'),
    atas_nama: z.string().min(1, 'Nama pemilik rekening harus diisi.'),
    deskripsi: z.string().optional()
});

const createTagihanSchema = z.object({
    id_santri: z.coerce.number().int().positive('ID Santri harus angka integer positif.'),
    id_biaya: z.coerce.number().int().positive('ID Biaya harus angka integer positif.'),
    id_bank: z.coerce.number().int().positive('ID Bank harus angka integer positif.'),
    jumlah: z.coerce.number().positive('Jumlah harus angka positif.'),
    status: z.enum(['BelumDibayar', 'MenungguVerifikasi']).default('BelumDibayar'),
});


// --- Controller Functions for Bendahara ---

/**
 * Mengambil daftar semua pembayaran yang menunggu verifikasi.
 * Hanya untuk Bendahara.
 */
export const getPembayaranMasuk = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT 
                p.id,
                s.nama_lengkap AS nama_santri,
                p.jumlah_pembayaran,
                p.bukti_pembayaran,
                p.status,
                p.dibuat_pada
            FROM pembayaran p
            JOIN santri s ON p.id_santri = s.id
            WHERE p.status = 'MenungguVerifikasi'
            ORDER BY p.dibuat_pada ASC
        `;
        const [pembayaran] = await pool.query<RowDataPacket[]>(query);
        res.status(200).json({ success: true, data: pembayaran });
    } catch (error: any) {
        console.error("Kesalahan saat mengambil pembayaran masuk:", error);
        res.status(500).json({ success: false, error: "Gagal mengambil data pembayaran masuk." });
    }
};

/**
 * Memvalidasi atau menolak sebuah pembayaran.
 * Hanya untuk Bendahara.
 */
export const validasiPembayaran = async (req: Request, res: Response) => {
    const validationResult = validasiPembayaranSchema.safeParse({ ...req.body, ...req.params });
    if (!validationResult.success) {
        return res.status(400).json({ success: false, error: 'Data validasi tidak valid.', details: validationResult.error.flatten().fieldErrors });
    }
    
    const { id_pembayaran, status, alasan_penolakan } = validationResult.data;
    const id_bendahara = req.session.user?.id_pengguna; // Mengambil ID pengguna dari sesi

    try {
        await pool.query<OkPacket>(
            `UPDATE pembayaran SET status = ?, alasan_penolakan = ?, id_bendahara = ? WHERE id = ?`,
            [status, alasan_penolakan || null, id_bendahara, id_pembayaran]
        );

        res.status(200).json({ success: true, message: `Status pembayaran berhasil diperbarui menjadi ${status}.` });
    } catch (error) {
        console.error('Error saat memvalidasi pembayaran:', error);
        res.status(500).json({ success: false, error: 'Gagal memvalidasi pembayaran.' });
    }
};

/**
 * Membuat tagihan baru untuk seorang santri.
 * Hanya untuk Bendahara.
 */
export const createTagihan = async (req: Request, res: Response) => {
    const validation = createTagihanSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            success: false,
            error: 'Data tidak valid.',
            details: validation.error.flatten().fieldErrors,
        });
    }

    const { id_santri, id_biaya, id_bank, jumlah, status } = validation.data;

    try {
        const [result] = await pool.query<OkPacket>(
            `INSERT INTO pembayaran (id_santri, id_biaya, id_bank, jumlah_pembayaran, status, dibuat_pada) VALUES (?, ?, ?, ?, ?, NOW())`,
            [id_santri, id_biaya, id_bank, jumlah, status]
        );
        
        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, error: 'Gagal membuat tagihan.' });
        }

        res.status(201).json({ success: true, message: 'Tagihan berhasil dibuat.' });
    } catch (error: any) {
        console.error('Error saat membuat tagihan:', error);
        res.status(500).json({ success: false, error: 'Gagal membuat tagihan karena kesalahan server.' });
    }
};

/**
 * Mengatur atau memperbarui rincian rekening bank untuk tujuan transfer.
 * Hanya untuk Bendahara.
 */
export const setRincianPembayaran = async (req: Request, res: Response) => {
    const validationResult = rincianPembayaranSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ success: false, error: 'Data rincian tidak valid.', details: validationResult.error.flatten().fieldErrors });
    }
    
    const { nama_bank, nomor_rekening, atas_nama, deskripsi } = validationResult.data;
    
    try {
        await pool.query(
            'INSERT INTO rincian_bank (id, nama_bank, nomor_rekening, atas_nama, deskripsi) VALUES (1, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama_bank = VALUES(nama_bank), nomor_rekening = VALUES(nomor_rekening), atas_nama = VALUES(atas_nama), deskripsi = VALUES(deskripsi)',
            [nama_bank, nomor_rekening, atas_nama, deskripsi]
        );
        res.status(201).json({ success: true, message: 'Rincian pembayaran berhasil diperbarui.' });
    } catch (error: any) {
        console.error("Error saat memperbarui rincian pembayaran:", error);
        res.status(500).json({ success: false, error: "Gagal memperbarui rincian pembayaran." });
    }
};
