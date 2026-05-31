// scanner.js - Sadeleştirilmiş Standart Sürüm
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('cameraFeed');
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    const resultTypeBadge = document.getElementById('resultTypeBadge');
    const statusText = document.getElementById('statusText');
    const scanStatusDiv = document.getElementById('scanStatus');
    const mainScanBtn = document.getElementById('mainScanBtn');

    const hints = new Map();
    hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.EAN_13,
        ZXing.BarcodeFormat.QR_CODE
    ]);

    const codeReader = new ZXing.BrowserMultiFormatReader(hints);
    let isScanning = true;

    async function startCamera() {
        if (statusText) statusText.innerText = "Kamera açılıyor...";
        try {
            // iOS için en ideal video kısıtlamaları
            const constraints = {
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            };

            await codeReader.decodeFromConstraints(constraints, 'cameraFeed', (result, err) => {
                if (result && isScanning) {
                    isScanning = false;
                    if (navigator.vibrate) navigator.vibrate(150);

                    // Sonucu ekrana bas
                    resultTypeBadge.innerText = result.barcodeFormat.replace(/_/g, ' ');
                    resultContent.innerText = result.text;
                    resultCard.classList.remove('hidden');

                    scanStatusDiv.classList.remove('idle');
                    scanStatusDiv.classList.add('success');
                    if (statusText) statusText.innerText = "Başarılı!";

                    setTimeout(() => {
                        scanStatusDiv.classList.remove('success');
                        resultCard.classList.add('hidden');
                        if (mainScanBtn.classList.contains('active')) {
                            isScanning = true;
                            if (statusText) statusText.innerText = "Taranıyor...";
                        }
                    }, 3000);
                }
            });

            mainScanBtn.classList.add('active');
            if (statusText) statusText.innerText = "Taranıyor...";

        } catch (err) {
            console.error("Kamera başlatılamadı:", err);
            if (statusText) statusText.innerText = "Kamera Hatası";
        }
    }

    mainScanBtn.addEventListener('click', () => {
        if (mainScanBtn.classList.contains('active')) {
            isScanning = false;
            mainScanBtn.classList.remove('active');
            scanStatusDiv.classList.add('idle');
            if (statusText) statusText.innerText = "Beklemede";
        } else {
            isScanning = true;
            mainScanBtn.classList.add('active');
            scanStatusDiv.classList.remove('idle');
            if (statusText) statusText.innerText = "Taranıyor...";
            resultCard.classList.add('hidden');
        }
    });

    startCamera();
});
