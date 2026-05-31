// scanner.js
document.addEventListener('DOMContentLoaded', async () => {
    const videoElement = document.getElementById('cameraFeed');
    const permissionOverlay = document.getElementById('permissionOverlay');
    const requestPermissionBtn = document.getElementById('requestPermission');
    
    // UI Elementleri (Sonucu ekranda göstermek için)
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    const resultTypeBadge = document.getElementById('resultTypeBadge');
    const statusText = document.getElementById('statusText');
    const scanStatusDiv = document.getElementById('scanStatus');

    // SADECE GÜVENİLİR FORMATLARI BELİRLEYELİM (Yanlış okumaları engeller)
    const hints = new Map();
    const formats = [
        ZXing.BarcodeFormat.QR_CODE,
        ZXing.BarcodeFormat.EAN_13,   // Market ürünleri
        ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.CODE_128, // Kargo/Lojistik
        ZXing.BarcodeFormat.UPC_A
    ];
    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);

    // Kütüphaneyi format kısıtlamalarıyla başlat
    const codeReader = new ZXing.BrowserMultiFormatReader(hints);
    
    let isScanning = true; // Döngüyü kırmak için kontrol bayrağı

    async function startCamera() {
        try {
            const videoInputDevices = await codeReader.listVideoInputDevices();
            
            if (videoInputDevices.length === 0) {
                console.error("Kamera bulunamadı!");
                return;
            }

            // Arka kamerayı seç
            let selectedDeviceId = videoInputDevices[0].deviceId;
            const backCamera = videoInputDevices.find(device => 
                device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('arka') ||
                device.label.toLowerCase().includes('environment')
            );
            
            if (backCamera) {
                selectedDeviceId = backCamera.deviceId;
            }

            // Taramayı başlat
            codeReader.decodeFromVideoDevice(selectedDeviceId, 'cameraFeed', (result, err) => {
                // Eğer başarılı bir sonuç varsa VE şu an tarama modundaysak
                if (result && isScanning) {
                    
                    // 1. Yeni okumaları geçici olarak durdur (Sürekli alert/okuma döngüsünü engeller)
                    isScanning = false; 

                    // 2. Ses efekti/Titreşim eklenebilir (opsiyonel)
                    if (navigator.vibrate) navigator.vibrate(200);
                    
                    // 3. Sonucu tasarladığınız UI kartına yazdır
                    resultTypeBadge.innerText = result.barcodeFormat.replace(/_/g, ' '); // Örn: EAN_13 -> EAN 13
                    resultContent.innerText = result.text;
                    resultCard.classList.remove('hidden'); // Kartı göster
                    
                    // 4. Durum çubuğunu güncelle
                    scanStatusDiv.classList.remove('idle');
                    scanStatusDiv.classList.add('success');
                    statusText.innerText = "Başarılı!";

                    // 5. 3 Saniye sonra yeni tarama için sistemi sıfırla
                    setTimeout(() => {
                        isScanning = true;
                        resultCard.classList.add('hidden'); // Kartı gizle
                        scanStatusDiv.classList.remove('success');
                        statusText.innerText = "Taranıyor...";
                    }, 3000);
                }
                
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error(err);
                }
            });

            permissionOverlay.classList.add('hidden');

        } catch (error) {
            console.error("Kamera başlatılırken hata oluştu:", error);
            permissionOverlay.classList.remove('hidden');
        }
    }

    if (requestPermissionBtn) {
        requestPermissionBtn.addEventListener('click', startCamera);
    }

    startCamera();
});
