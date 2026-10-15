# Visual Novel Platform 🎮

แพลตฟอร์มเว็บสำหรับ **สร้าง เผยแพร่ และเล่นเกม Visual Novel** ผู้สร้างสามารถจัดการเนื้อเรื่องแบบแยก Chapter, สร้าง Dialogue/Choice แบบแตกแขนง, จัดการตัวละครและภาพประกอบ และเผยแพร่เกมเป็นเวอร์ชัน ส่วนผู้เล่นสามารถค้นหาเกม เล่นเนื้อเรื่อง และบันทึกความคืบหน้าได้

> Repository: https://github.com/krittapatj/visual-novel  
> เอกสารนี้อธิบายการติดตั้งด้วย **บัญชีและทรัพยากรของผู้ติดตั้งเอง** ไม่ได้ให้สิทธิ์เข้าถึงฐานข้อมูลหรือ Cloudinary ของผู้พัฒนา

## Tech Stack

| ส่วน | เทคโนโลยี |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, JWT, Multer |
| Database | TiDB Cloud (MySQL-compatible), `mysql2` พร้อม TLS |
| Image Storage | Cloudinary |
| Deployment | Vercel (Frontend), Render (Backend) |

## ความสามารถหลัก

- **Authentication:** สมัครสมาชิก, เข้าสู่ระบบ และหน้า Profile
- **Creator Studio:** สร้าง/แก้ไขเกม, จัดการ Chapter, Story Editor แบบ Node/Edge และ Preview
- **Characters & Assets:** จัดการตัวละคร, Expression และภาพ Background/Cover/Thumbnail ผ่าน Cloudinary
- **Publishing:** สร้าง Published Version ที่บันทึก Story Snapshot แยกจากข้อมูล Draft
- **Player:** เล่น Visual Novel พร้อมทางเลือกในเนื้อเรื่อง, Save Slot, Auto Save และ My Games
- **Explore:** แสดงเกมที่ Publish แล้วเท่านั้น

**กฎของภาพปก:** Creator Dashboard/Edit Game ใช้รูป Draft ล่าสุด แต่ Explore, Game Details และ My Games ของผู้เล่นต้องใช้รูปจาก **Published Snapshot** จนกว่าจะ Publish เวอร์ชันใหม่

## สิ่งที่ต้องเตรียม

