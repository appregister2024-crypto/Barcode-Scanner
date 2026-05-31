// app.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. DİL BAŞLATMA (data-tr niteliklerini elementlerin içine yazar)
    function initLanguage() {
        document.querySelectorAll('[data-tr]').forEach(el => {
            el.innerText = el.getAttribute('data-tr');
        });
    }
    initLanguage();

    // 2. SEKME GEÇİŞLERİ
    const tabBtns = document.querySelectorAll('.tab-nav .tab-btn');
    const tabPanels = document.querySelectorAll('.main-content .tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

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

    // 3. AYARLAR MODAL KONTROLÜ
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');

    if (settingsBtn && settingsModal && closeSettings) {
        settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
        closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.add('hidden');
        });
    }

    // 4. KOPYALAMA FONKSİYONU
    const copyResultBtn = document.getElementById('copyResultBtn');
    const resultContent = document.getElementById('resultContent');
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');

    if (copyResultBtn && resultContent && toast) {
        copyResultBtn.addEventListener('click', () => {
            const text = resultContent.innerText;
            if (text) {
                navigator.clipboard.writeText(text).then(() => {
                    if (toastText) toastText.innerText = "Kopyalandı!";
                    toast.classList.remove('hidden');
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 2000);
                });
            }
        });
    }
});
