// scanner.js - iOS Safari Canavar Modu (Saf Canvas Beslemeli)
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('cameraFeed');
    
    // HTML'deki gizli canvas'ı yakala
    const canvas = document.getElementById('scanCanvas') || document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    // UI Elementleri
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    const resultTypeBadge = document.getElementById('resultTypeBadge');
    const statusText = document.getElementById('statusText');
    const scanStatusDiv = document.getElementById('scanStatus');
    const mainScanBtn = document.getElementById('mainScanBtn');

    // 1. İşlemciyi yormayacak şekilde SADECE en gerekli formatları tanımla
    const hints = new Map();
    hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.EAN_13, // Gösterdiğin perakende barkodu
        ZXing.BarcodeFormat.QR_CODE  // Karekodlar
    ]);

    const codeReader = new ZXing.BrowserMultiFormatReader(hints);
    let isScanning = false;
    let streamRef = null;

    // 2. Kamerayı Saf Web API ile En Yüksek Çözünürlükte Aç
    async function startCamera() {
        if (statusText) statusText.innerText = "Kamera başlatılıyor...";
        
        const constraints = {
            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1920 }, // Çizgilerin net çıkması için HD şart
                height: { ideal: 1080 }
            },
            audio: false
        };

        try {
            streamRef = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = streamRef;
            video.setAttribute('playsinline', true); // iOS Safari için hayati önlem
            video.muted = true;
            await video.play();

            isScanning = true;
            if (statusText) statusText.innerText = "Taranıyor...";
            
            // iOS engelini aşan manuel döngüyü başlat
            scanLoop();
        } catch (err) {
            console.error("Kamera açılamadı:", err);
            if (statusText) statusText.innerText = "Kamera İzni Gerekli!";
        }
    }

    // 3. iOS'un Ruhunun Bile Duymayacağı Gizli Canvas Döngüsü
    async function scanLoop() {
        if (!isScanning) {
            requestAnimationFrame(scanLoop);
            return;
        }

        // Video verisi akmaya başladığı an çalışır
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // Ekranda sıkışmayı önlemek için gerçek video boyutunu canvas'a aktar
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // O salisedeki video karesini Canvas'a dondurarak çiz
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
                // ZXing'e "al bu fotoğrafa bak" diyoruz, videoya değil!
                const result = await codeReader.decodeFromCanvas(canvas);
                if (result) {
                    handleSuccess(result);
                }
            } catch (e) {
                // Kod bulunamadığında kütüphane hata fırlatır, döngünün sürmesi için burayı boş bırakıyoruz
            }
        }

        // Telefonun işlemcisini saniyede 30 kez yormamak için her kare arasına 200ms (Saniyede 5 deneme) mola koyuyoruz
        setTimeout(() => {
            requestAnimationFrame(scanLoop);
        }, 200);
    }

    // 4. Başarılı Sonuç Yönetimi
    function handleSuccess(result) {
        isScanning = false; // Telefon ardı ardına titremesin diye geçici kilit
        if (navigator.vibrate) navigator.vibrate(150);

        resultTypeBadge.innerText = result.barcodeFormat.replace(/_/g, ' ');
        resultContent.innerText = result.text;
        resultCard.classList.remove('hidden');

        scanStatusDiv.classList.remove('idle');
        scanStatusDiv.classList.add('success');
        if (statusText) statusText.innerText = "Başarılı!";

        // 3 saniye sonra ekranı temizle ve yeni taramaya hazır ol
        setTimeout(() => {
            scanStatusDiv.classList.remove('success');
            resultCard.classList.add('hidden');
            if (mainScanBtn.classList.contains('active')) {
                isScanning = true;
                if (statusText) statusText.innerText = "Taranıyor...";
            }
        }, 3000);
    }

    // Yuvarlak Büyük Buton Kontrolü
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
