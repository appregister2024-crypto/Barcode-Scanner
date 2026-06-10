const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'veriler.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Geliştirilmiş Okuma Fonksiyonu (Hata Detayını Gösterir)
function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
        return [];
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    try {
        return JSON.parse(content || '[]');
    } catch (parseError) {
        console.error("❌ HATA: veriler.json dosyası okunurken JSON format hatası saptandı!");
        console.error("Lütfen dosyanın içindeki süslü ve köşeli parantezleri kontrol edin.");
        return []; // Hata durumunda uygulamanın çökmemesi için boş liste döner
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Tarayıcı verileri istediğinde terminale rapor yazar
app.get('/api/transactions', (req, res) => {
    const transactions = readData();
    console.log(`📊 Sunucu: veriler.json başarıyla okundu. Toplam kayıt sayısı: ${transactions.length}`);
    res.json(transactions);
});

app.post('/api/transactions', (req, res) => {
    try {
        const transactions = readData();
        const newTransaction = req.body;
        transactions.push(newTransaction);
        writeData(transactions);
        res.status(201).json(newTransaction);
    } catch (error) {
        res.status(500).json({ error: "Veri kaydedilemedi." });
    }
});

app.put('/api/transactions/:id', (req, res) => {
    try {
        const transactions = readData();
        const id = parseInt(req.params.id);
        const updatedIndex = transactions.findIndex(t => t.id === id);

        if (updatedIndex !== -1) {
            transactions[updatedIndex] = { ...transactions[updatedIndex], ...req.body };
            writeData(transactions);
            res.json(transactions[updatedIndex]);
        } else {
            res.status(404).json({ error: "Kayıt bulunamadı." });
        }
    } catch (error) {
        res.status(500).json({ error: "Güncellenemedi." });
    }
});

app.delete('/api/transactions/:id', (req, res) => {
    try {
        const transactions = readData();
        const id = parseInt(req.params.id);
        const filtered = transactions.filter(t => t.id !== id);
        writeData(filtered);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Silinemedi." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Sunucu http://localhost:${PORT} adresinde aktif!`);
});