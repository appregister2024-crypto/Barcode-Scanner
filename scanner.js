// scanner.js içeriği
document.addEventListener('DOMContentLoaded', async () => {
    const videoElement = document.getElementById('cameraFeed');
    const permissionOverlay = document.getElementById('permissionOverlay');
    const requestPermissionBtn = document.getElementById('requestPermission');

    // ZXing Kütüphanesini başlat
    const codeReader = new ZXing.BrowserMultiFormatReader();

    async function startCamera() {
        try {
            // Cihazdaki kameraları listele
            const videoInputDevices = await codeReader.listVideoInputDevices();
            
            if (videoInputDevices.length === 0) {
                console.error("Kamera bulunamadı!");
                return;
            }

            // Arka kamerayı (environment) bulmaya çalış, yoksa ilk kamerayı seç
            let selectedDeviceId = videoInputDevices[0].deviceId;
            const backCamera = videoInputDevices.find(device => 
                device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('arka') ||
                device.label.toLowerCase().includes('environment')
            );
            
            if (backCamera) {
                selectedDeviceId = backCamera.deviceId;
            }

            // Seçilen kamera ile taramayı başlat
            codeReader.decodeFromVideoDevice(selectedDeviceId, 'cameraFeed', (result, err) => {
                if (result) {
                    console.log("Barkod okundu:", result.text);
                    // Başarılı okumada sonucu ekrana yazdır (Geçici test için alert)
                    alert("Okunan Kod: " + result.text);
                }
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error(err);
                }
            });

            // Başarılı olursa izin overlay'ini gizle
            permissionOverlay.classList.add('hidden');

        } catch (error) {
            console.error("Kamera başlatılırken hata oluştu:", error);
            // Hata olursa izin ekranını göster
            permissionOverlay.classList.remove('hidden');
        }
    }

    // İzin butonuna tıklandığında kamerayı başlatmayı dene
    if (requestPermissionBtn) {
        requestPermissionBtn.addEventListener('click', startCamera);
    }

    // Sayfa açıldığında kamerayı otomatik başlatmayı dene
    startCamera();
});