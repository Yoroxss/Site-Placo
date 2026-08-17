export function resizeImage(file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      
      // If file is already small (< 400KB), return base64 directly
      if (file.size < 400 * 1024) {
        resolve(base64);
        return;
      }

      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(resizedBase64);
        } else {
          resolve(base64);
        }
      };
      img.onerror = (err) => {
        console.error("Image decoding error:", err);
        reject(new Error("Le format ou l'encodage de cette image n'est pas supporté par votre navigateur (ex: les fichiers HEIC d'iPhone doivent être convertis en JPEG/PNG ou pris en mode 'Le plus compatible' avant l'envoi)."));
      };
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      reject(new Error("Erreur lors de la lecture du fichier. Veuillez réessayer avec une autre image."));
    };
  });
}
