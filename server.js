const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🌐 MONGODB BULUT BAĞLANTI AYARI
// Render ortamındaki gizli MONGO_URI değişkenine bağlanır, yoksa lokale bağlanmayı dener
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cuzdanim';

mongoose.connect(MONGO_URI)
    .then(() => console.log('🎯 Başarılı: MongoDB Bulut Veritabanına Bağlanıldı!'))
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

// 🛠️ API ENDPOINT'LERİ (Artık JSON dosyası yerine doğrudan bulut DB ile konuşuyor)

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

// 3. Mevcut Kaydı Güncelle (Fiyat uçma sorununu çözen ana nokta)
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
