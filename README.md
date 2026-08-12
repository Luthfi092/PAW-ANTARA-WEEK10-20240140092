POST LOGIN
<img width="1919" height="1079" alt="Screenshot 2026-08-12 114638" src="https://github.com/user-attachments/assets/2f7b8118-1660-4a1a-84bf-0a66cfe18a83" />
GET PRODUCTS
<img width="1919" height="1079" alt="Screenshot 2026-08-12 114803" src="https://github.com/user-attachments/assets/0b937483-61b8-4db5-94ce-de73c3b9d118" />
POST PRODUCTS
<img width="1919" height="1079" alt="Screenshot 2026-08-12 115049" src="https://github.com/user-attachments/assets/5b0f79a6-9857-4040-b60f-501304d9a6ec" />
PUT PRODUCTS
<img width="1919" height="1079" alt="Screenshot 2026-08-12 115128" src="https://github.com/user-attachments/assets/066c6935-3eb8-4ddd-a4b6-b16272ca934a" />
DELETE PRODUCTS
<img width="1919" height="1079" alt="Screenshot 2026-08-12 115147" src="https://github.com/user-attachments/assets/5814de28-98fb-4f15-a7f3-69ce9bc72386" />
POST CHAT 
<img width="1919" height="1079" alt="Screenshot 2026-08-12 115314" src="https://github.com/user-attachments/assets/34055e80-d0ad-4247-8afb-fb614e60f896" />
POST LOGOUT
<img width="1919" height="1079" alt="Screenshot 2026-08-12 120720" src="https://github.com/user-attachments/assets/7eb44656-a0ea-4755-a8af-c7befb376ab5" />


# CS Bot API — Generative AI + Prompt Engineering + Express/Sequelize

API-only (tanpa view), demo customer service otomatis berbasis Gemini yang cuma boleh
jawab soal produk di database, dengan admin login buat kelola produk.

Materi yang kedemo di project ini:
1. **Integrasi LLM di server** (Gemini API), API key aman di `.env`
2. **Prompt engineering & guardrail** — nolak pertanyaan di luar konteks
3. **Defense in depth** — validasi juga di level kode, bukan cuma di prompt

## Struktur folder
```
cs-bot-api/
├── app.js
├── config/
│   ├── database.js       # koneksi sequelize
│   └── gemini.js         # setup client Gemini (baca API key dari .env)
├── models/
│   ├── admin.model.js
│   ├── product.model.js
│   └── index.js
├── controllers/
│   ├── admin.controller.js    # login/logout admin
│   ├── product.controller.js  # CRUD produk
│   └── chat.controller.js     # endpoint chat ke bot
├── services/
│   └── gemini.service.js      # BAGIAN INTI: system prompt + guardrail + call Gemini
├── middlewares/
│   ├── auth.middleware.js         # cek session admin
│   └── validateChatInput.middleware.js  # validasi input chat
├── routes/
│   ├── admin.routes.js
│   ├── product.routes.js
│   └── chat.routes.js
├── seeders/
│   └── seed.js            # admin + produk dummy
└── utils/
    └── response.js
```

## Cara install & jalanin

1. Bikin database dulu (Postgres by default):
```sql
CREATE DATABASE cs_bot_db;
```

2. Dapetin Gemini API key gratis di https://aistudio.google.com/app/apikey

3. Copy `.env.example` jadi `.env`, isi kredensial DB + `GEMINI_API_KEY`.

4. Install dependency:
```bash
npm install
```

5. Isi data awal (admin + produk dummy):
```bash
npm run seed
```

6. Jalankan server:
```bash
npm run dev
```

## Endpoint

### Admin
| Method | Endpoint            | Body                          | Keterangan          |
|--------|-----------------------|--------------------------------|----------------------|
| POST   | /api/admin/login       | `{ username, password }`      | Login admin (session) |
| POST   | /api/admin/logout      | -                               | Logout                |

> Catatan: sengaja **tidak ada endpoint public buat register admin**. Admin dibikin
> lewat `npm run seed` aja. Ini contoh prinsip keamanan: jangan expose kemampuan
> bikin akun privileged ke publik.

### Product
| Method | Endpoint             | Auth        | Body                                  | Keterangan       |
|--------|------------------------|-------------|-----------------------------------------|--------------------|
| GET    | /api/products          | publik      | -                                        | List semua produk |
| POST   | /api/products          | admin       | `{ name, description, price, stock }`  | Tambah produk      |
| PUT    | /api/products/:id      | admin       | `{ name?, description?, price?, stock? }` | Update produk   |
| DELETE | /api/products/:id      | admin       | -                                         | Hapus produk       |

