// scanner.js
document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('cameraFeed');
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    const resultTypeBadge = document.getElementById('resultTypeBadge');
    const statusText = document.getElementById('statusText');
    const scanStatusDiv = document.getElementById('scanStatus');
    
    // Arayüz Kontrolleri
    const flashBtn = document.getElementById('flashBtn');
    const mainScanBtn = document.getElementById('mainScanBtn');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = document.getElementById('zoomValue');

    const codeReader = new ZXing.BrowserMultiFormatReader();
    let isScanning = false; 
    let videoTrack = null;

    async function startCamera() {
        try {
            // Çözünürlük ve aspect ratio (en-boy oranı) kısıtlaması getirerek esnemeyi önlüyoruz
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    aspectRatio: { ideal: 1.7777777778 } // 16:9 standart oran
                }
            };

            // Kamerayı video etiketine bağla ve tarama döngüsünü başlat
            await codeReader.decodeFromConstraints(constraints, 'cameraFeed', (result, err) => {
                if (!videoTrack && videoElement.srcObject) {
                    videoTrack = videoElement.srcObject.getVideoTracks()[0];
                    initCameraCapabilities();
                }

                if (result && isScanning) {
                    // Tekli veya Sürekli tarama moduna göre duraklatma mantığı
                    const isContinuous = document.getElementById('modeContinuous').classList.contains('active');
                    if (!isContinuous) {
                        stopScanningMode();
                    }

                    if (navigator.vibrate) navigator.vibrate(150);

                    // Sonuçları ekrana bas
                    resultTypeBadge.innerText = result.barcodeFormat.replace(/_/g, ' ');
                    resultContent.innerText = result.text;
                    resultCard.classList.remove('hidden');

                    scanStatusDiv.classList.remove('idle');
                    scanStatusDiv.classList.add('success');
                    statusText.innerText = "Başarılı!";
                    
                    if (isContinuous) {
                        setTimeout(() => {
                            if(isScanning) statusText.innerText = "Taranıyor...";
                            scanStatusDiv.classList.remove('success');
                        }, 2000);
                    }
                }
            });

            // İlk açılışta otomatik taramayı başlat
            startScanningMode();

        } catch (error) {
            console.error("Kamera başlatılamadı:", error);
        }
    }

    // Donanım özelliklerini (Flaş ve Zoom) kontrol etme
    function initCameraCapabilities() {
        if (!videoTrack) return;
        const capabilities = videoTrack.getCapabilities();

        // Cihaz zoom destekliyorsa slider'ı ayarla
        if (capabilities.zoom) {
            zoomSlider.min = capabilities.zoom.min;
            zoomSlider.max = capabilities.zoom.max;
            zoomSlider.step = 0.1;
        }
    }

    function startScanningMode() {
        isScanning = true;
        mainScanBtn.classList.add('active');
        document.getElementById('scanBtnLabel').innerText = "Taramayı Durdur";
        scanStatusDiv.classList.remove('idle');
        statusText.innerText = "Taranıyor...";
    }

    function stopScanningMode() {
        isScanning = false;
        mainScanBtn.classList.remove('active');
        document.getElementById('scanBtnLabel').innerText = "Taramayı Başlat";
        scanStatusDiv.classList.add('idle');
        statusText.innerText = "Beklemede";
    }

    // ---- Buton Fonksiyonları ----

    // Büyük Yuvarlak Buton: Taramayı Aç / Kapat
    mainScanBtn.addEventListener('click', () => {
        if (isScanning) {
            stopScanningMode();
        } else {
            startScanningMode();
            resultCard.classList.add('hidden');
        }
    });

    // Flaş Butonu
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
            } else {
                alert("Bu cihazın kamerası flaş kontrolünü desteklemiyor (iOS Safari web tarayıcılarında flaş izni kısıtlı olabilir).");
            }
        } catch (err) {
            console.error("Flaş değiştirilemedi:", err);
        }
    });

    // Alt Kaydırmalı Çubuk (Zoom Slider) ne işe yarıyor: Kamerayı Yakınlaştırır
    zoomSlider.addEventListener('input', async (e) => {
        const val = e.target.value;
        zoomValue.innerText = parseFloat(val).toFixed(1) + 'x';
        
        if (videoTrack && videoTrack.getCapabilities().zoom) {
            try {
                await videoTrack.applyConstraints({
                    advanced: [{ zoom: val }]
                });
            } catch (err) {
                console.error("Zoom uygulanamadı:", err);
            }
        }
    });

    // Mod Değiştirme Butonları (Sürekli / Tekli)
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
