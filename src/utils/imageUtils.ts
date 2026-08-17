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
            width = maxHeight;
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
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
