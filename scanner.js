// scanner.js - iOS Safari İçin Canvas Destekli Kesin Çözüm
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('cameraFeed');
    const canvas = document.getElementById('scanCanvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    // UI Elementleri
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    const resultTypeBadge = document.getElementById('resultTypeBadge');
    const statusText = document.getElementById('statusText');
    const scanStatusDiv = document.getElementById('scanStatus');
    const mainScanBtn = document.getElementById('mainScanBtn');

    // Okuma Ayarları (Try Harder modu aktif)
    const hints = new Map();
    hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
    ZXing.BarcodeFormat.AZTEC,
    ZXing.BarcodeFormat.CODABAR,
    ZXing.BarcodeFormat.CODE_39,
    ZXing.BarcodeFormat.CODE_93,
    ZXing.BarcodeFormat.CODE_128,
    ZXing.BarcodeFormat.DATA_MATRIX,
    ZXing.BarcodeFormat.EAN_8,
    ZXing.BarcodeFormat.EAN_13,
    ZXing.BarcodeFormat.ITF,
    ZXing.BarcodeFormat.MAXICODE,
    ZXing.BarcodeFormat.PDF_417,
    ZXing.BarcodeFormat.QR_CODE,
    ZXing.BarcodeFormat.RSS_14,
    ZXing.BarcodeFormat.RSS_EXPANDED,
    ZXing.BarcodeFormat.UPC_A,
    ZXing.BarcodeFormat.UPC_E,
    ZXing.BarcodeFormat.UPC_EAN_EXTENSION
]);

    const codeReader = new ZXing.BrowserMultiFormatReader(hints);
    let isScanning = false;
    let scanTimer = null;

    // 1. Kamerayı Yüksek Çözünürlükle Başlat
    async function startCamera() {
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 }, // İnce çizgileri yakalamak için Full HD istiyoruz
                height: { ideal: 1080 }
            },
            audio: false
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            video.setAttribute('playsinline', true); // iOS Safari için kritik
            video.muted = true;
            await video.play();

            startScanningLoop();
        } catch (err) {
            console.error("Kamera açma hatası:", err);
            if (statusText) statusText.innerText = "Kamera İzni Gerekli!";
        }
    }

    // 2. iOS'un Çözünürlüğü Düşürmesini Engelleyen Manuel Canvas Döngüsü
    function startScanningLoop() {
        isScanning = true;
        mainScanBtn.classList.add('active');
        document.getElementById('scanBtnLabel').innerText = "Taramayı Durdur";
        scanStatusDiv.classList.remove('idle');
        if (statusText) statusText.innerText = "Taranıyor...";

        // Saniyede 4 kez (her 250ms) videodan HD kare yakala
        scanTimer = setInterval(async () => {
            if (!isScanning) return;

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                // Gizli canvas boyutunu kameranın gerçek çözünürlüğüne eşitle
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                // O anki video karesini canvas'a çiz (Bulanıklık önlenir)
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                try {
                    // Kütüphaneye doğrudan bu saf ve net görüntüyü besle
                    const result = await codeReader.decodeFromCanvas(canvas);
                    if (result && isScanning) {
                        handleSuccess(result);
                    }
                } catch (e) {
                    // Kod bulunamadığında ZXing hata fırlatır, döngünün sürmesi için bunu boş geçiyoruz
                }
            }
        }, 250); 
    }

    // 3. Başarılı Okuma Durumu
    function handleSuccess(result) {
        isScanning = false; // Yeni okumaları geçici olarak kilitle
        
        if (navigator.vibrate) navigator.vibrate(150);

        // Sonuçları ekrana bas
        resultTypeBadge.innerText = result.barcodeFormat.replace(/_/g, ' ');
        resultContent.innerText = result.text;
        resultCard.classList.remove('hidden');

        scanStatusDiv.classList.remove('idle');
        scanStatusDiv.classList.add('success');
        if (statusText) statusText.innerText = "Başarılı!";

        // 3 saniye sonra taramayı otomatik olarak yeniden aktif et
        setTimeout(() => {
            scanStatusDiv.classList.remove('success');
            resultCard.classList.add('hidden');
            
            if (mainScanBtn.classList.contains('active')) {
                isScanning = true;
                if (statusText) statusText.innerText = "Taranıyor...";
            } else {
                if (statusText) statusText.innerText = "Beklemede";
            }
        }, 3000);
    }

    function stopScanningMode() {
        isScanning = false;
        if (scanTimer) clearInterval(scanTimer);
        mainScanBtn.classList.remove('active');
        document.getElementById('scanBtnLabel').innerText = "Taramayı Başlat";
        scanStatusDiv.classList.add('idle');
        if (statusText) statusText.innerText = "Beklemede";
    }

    // Buton Kontrolü
    mainScanBtn.addEventListener('click', () => {
        if (mainScanBtn.classList.contains('active')) {
            stopScanningMode();
        } else {
            startScanningLoop();
            resultCard.classList.add('hidden');
        }
    });

    startCamera();
});
