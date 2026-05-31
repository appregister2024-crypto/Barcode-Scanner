// scanner.js - Tüm Barkodlar ve iOS Optimizasyonu
document.addEventListener('DOMContentLoaded', async () => {
    const permissionOverlay = document.getElementById('permissionOverlay');
    const requestPermissionBtn = document.getElementById('requestPermission');
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    const resultTypeBadge = document.getElementById('resultTypeBadge');
    const statusText = document.getElementById('statusText');
    const scanStatusDiv = document.getElementById('scanStatus');

    // Herhangi bir format kısıtlaması yok (Tüm barkodları okur)
    const codeReader = new ZXing.BrowserMultiFormatReader();
    let isScanning = true;

    async function startCamera() {
        try {
            // iOS için kamerayı doğrudan arka kamera (environment) olarak zorluyoruz
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 }, // iOS'ta daha iyi netlik için
                    height: { ideal: 720 }
                }
            };

            // Kamerayı başlat (Cihaz ID'si yerine constraints kullanıyoruz, iOS'ta daha stabildir)
            await codeReader.decodeFromConstraints(constraints, 'cameraFeed', (result, err) => {
                if (result && isScanning) {
                    isScanning = false; 

                    // Titreşim (iOS'ta sadece kullanıcı etkileşimiyle çalışabilir, ama ekliyoruz)
                    if (navigator.vibrate) navigator.vibrate(200);
                    
                    // Sonucu ekrana yazdır
                    resultTypeBadge.innerText = result.barcodeFormat.replace(/_/g, ' '); 
                    resultContent.innerText = result.text;
                    resultCard.classList.remove('hidden');
                    
                    scanStatusDiv.classList.remove('idle');
                    scanStatusDiv.classList.add('success');
                    statusText.innerText = "Başarılı!";

                    // 3 saniye bekle, sonra yeniden taramaya hazır hale gel
                    setTimeout(() => {
                        isScanning = true;
                        resultCard.classList.add('hidden');
                        scanStatusDiv.classList.remove('success');
                        statusText.innerText = "Taranıyor...";
                    }, 3000);
                }
                
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error("Tarama hatası:", err);
                }
            });

            permissionOverlay.classList.add('hidden');

        } catch (error) {
            console.error("Kamera başlatılamadı:", error);
            // Hata varsa manuel izin butonunu göster
            permissionOverlay.classList.remove('hidden');
        }
    }

    if (requestPermissionBtn) {
        requestPermissionBtn.addEventListener('click', startCamera);
    }

    // Doğrudan başlatmayı dene
    startCamera();
});
