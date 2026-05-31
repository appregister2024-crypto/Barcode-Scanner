// scanner.js - iOS Kararlı ve Siyah Ekran Engelleyici Sürüm
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('cameraFeed');
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    const resultTypeBadge = document.getElementById('resultTypeBadge');
    const statusText = document.getElementById('statusText');
    const scanStatusDiv = document.getElementById('scanStatus');
    const mainScanBtn = document.getElementById('mainScanBtn');

    // 1. Kütüphane Ayarları (Sadece EAN ve QR odaklı)
    const hints = new Map();
    hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.EAN_13,
        ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.QR_CODE,
        ZXing.BarcodeFormat.CODE_128
    ]);

    const codeReader = new ZXing.BrowserMultiFormatReader(hints);
    let isScanning = true;

    // Sonuç Başarılı Olduğunda Çalışacak Fonksiyon
    function handleResult(result) {
        isScanning = false; // Üst üste binlerce kez okumayı engelle
        if (navigator.vibrate) navigator.vibrate(150);

        // Arayüze sonuçları yazdır
        resultTypeBadge.innerText = result.barcodeFormat.replace(/_/g, ' ');
        resultContent.innerText = result.text;
        resultCard.classList.remove('hidden');

        scanStatusDiv.classList.remove('idle');
        scanStatusDiv.classList.add('success');
        if (statusText) statusText.innerText = "Başarılı!";

        // 3 saniye sonra sistemi yeni tarama için sıfırla
        setTimeout(() => {
            scanStatusDiv.classList.remove('success');
            resultCard.classList.add('hidden');
            if (mainScanBtn.classList.contains('active')) {
                isScanning = true;
                if (statusText) statusText.innerText = "Taranıyor...";
            }
        }, 3000);
    }

    // 2. Kamerayı Güvenli Başlatma Döngüsü
    async function startCamera() {
        if (statusText) statusText.innerText = "Kamera açılıyor...";

        // iOS Arka Kamera İçin En Katı Kural (Exact environment)
        const primaryConstraints = {
            video: { facingMode: { exact: "environment" } },
            audio: false
        };

        try {
            await codeReader.decodeFromConstraints(primaryConstraints, 'cameraFeed', (result, err) => {
                if (result && isScanning) handleResult(result);
            });
            setUItoScanning();
        } catch (error) {
            console.log("Katı kamera kuralı başarısız, esnek moda geçiliyor...", error);
            
            // YEDEK PLAN (Fallback): Üstteki kural hata verirse cihazın bulabildiği ilk kamerayı açar
            try {
                const fallbackConstraints = { video: { facingMode: "environment" } };
                await codeReader.decodeFromConstraints(fallbackConstraints, 'cameraFeed', (result, err) => {
                    if (result && isScanning) handleResult(result);
                });
                setUItoScanning();
            } catch (finalError) {
                console.error("Kamera tamamen başarısız:", finalError);
                if (statusText) statusText.innerText = "Kamera İzni Gerekli!";
            }
        }
    }

    function setUItoScanning() {
        mainScanBtn.classList.add('active');
        document.getElementById('scanBtnLabel').innerText = "Taramayı Durdur";
        scanStatusDiv.classList.remove('idle');
        if (statusText) statusText.innerText = "Taranıyor...";
    }

    // Buton Aç / Kapat Fonksiyonu
    mainScanBtn.addEventListener('click', () => {
        if (mainScanBtn.classList.contains('active')) {
            isScanning = false;
            mainScanBtn.classList.remove('active');
            document.getElementById('scanBtnLabel').innerText = "Taramayı Başlat";
            scanStatusDiv.classList.add('idle');
            if (statusText) statusText.innerText = "Beklemede";
        } else {
            isScanning = true;
            mainScanBtn.classList.add('active');
            document.getElementById('scanBtnLabel').innerText = "Taramayı Durdur";
            scanStatusDiv.classList.remove('idle');
            if (statusText) statusText.innerText = "Taranıyor...";
            resultCard.classList.add('hidden');
        }
    });

    startCamera();
});
