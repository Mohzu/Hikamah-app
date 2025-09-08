import { Request, Response, NextFunction } from 'express';

// Middleware untuk mengecek apakah pengguna sudah login via sesi
export const protect = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.session && req.session.user) {
    return next();
  } else {
    res.status(401).json({ message: 'Tidak terotentikasi, silakan login' });
  }
};

// Alias untuk protect, karena sepertinya digunakan di beberapa route
export const isLoggedIn = protect;

// Middleware untuk mengecek peran Admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.session.user && req.session.user.peran.toLowerCase() === 'admin') {
    return next();
  } else {
    res.status(403).json({ message: 'Akses ditolak, Anda bukan admin' });
  }
};

// Middleware untuk mengecek peran Bendahara
export const isBendahara = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.session.user && req.session.user.peran.toLowerCase() === 'bendahara') {
    return next();
  } else {
    res.status(403).json({ message: 'Akses ditolak, Anda bukan bendahara' });
  }
};

// Middleware untuk mengecek peran Guru
export const isGuru = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.session.user && req.session.user.peran.toLowerCase() === 'guru') {
    return next();
  } else {
    res.status(403).json({ message: 'Akses ditolak, Anda bukan guru' });
  }
};

// Middleware untuk mengecek peran Santri
export const isSantri = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.session.user && req.session.user.peran.toLowerCase() === 'santri') {
    return next();
  } else {
    res.status(403).json({ message: 'Akses ditolak, Anda bukan santri' });
  }
};

// Middleware untuk mengecek peran Wali Kelas
export const isWaliKelas = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.session.user && req.session.user.peran.toLowerCase() === 'walikelas') {
    return next();
  } else {
    res.status(403).json({ message: 'Akses ditolak, Anda bukan wali kelas' });
  }
};