# 🛩️ Aplikasi Manajemen Proyek Multi-Pengguna

Aplikasi manajemen proyek multi-pengguna yang dibangun sebagai bagian dari tes teknis. Aplikasi ini memungkinkan pengguna untuk:

- Mendaftar & login
- Membuat proyek
- Mengundang anggota lain
- Mengelola tugas dalam sebuah papan Kanban interaktif

---

## 🚀 Teknologi yang Digunakan

- **Framework**: Next.js (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS
- **Komponen UI**: [Shadcn UI](https://ui.shadcn.com/)
- **ORM**: Prisma
- **Database**: SQLite
- **Autentikasi**: JWT (JSON Web Tokens)

---

## ⚙️ Cara Menjalankan Proyek Secara Lokal

### 1. Prasyarat

Pastikan Anda sudah menginstal:

- [Node.js](https://nodejs.org/) v18 atau lebih baru
- npm atau package manager lain seperti pnpm/yarn

### 2. Instalasi

Clone repositori ini:

```bash
git clone [URL_REPOSITORI_ANDA]
cd [NAMA_FOLDER_PROYEK_ANDA]
```

Instal semua dependensi:

```bash
npm install
```

### 3. Pengaturan Database (Prisma)

Proyek ini menggunakan SQLite, jadi tidak perlu instalasi server database terpisah.

#### a. Buat file `.env`

Salin file `.env.example` dan ubah namanya menjadi `.env`:

```bash
cp .env.example .env
```

#### b. Isi Environment Variables

Edit file `.env` dan isi variabel yang dibutuhkan:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="ISI_DENGAN_STRING_ACAK_YANG_AMAN"
```

#### c. Jalankan Migrasi Database

```bash
npx prisma migrate dev
```

#### d. (Opsional) Lihat Isi Database via Prisma Studio

```bash
npx prisma studio
```

### 4. Menjalankan Aplikasi

Setelah semua selesai, jalankan server development:

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`.

---

## ✨ Fitur Utama

- ✅ Autentikasi pengguna (Register & Login)
- ✅ Pembuatan dan pengelolaan proyek
- ✅ Sistem undangan member berbasis email
- ✅ Papan Kanban untuk manajemen tugas (To Do, In Progress, Done)
- ✅ Drag-and-Drop antar kolom status
- ✅ Grafik analisis jumlah tugas per status
- ✅ Ekspor data proyek ke format JSON

---