- Git และ Node.js รุ่น LTS พร้อม npm
- บัญชี [TiDB Cloud](https://tidbcloud.com/) และฐานข้อมูลของตนเอง
- บัญชี [Cloudinary](https://cloudinary.com/) สำหรับอัปโหลดรูป
- สำหรับ Deploy: บัญชี [GitHub](https://github.com/), [Render](https://render.com/) และ [Vercel](https://vercel.com/)
- **ไฟล์ SQL Schema ของโปรเจกต์** สำหรับสร้างตารางและ Foreign Keys (ดูหัวข้อ Database)

## 1. Clone Repository

```bash
git clone https://github.com/krittapatj/visual-novel.git
cd visual-novel
```

โครงสร้างหลัก:

```text
visual-novel/
├── backend/
│   ├── src/
│   ├── certs/                 # TLS CA certificate (ถ้าใช้แบบไฟล์)
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vercel.json
└── README.md
```

> ชื่อไฟล์บางส่วนอาจต่างกันตามเวอร์ชันของ Repository ให้ตรวจสอบโครงสร้างจริงก่อนแก้ไข

## 2. เตรียม Database บน TiDB Cloud

1. สร้าง TiDB Cloud Cluster/Database ของตัวเอง เช่น `visual_novel_db`
2. เปิดหน้า Connection Details แล้วจด **Host, Port, Username** และกำหนด Password (เก็บไว้เป็นความลับ)
3. นำ **SQL Schema ของโปรเจกต์** ไปรันเพื่อสร้างตาราง, Indexes และ Foreign Keys **ก่อน** เปิด Backend
4. เพิ่มข้อมูลตั้งต้นที่จำเป็น เช่น `game_categories` หาก Schema ไม่ได้ Seed ไว้
5. ดาวน์โหลด CA Certificate ที่ TiDB Cloud แนะนำสำหรับการเชื่อมต่อแบบ TLS และวางตาม Path ที่ Backend ตั้งค่าไว้

ตารางหลักที่ระบบใช้งาน ได้แก่ `users`, `games`, `game_versions`, `chapters`, `story_nodes`, `story_edges`, `characters`, `character_expressions`, `assets`, `save_slots`, `auto_saves`, `game_categories` และ `game_category_links`

**สำคัญ:** Repository ต้องมี SQL Schema/คำสั่ง Migration ที่ครบและตรงกับโค้ดปัจจุบันเพื่อให้คนอื่นติดตั้งได้จริง หากยังไม่ได้ Commit ไฟล์ดังกล่าว ผู้ติดตั้งต้องขอ Schema จากผู้ดูแลโปรเจกต์ก่อน ไม่ควรสร้างตารางจากการเดาโครงสร้าง

## 3. ตั้งค่า Backend (Local)

เปิด Terminal:

```bash
cd backend
npm install
```

สร้างไฟล์ `backend/.env` โดยใส่ค่าจริงของตัวเอง:

```dotenv
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARACTERS

DB_HOST=YOUR_TIDB_HOST
DB_PORT=4000
DB_USER=YOUR_TIDB_USERNAME
DB_PASSWORD=YOUR_TIDB_PASSWORD
DB_NAME=visual_novel_db
DB_CA_PATH=./certs/isrgrootx1.pem

CLOUDINARY_CLOUD_NAME=YOUR_ACTUAL_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET
```

- `DB_CA_PATH` เป็นตัวอย่าง Path ที่สัมพันธ์กับ `backend/` ต้องตรงกับ Certificate ที่มีจริงและวิธี Resolve Path ใน `src/config/db.js`
- `CLOUDINARY_CLOUD_NAME` ต้องเป็น **Cloud Name จริงจาก Cloudinary Console** ไม่ใช่ Display Name
- `JWT_SECRET` ควรสุ่มอย่างปลอดภัย และต้องไม่เผยแพร่
- หากโค้ดเวอร์ชันที่ Clone ใช้ชื่อ Environment Variables เพิ่มเติม ให้ตั้งค่าตามโค้ดนั้นด้วย

เริ่ม Backend:

```bash
npm run dev
```

หรือ:

```bash
npm start
```

ทดสอบ:

```text
http://localhost:5000/
http://localhost:5000/api/health
http://localhost:5000/api/games
```

Backend ควรเชื่อมต่อ TiDB ได้และส่ง JSON กลับมาโดยไม่มี Error 500

## 4. ตั้งค่า Frontend (Local)

เปิด Terminal อีกหน้าต่างจากโฟลเดอร์หลัก:

```bash
cd frontend
npm install
```

สร้าง `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

เริ่ม Frontend:

```bash
npm run dev
```

เปิด URL ที่ Vite แสดง (ปกติ `http://localhost:5173`)

**ข้อควรระวัง:** Frontend ของโปรเจกต์ใช้ตัวแปร **`VITE_API_URL`** และค่า URL ลงท้ายด้วย `/api` แล้ว ตรวจสอบไม่ให้โค้ดประกอบ URL เป็น `/api/api/...`

## 5. วิธีใช้งานระบบ

### สำหรับผู้สร้างเกม (Creator)

1. สมัครสมาชิก/เข้าสู่ระบบ
2. เปิด **Creator Dashboard** แล้วสร้างเกมใหม่
3. แก้ไขชื่อ คำอธิบาย Cover และ Thumbnail
4. สร้าง Chapter และเปิด **Story Editor**
5. เพิ่ม Story Nodes, Dialogue, Choice และเชื่อมเส้นทางเนื้อเรื่อง
6. อัปโหลดรูปผ่าน **Asset Manager** และเพิ่มตัวละคร/Expression ผ่าน **Character Manager**
7. Preview และตรวจสอบเนื้อเรื่องก่อนเผยแพร่
8. กด **Publish / Publish New Version** เพื่ออัปเดตเกมที่ผู้เล่นมองเห็น

### สำหรับผู้เล่น (Player)

1. เปิดหน้า Explore เพื่อค้นหาเกมที่เผยแพร่แล้ว
2. เปิด Game Details และเริ่มเล่น
3. เลือกคำตอบเพื่อดำเนินเนื้อเรื่อง
4. ใช้ระบบ Save/Continue ตามฟีเจอร์ที่เกมรองรับ
5. เปิด **My Games** เพื่อดูเกมที่เคยเล่น

## 6. Deploy Backend บน Render

1. Push โค้ดขึ้น GitHub Repository ของตัวเอง
2. เข้า [Render Dashboard](https://dashboard.render.com/) → **New → Web Service**
3. เชื่อม GitHub Repository แล้วตั้งค่า:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `npm ci` (หากมี lockfile) หรือ `npm install` |
| Start Command | `npm start` |
| Region | เลือก Region ที่เหมาะสมและมีให้ใช้งาน |

4. เพิ่ม Environment Variables จาก `backend/.env` โดยใช้ค่า Production จริง (ไม่ต้องนำไฟล์ `.env` ขึ้น GitHub)
5. ตั้ง `NODE_ENV=production` และใช้ `JWT_SECRET` ที่ปลอดภัย
6. ตรวจสอบว่า Render อ่าน CA Certificate ของ TiDB ได้จริง (ต้องรวมไฟล์ CA ที่เป็น Public Certificate ไว้ใน Deployment หรือจัดการ Path ให้ถูกต้อง)
7. Deploy และตรวจสอบ Logs ว่า Backend เชื่อมต่อ TiDB ได้
8. เปิด URL Render ของตัวเอง เช่น `https://YOUR-API.onrender.com/api/health`

**อย่าใช้ Local Upload Directory เป็นที่เก็บรูปถาวรบน Render** โปรเจกต์ใช้ Cloudinary สำหรับ Asset ใหม่อยู่แล้ว

## 7. Deploy Frontend บน Vercel

1. สร้างไฟล์ `frontend/vercel.json` (ถ้ายังไม่มี):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

2. Commit และ Push ไฟล์ `frontend/vercel.json` ขึ้น GitHub ด้วย เพื่อป้องกัน 404 เมื่อ Refresh หน้า React Router
3. เข้า [Vercel](https://vercel.com/new) → Import GitHub Repository
4. ตั้งค่า:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

5. เพิ่ม Environment Variable **สำหรับ Production**:

```dotenv
VITE_API_URL=https://YOUR-API.onrender.com/api
```

6. Deploy และคัดลอก URL Vercel จริง เช่น `https://YOUR-FRONTEND.vercel.app`
7. กลับไป Render → Environment → ตั้งค่า:

```dotenv
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app
```

8. บันทึกค่า Render แล้วรอ Service อัปเดต จากนั้น Redeploy Frontend หากเปลี่ยน `VITE_API_URL` หลัง Build

> ตัวแปร `VITE_` ถูกฝังลงใน Frontend Bundle ตอน Build **ห้ามใส่รหัสผ่าน, JWT Secret หรือ Cloudinary API Secret** ลงในตัวแปรเหล่านี้

## 8. ตรวจสอบหลัง Deploy

- [ ] หน้า Home/Explore เปิดได้
- [ ] Refresh URL ลึก เช่น `/creator` แล้วไม่พบ Vercel `404_NOT_FOUND`
- [ ] Register, Login, Logout ทำงานได้
- [ ] Creator สร้างเกมและ Chapter ได้
- [ ] Story Editor โหลด Characters และ Assets ได้
- [ ] อัปโหลดรูปแล้วได้ Cloudinary URL
- [ ] Save รูป Draft ไม่เปลี่ยนรูปใน Explore/My Games จนกว่าจะ Publish ใหม่
- [ ] เล่นเกม, Save Slot และ Continue ได้

## 9. ปัญหาที่พบบ่อย

| ปัญหา | ตรวจสอบ |
| --- | --- |
| Frontend `Failed to fetch` | `VITE_API_URL`, Render URL, Render Logs และ CORS |
| เรียก API แล้ว 404 | มี `/api` ซ้ำหรือไม่ |
| CORS blocked | Render `FRONTEND_URL` ตรงกับ Origin ของ Vercel หรือไม่ |
| TiDB connection failed | Host/Port/User/Password/DB, CA Path, TLS และ Network |
| `Invalid cloud_name` | ใช้ Cloudinary Cloud Name จริง ไม่ใช่ชื่อที่ตั้งเอง |
| Character Dropdown ว่าง | ตรวจสอบ Character API ใน Network Tab และ Game ID |
| My Games แสดงรูป Draft | ตรวจสอบว่าดึงรูปจาก `game_versions.story_snapshot` ไม่ใช่ `games.thumbnail_url` |
| My Games ตอบ 500 | ดู Render Logs และตรวจสอบ Null Handling ของ Published Snapshot |

## 10. ความปลอดภัยและข้อควรระวัง

- ห้าม Commit `.env`, Token, Password, API Secret หรือไฟล์ Private Key
- ใช้ Database และ Cloudinary Account ของตัวเอง ไม่ใช้ Credentials ของผู้พัฒนา
- ตรวจสอบ CORS ให้อนุญาตเฉพาะ Frontend Origins ที่ตั้งใจใช้
- เก็บ Database Backup ก่อนลบข้อมูลหรือเปลี่ยน Schema
- `game_categories` เป็นข้อมูลตั้งต้นของระบบ ไม่ควรลบเมื่อเคลียร์ข้อมูลเกมทดสอบ
- การลบแถวจาก `assets` ไม่ได้ลบไฟล์บน Cloudinary โดยอัตโนมัติ
- ก่อนเปิดให้ผู้ใช้จริง ควรทดสอบสิทธิ์การเข้าถึงและการเผยแพร่เกมอีกครั้ง

## License

ตรวจสอบไฟล์ `LICENSE` ใน Repository ก่อนนำโค้ดไปเผยแพร่ ดัดแปลง หรือใช้เชิงพาณิชย์ หากไม่มีไฟล์ License ให้ติดต่อเจ้าของ Repository เพื่อขออนุญาตก่อน

---

**Visual Novel Platform** — Built with React, Express, TiDB Cloud and Cloudinary.
