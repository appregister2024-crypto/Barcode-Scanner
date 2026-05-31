// scanner.js - iOS 1D/2D Barkod Odaklı Kesin Çözüm
document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('cameraFeed');
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    const resultTypeBadge = document.getElementById('resultTypeBadge');
    const statusText = document.getElementById('statusText');
    const scanStatusDiv = document.getElementById('scanStatus');
    
    const flashBtn = document.getElementById('flashBtn');
    const mainScanBtn = document.getElementById('mainScanBtn');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = document.getElementById('zoomValue');

    // 1. KÜTÜPHANEYİ ÖZEL AYARLARLA YAPILANDIRALIM
    const hints = new Map();
    
    // Çizgilerin bulanıklaşmasını önlemek için derinlemesine analiz modunu açıyoruz
    hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
    
    // Hem QR hem de görseldeki gibi tüm standart ürün barkod formatlarını kesin olarak tanımlıyoruz
    const formats = [
        ZXing.BarcodeFormat.QR_CODE,
        ZXing.BarcodeFormat.EAN_13,
        ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.CODE_128,
        ZXing.BarcodeFormat.CODE_39,
        ZXing.BarcodeFormat.UPC_A
    ];
    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);

    const codeReader = new ZXing.BrowserMultiFormatReader(hints);
    let isScanning = true; 
    let videoTrack = null;
    let localStream = null;

    // 2. iOS SAFARI İÇİN EN KARARLI KAMERA BAĞLANTI YÖNTEMİ
    async function startCamera() {
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            },
            audio: false
        };

        try {
            // Kamerayı manüel olarak başlatıp video elementine bağlıyoruz
            localStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = localStream;
            videoElement.setAttribute('playsinline', true); // iOS Safari zorunluluğu
            await videoElement.play();

            videoTrack = localStream.getVideoTracks()[0];
            initCameraCapabilities();

            // Taramayı doğrudan video akışı üzerinden başlatıyoruz
            codeReader.decodeFromVideoElement(videoElement, (result, err) => {
                if (result && isScanning) {
                    
                    // Sürekli veya tekli tarama kontrolü
                    const isContinuous = document.getElementById('modeContinuous').classList.contains('active');
                    if (!isContinuous) {
                        stopScanningMode();
                    } else {
                        // Sürekli modda aynı kodu saliseler içinde üst üste okumaması için kısa bir duraksama
                        isScanning = false;
                        setTimeout(() => { if(mainScanBtn.classList.contains('active')) isScanning = true; }, 2000);
                    }

                    // Titreşim geri bildirimi
                    if (navigator.vibrate) navigator.vibrate(150);

                    // Sonuçları arayüze bas
                    resultTypeBadge.innerText = result.barcodeFormat.replace(/_/g, ' ');
                    resultContent.innerText = result.text;
                    resultCard.classList.remove('hidden');

                    scanStatusDiv.classList.remove('idle');
                    scanStatusDiv.classList.add('success');
                    if (statusText) statusText.innerText = "Başarılı!";
                    
                    setTimeout(() => {
                        scanStatusDiv.classList.remove('success');
                        if (isScanning && statusText) statusText.innerText = "Taranıyor...";
                    }, 2000);
                }
            });

            startScanningMode();

        } catch (error) {
            console.error("Kamera bağlantı hatası:", error);
            if (statusText) statusText.innerText = "Kamera Başlatılamadı";
        }
    }

    // Donanım yeteneklerini (Zoom/Flaş) denetle
    function initCameraCapabilities() {
        if (!videoTrack) return;
        try {
            const capabilities = videoTrack.getCapabilities();
            if (capabilities.zoom) {
                zoomSlider.min = capabilities.zoom.min;
                zoomSlider.max = capabilities.zoom.max;
                zoomSlider.step = 0.1;
                zoomSlider.value = videoTrack.getSettings().zoom || 1;
                zoomValue.innerText = parseFloat(zoomSlider.value).toFixed(1) + 'x';
            }
        } catch (e) {
            console.log("Cihaz zoom yetenekleri alınamadı.");
        }
    }

    function startScanningMode() {
        isScanning = true;
        mainScanBtn.classList.add('active');
        document.getElementById('scanBtnLabel').innerText = "Taramayı Durdur";
        scanStatusDiv.classList.remove('idle');
        if (statusText) statusText.innerText = "Taranıyor...";
    }

    function stopScanningMode() {
        isScanning = false;
        mainScanBtn.classList.remove('active');
        document.getElementById('scanBtnLabel').innerText = "Taramayı Başlat";
        scanStatusDiv.classList.add('idle');
        if (statusText) statusText.innerText = "Beklemede";
    }

    // ---- Buton Kontrolleri ----

    // Ana Büyük Buton: Taramayı Manuel Aç/Kapat
    mainScanBtn.addEventListener('click', () => {
        if (isScanning) {
            stopScanningMode();
        } else {
            startScanningMode();
            resultCard.classList.add('hidden');
        }
    });

    // Flaş Kontrolü
    flashBtn.addEventListener('click', async () => {
        if (!videoTrack) return;
        try {
            const settings = videoTrack.getSettings();
            const capabilities = videoTrack.getCapabilities();
            
            if (capabilities.torch) {
                const torchState = !settings.torch;
                await videoTrack.applyConstraints({
                    advanced: [{ torch: torchState }]
                });
                flashBtn.classList.toggle('active', torchState);
            }
        } catch (err) {
            console.error("Flaş kontrolü bu tarayıcıda desteklenmiyor:", err);
        }
    });

    // Zoom Çubuğu
    zoomSlider.addEventListener('input', async (e) => {
        const val = e.target.value;
        zoomValue.innerText = parseFloat(val).toFixed(1) + 'x';
        if (videoTrack && videoTrack.getCapabilities().zoom) {
            try {
                await videoTrack.applyConstraints({ advanced: [{ zoom: val }] });
            } catch (err) {
                console.error("Zoom uygulanamadı:", err);
            }
        }
    });

    // Mod Seçimleri
    const modeContinuous = document.getElementById('modeContinuous');
    const modeSingle = document.getElementById('modeSingle');

    modeContinuous.addEventListener('click', () => {
        modeContinuous.classList.add('active');
        modeSingle.classList.remove('active');
    });
    modeSingle.addEventListener('click', () => {
        modeSingle.classList.add('active');
        modeContinuous.classList.remove('active');
    });

    startCamera();
});
