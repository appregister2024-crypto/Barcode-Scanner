const express = require('express');
const path = require('path');
const fs = require('fs'); // Eski dosyayı okumak için geçici olarak geri ekledik
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🌐 MONGODB BULUT BAĞLANTI AYARI
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cuzdanim';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('🎯 Başarılı: MongoDB Bulut Veritabanına Bağlanıldı!');
        // Bağlantı kurulduktan hemen sonra eski verileri buluta taşımayı dene
        tasigoEskiVerileriBuluta();
    })
    .catch(err => console.error('❌ Hata: Veritabanı bağlantısı başarısız:', err));

// 📝 VERİTABANI ŞABLONU (SCHEMA)
const transactionSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    type: String,
    incomeType: String,
    fixVarType: String,
    amount: Number,
    category: String,
    description: String,
    isRecurring: Boolean,
    recurringDay: String
}, { versionKey: false });

const Transaction = mongoose.model('Transaction', transactionSchema);

// 📦 SİHİRLİ OTOMATİK VERİ TAŞIMA KÖPRÜSÜ
async function tasigoEskiVerileriBuluta() {
    try {
        // Bulut veritabanında kaç kayıt var kontrol et
        const bulutKayitSayisi = await Transaction.countDocuments();
        const jsonDosyaYolu = path.join(__dirname, 'veriler.json');

        // Eğer bulut bomboşsa ve GitHub'dan gelen veriler.json dosyası varsa aktarımı başlat
        if (bulutKayitSayisi === 0 && fs.existsSync(jsonDosyaYolu)) {
            console.log('📂 Eski veriler.json dosyası saptandı, buluta aktarım başlıyor...');
            
            const dosyaIcerigi = fs.readFileSync(jsonDosyaYolu, 'utf-8');
            const eskiVeriler = JSON.parse(dosyaIcerigi || '[]');

            if (eskiVeriler.length > 0) {
                // Tüm eski kayıtları tek bir hamlede MongoDB'ye enjekte et
                await Transaction.insertMany(eskiVeriler);
                console.log(`✅ BAŞARILI: ${eskiVeriler.length} adet eski bütçe kaydı MongoDB bulutuna başarıyla taşındı!`);
            } else {
                console.log('ℹ️ Bilgi: veriler.json dosyası boş olduğu için aktarım yapılmadı.');
            }
        }
    } catch (hata) {
        console.error('❌ Hata: Eski veriler buluta taşınırken bir problem oluştu:', hata);
    }
}

// 🛠️ API ENDPOINT'LERİ

// 1. Tüm Kayıtları Getir
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find({});
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: "Veriler buluttan çekilemedi." });
    }
});

// 2. Yeni Kayıt Ekle
app.post('/api/transactions', async (req, res) => {
    try {
        const newTransaction = new Transaction(req.body);
        await newTransaction.save();
        res.status(201).json(newTransaction);
    } catch (error) {
        res.status(500).json({ error: "Veri bulut veritabanına kaydedilemedi." });
    }
});

// 3. Mevcut Kaydı Güncelle
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updated = await Transaction.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (updated) {
            res.json(updated);
        } else {
            res.status(404).json({ error: "Güncellenecek kayıt bulunamadı." });
        }
    } catch (error) {
        res.status(500).json({ error: "Bulut üzerinde güncelleme başarısız." });
    }
});

// 4. Kayıt Sil
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await Transaction.findOneAndDelete({ id: id });
        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Silinecek kayıt bulunamadı." });
        }
    } catch (error) {
        res.status(500).json({ error: "Bulut üzerinden silme işlemi başarısız." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Uygulama bulut üzerinde, PORT: ${PORT} üzerinden yayında!`);
});
