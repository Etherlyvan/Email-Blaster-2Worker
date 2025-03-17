Email Campaign App: Aplikasi Manajemen Kampanye Email



Aplikasi berbasis web untuk membuat, mengelola, dan mengirim kampanye email dengan antarmuka visual yang intuitif.



Fitur Utama



Editor visual untuk membuat email dengan mudah

Dukungan variabel template untuk personalisasi email

Manajemen kontak dan grup penerima

Penjadwalan pengiriman kampanye

Analitik dan pelacakan performa kampanye

Pengelolaan template email



Teknologi yang Digunakan



Frontend: Next.js, React, Tailwind CSS, Lexical Editor

Backend: Node.js, Express

Database: PostgreSQL

Containerization: Docker

Deployment: Docker Compose



Panduan Setup dengan Docker



Berikut langkah-langkah untuk mengatur dan menjalankan aplikasi menggunakan Docker:



Prasyarat



Docker dan Docker Compose terinstal di sistem Anda

Git untuk mengkloning repositori



Langkah 1: Kloning Repositori



git clone https://github.com/username/email-campaign-app.git
cd email-campaign-app



Langkah 2: Konfigurasi Environment Variables



Salin file .env.example menjadi .env dan sesuaikan variabel lingkungan sesuai kebutuhan:



cp .env.example .env



Edit file .env dengan editor teks pilihan Anda dan sesuaikan nilai-nilai berikut:



# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=emailcampaign
DB_USER=postgres
DB_PASSWORD=yourpassword

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=yoursmtppassword
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Email Campaign App

# Application Settings
APP_URL=http://localhost:3000
API_URL=http://localhost:3001
NODE_ENV=development



Langkah 3: Membangun dan Menjalankan Container Docker



# Membangun image Docker
docker-compose build

# Menjalankan aplikasi
docker-compose up -d



Perintah ini akan membangun dan menjalankan semua layanan yang didefinisikan dalam docker-compose.yml, termasuk frontend, backend, dan database.



Langkah 4: Inisialisasi Database



Jalankan migrasi database untuk membuat skema dan tabel yang diperlukan:



# Menjalankan migrasi database
docker-compose exec backend npm run migrate

# (Opsional) Menambahkan data sampel
docker-compose exec backend npm run seed



Langkah 5: Akses Aplikasi



Setelah semua container berjalan, Anda dapat mengakses aplikasi melalui browser:



Frontend: http://localhost:3000

API Backend: http://localhost:3001



Struktur Direktori Docker



email-campaign-app/
├── docker-compose.yml        # Konfigurasi layanan Docker
├── Dockerfile.frontend       # Dockerfile untuk frontend
├── Dockerfile.backend        # Dockerfile untuk backend
├── frontend/                 # Kode sumber frontend
├── backend/                  # Kode sumber backend
└── postgres/                 # Volume dan konfigurasi database



Perintah Docker Berguna



# Melihat log aplikasi
docker-compose logs -f

# Melihat log spesifik untuk layanan tertentu
docker-compose logs -f frontend
docker-compose logs -f backend

# Menghentikan aplikasi
docker-compose down

# Menghapus volume dan memulai ulang aplikasi (reset data)
docker-compose down -v
docker-compose up -d

# Masuk ke shell container
docker-compose exec frontend sh
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d emailcampaign



Pengembangan Lokal Tanpa Docker



Jika Anda ingin menjalankan aplikasi secara lokal tanpa Docker:



Setup Frontend



cd frontend
npm install
npm run dev



Setup Backend



cd backend
npm install
npm run dev



Pastikan Anda memiliki PostgreSQL yang berjalan dan telah mengonfigurasi variabel lingkungan dengan benar.



Kontribusi



Kontribusi sangat dihargai! Silakan lihat CONTRIBUTING.md untuk detail tentang proses pengiriman pull request.



Lisensi



Proyek ini dilisensikan di bawah MIT License.






Troubleshooting



Masalah Umum



Database tidak dapat diakses:

Pastikan container PostgreSQL berjalan: docker-compose ps

Periksa log database: docker-compose logs postgres

Pastikan kredensial database di file .env benar



Perubahan kode tidak terlihat:

Untuk pengembangan, gunakan volume yang dipetakan di docker-compose.yml

Jika menggunakan build produksi, rebuild image: docker-compose build frontend



Port sudah digunakan:

Ubah pemetaan port di docker-compose.yml jika port 3000 atau 3001 sudah digunakan di mesin Anda



Mendapatkan Bantuan



Jika Anda mengalami masalah lain, silakan buka issue di GitHub repository atau hubungi tim pengembang di support@example.com.
