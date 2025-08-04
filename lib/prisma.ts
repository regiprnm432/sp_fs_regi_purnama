import { PrismaClient } from '@prisma/client';

// Deklarasikan variabel global untuk menyimpan cache koneksi Prisma
declare global {
  var prisma: PrismaClient | undefined;
}

// Gunakan koneksi yang sudah ada dari cache jika ada, jika tidak buat yang baru
const client = globalThis.prisma || new PrismaClient();

// Di lingkungan development, simpan koneksi ke dalam cache global
if (process.env.NODE_ENV !== 'production') globalThis.prisma = client;

export default client;
