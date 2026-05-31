// app.js - Arayüz ve UI Fonksiyonları
document.addEventListener('DOMContentLoaded', () => {
    // ---- Sekme (Tab) Geçişleri ----
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Aktif buton stilini değiştir
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // İlgili paneli göster
            const targetTab = btn.getAttribute('data-tab');
            tabPanels.forEach(panel => {
                if (panel.id === `tab-${targetTab}`) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            });
        });
    });

    // ---- Ayarlar Modalı ----
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');

    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    
    closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
    
    // Modal dışına tıklayınca kapatma
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    // ---- Sonuç Kartı Butonları ----
    const copyResultBtn = document.getElementById('copyResultBtn');
    const resultContent = document.getElementById('resultContent');
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');

    function showToast(message) {
        toastText.innerText = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    copyResultBtn.addEventListener('click', () => {
        const text = resultContent.innerText;
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Kopyalandı!');
            }).catch(err => {
                console.error('Kopyalama başarısız:', err);
            });
        }
    });
});