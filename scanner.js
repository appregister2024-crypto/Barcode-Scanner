// scanner.js - Cihazın Kendi Native Tarayıcısını Kullanan Kararlı Sürüm
document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('cameraFeed');
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    const resultTypeBadge = document.getElementById('resultTypeBadge');
    const statusText = document.getElementById('statusText');
    const scanStatusDiv = document.getElementById('scanStatus');
    const mainScanBtn = document.getElementById('mainScanBtn');

    // 1. Tarayıcının Native Barkod Motorunu Destekleyip Desteklemediğini Kontrol Et
    if (!('BarcodeDetector' in window)) {
        alert("Tarayıcınız güncel native Barkod API'sini desteklemiyor. Lütfen güncel Safari veya Chrome kullanın.");
        if (statusText) statusText.innerText = "Desteklenmeyen Tarayıcı";
        return;
    }

    // Okunmasını istediğimiz formatları sisteme kaydediyoruz
    const barcodeDetector = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'qr_code', 'code_128', 'code_39']
    });

    let isScanning = true;
    let animationFrameId = null;

    // 2. Kamerayı Standart Standartlarda Başlat
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            video.srcObject = stream;
            video.setAttribute('playsinline', true);
            await video.play();
            
            if (statusText) statusText.innerText = "Taranıyor...";
            startScanLoop();
        } catch (err) {
            console.error("Kamera izni veya başlatma hatası:", err);
            if (statusText) statusText.innerText = "Kamera Hatası!";
        }
    }

    // 3. İşlemciyi Yormayan, Doğrudan Donanımı Kullanan Akıcı Tarama Döngüsü
    function startScanLoop() {
        async function checkFrame() {
            if (!isScanning) {
                animationFrameId = requestAnimationFrame(checkFrame);
                return;
            }

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                try {
                    // Apple'ın kendi işletim sistemi arkada görüntüyü analiz eder
                    const barcodes = await barcodeDetector.detect(video);
                    if (barcodes.length > 0) {
                        handleSuccess(barcodes[0]); // İlk bulduğu barkodu işle
                    }
                } catch (err) {
                    console.error("Tarama hatası:", err);
                }
            }
            animationFrameId = requestAnimationFrame(checkFrame);
        }
        animationFrameId = requestAnimationFrame(checkFrame);
    }

    // 4. Başarılı Sonuç Yönetimi
    function handleSuccess(barcode) {
        isScanning = false; // Üst üste binlerce kez okumaması için kilitle
        
        if (navigator.vibrate) navigator.vibrate(150);

        // Sonuçları şık arayüz kartına yerleştir
        resultTypeBadge.innerText = barcode.format.toUpperCase().replace('_', ' ');
        resultContent.innerText = barcode.rawValue;
        resultCard.classList.remove('hidden');

        scanStatusDiv.classList.remove('idle');
        scanStatusDiv.classList.add('success');
        if (statusText) statusText.innerText = "Başarılı!";

        // 3 saniye sonra kullanıcıya yeni tarama şansı tanı
        setTimeout(() => {
            scanStatusDiv.classList.remove('success');
            resultCard.classList.add('hidden');
            if (mainScanBtn.classList.contains('active')) {
                isScanning = true;
                if (statusText) statusText.innerText = "Taranıyor...";
            }
        }, 3000);
    }

    // Büyük Yuvarlak Buton Kontrolü
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
