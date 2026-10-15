# Visual Novel — Database setup

ไฟล์นี้สร้างฐานข้อมูลสำหรับ **การติดตั้งใหม่ใน TiDB Cloud** โดยใช้โครงสร้างที่ส่งมาจากโปรเจกต์ Visual Novel จำนวน 13 ตาราง

## 1. สร้างฐานข้อมูล

สร้าง TiDB Cloud Cluster/Database ของคุณเอง และเปิด SQL Editor จากนั้นเลือกฐานข้อมูลใหม่ที่ว่างเปล่า เช่น `visual_novel_db` (หากต้องสร้างเอง ใช้ `CREATE DATABASE visual_novel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` และ `USE visual_novel_db;` ตามความสามารถของ SQL Editor)

ตรวจสอบก่อนนำเข้า:

```sql
SELECT DATABASE();
SHOW TABLES;
```

**สำคัญ:** `schema.sql` ออกแบบสำหรับฐานข้อมูลใหม่ที่ยังไม่มีตาราง ไม่ควรรันซ้ำบนฐานข้อมูลเดิม เพราะจะเกิด `Table already exists` และไม่ใช่ไฟล์ Migration

## 2. สร้างตาราง

เปิด `schema.sql` แล้วรันตามลำดับคำสั่งในไฟล์ โดยเฉพาะ `ALTER TABLE games` ที่เพิ่ม Foreign Key หลังสร้าง `game_versions` แล้ว ห้ามสลับลำดับ

## 3. เพิ่มหมวดหมู่เริ่มต้น

รัน `seed.sql` เพื่อเพิ่ม 10 หมวดหมู่ (Romance, Fantasy, Mystery, Horror, Adventure, Drama, Comedy, Sci-Fi, Slice of Life, Action)

## 4. ตรวจสอบ

```sql
SHOW TABLES;
SELECT COUNT(*) AS total_categories FROM game_categories;
SELECT * FROM game_categories ORDER BY category_id;
```

ควรมี 13 ตารางและ 10 หมวดหมู่ (เมื่อเป็นฐานข้อมูลใหม่)

## 5. เชื่อม Backend

ตั้งค่า Environment Variables ของ `backend` ตาม `backend/.env.example` (หากมี) หรือ README หลักของ Repository ได้แก่ `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` และ `DB_CA_PATH` รวมถึง `JWT_SECRET` และ Cloudinary credentials ห้าม Commit `.env` ขึ้น GitHub

## หมายเหตุ

- ไม่มีบัญชีผู้ใช้หรือข้อมูลเกมทดสอบในชุดนี้
- ไม่ได้เพิ่ม Foreign Keys ให้ `auto_saves` เพราะต้นฉบับไม่มี Foreign Keys ประกาศไว้
- ไม่ได้คัดลอกค่า `AUTO_INCREMENT` สูง ๆ จากฐานข้อมูลทดสอบ
- ยังไม่ได้ทดสอบรัน SQL บน TiDB Cloud จริง โปรดทดสอบกับฐานข้อมูลใหม่ก่อนเผยแพร่เป็นชุดติดตั้งที่ยืนยันแล้ว