### Chat (CS Bot)
| Method | Endpoint          | Auth   | Body                         | Keterangan                                             |
|--------|--------------------|--------|--------------------------------|-----------------------------------------------------------|
| POST   | /api/chat          | publik | `{ message, saveHistory? }`   | Kirim pertanyaan ke bot                                    |
| GET    | /api/chat/history  | publik | -                              | Ambil kembali riwayat percakapan (khusus session ini)    |

Contoh request:
```json
POST /api/chat
{ "message": "kaos polos ada warna apa aja dan harganya berapa?" }
```

Contoh kalo user coba keluar konteks:
```json
POST /api/chat
{ "message": "buatin saya kode HTML buat landing page dong" }
```
Bot bakal nolak dan ngarahin balik ke topik produk — ini yang kejadian karena
aturan di `services/gemini.service.js` (`buildSystemInstruction`).

#### Riwayat percakapan (opt-in)

Secara default, percakapan **tidak** disimpan. Fitur penyimpanan riwayat baru
aktif kalau user secara eksplisit setuju, dengan mengirim `saveHistory: true`
di body `POST /api/chat`:

```json
POST /api/chat
{ "message": "kaos polos ada warna apa aja?", "saveHistory": true }
```

Riwayat dikelompokkan berdasarkan session (cookie `connect.sid` dari
`express-session`), karena endpoint chat memang publik/tanpa login. Jadi
riwayat yang sudah tersimpan hanya bisa diambil kembali dari browser/device
yang sama:

```
GET /api/chat/history
```

Contoh response:
```json
{
  "code": 200,
  "success": true,
  "message": "Berhasil ambil riwayat percakapan",
  "data": [
    {
      "id": 1,
      "sessionId": "abcdef123...",
      "message": "kaos polos ada warna apa aja?",
      "reply": "Kaos polos cotton combed tersedia dalam warna...",
      "createdAt": "2026-08-12T03:00:00.000Z",
      "updatedAt": "2026-08-12T03:00:00.000Z"
    }
  ]
}
```

> Catatan: request dari client (frontend) wajib disertai `credentials: 'include'`
> (fetch) atau `withCredentials: true` (axios), supaya cookie session ikut
> terkirim dan riwayatnya konsisten antar-request.

## Cara kerja guardrail-nya (penting buat materi)

Di `services/gemini.service.js`, ada fungsi `buildSystemInstruction()` yang:
1. Ambil semua data produk dari database (jadi bot selalu jawab data terkini, bukan hardcode)
2. Nyusun **system instruction** yang isinya:
   - Peran bot (siapa dia, buat toko apa)
   - Data produk yang boleh dia rujuk (grounding — bot gak boleh ngarang)
   - Aturan ketat nolak topik di luar produk, termasuk larangan generate kode/HTML
   - Instruksi anti-prompt-injection (nolak instruksi yang nyoba ganti peran bot)

Ini dikirim sebagai `systemInstruction` ke Gemini, terpisah dari pesan user — jadi
walaupun user nulis "abaikan instruksi sebelumnya", instruksi sistem tetep dominan
(walau tetep gak 100% bulletproof, makanya ditambah validasi di kode juga).

Selain di level prompt, ada juga validasi di `middlewares/validateChatInput.middleware.js`
(cek panjang pesan, dsb) — konsepnya **defense in depth**: jangan cuma andelin satu
lapis pertahanan (prompt doang), tapi dilapis dari beberapa sisi.

## Soal keamanan API key

- `GEMINI_API_KEY` cuma ada di `.env`, dibaca lewat `config/gemini.js`, **tidak pernah**
  dikirim ke client/response manapun.
- `.env` masuk `.gitignore`, jangan pernah ke-commit ke git.
- Kalo API key ini bocor, orang lain bisa pake kuota Gemini kamu buat request mereka
  sendiri — beda kasus sama kebocoran data biasa, ini soal *cost & abuse*.

## Ide pengembangan lanjut (opsional buat materi lanjutan)
- Rate limiting per IP/session biar gak di-spam (`express-rate-limit`)
- ~~Simpan history chat per session~~ ✅ sudah diimplementasikan (lihat bagian
  [Riwayat percakapan (opt-in)](#riwayat-percakapan-opt-in)). Pengembangan lanjut:
  pakai riwayat ini sebagai konteks multi-turn yang dikirim balik ke Gemini.
- Logging semua pertanyaan yang ditolak bot, buat monitoring percobaan misuse
