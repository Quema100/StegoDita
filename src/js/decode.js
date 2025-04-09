const decode = () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const upload = document.getElementById('upload');
    const decodeBtn = document.getElementById('decodeBtn');
    const status = document.getElementById('status');
    const output = document.getElementById('output');
    const dropArea = document.getElementById('dropArea');
    let img = new Image();
    let isImageLoaded = false;

    dropArea.addEventListener('click', () => upload.click());

    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragover');
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            isImageLoaded = true;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            status.textContent = '❗ Please drop a valid image file!';
            setTimeout(() => {
                status.textContent = 'Status: Ready';
            }, 2000);
        }
    });

    upload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        isImageLoaded = true;

        reader.onload = (event) => {
            img.src = event.target.result;
        };

        reader.readAsDataURL(file);
    });

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        status.textContent = '🖼 Image loaded';
    };

    const isPossiblyCorrupted = (text) => {
        const total = text.length;
        if (total === 0) return true;

        const validChars = text.match(/[가-힣a-zA-Z0-9 .,!?]/g) || [];
        const ratio = validChars.length / total;
        return ratio < 0.6;
    };

    const decodeMessage = async () => {
        try {
            status.textContent = '⏳ Decoding in progress...';
            decodeBtn.disabled = true;
            decodeBtn.textContent = '🔍 Decoding...';

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            let binary = '';

            const CHUNK_SIZE = 100000;

            const processChunk = (start, resolve) => {
                let i = start;
                const end = Math.min(data.length, start + CHUNK_SIZE);

                while (i < end) {
                    for (let j = 0; j < 3; j++) {
                        binary += (data[i + j] & 1).toString();
                    }
                    i += 4;
                }

                if (i < data.length) {
                    setTimeout(() => processChunk(i, resolve), 0);
                } else {
                    resolve();
                }
            };

            await new Promise((resolve) => processChunk(0, resolve));

            const bytes = [];
            for (let i = 0; i < binary.length; i += 8) {
                const byte = binary.slice(i, i + 8);
                if (byte.length < 8) break;
                const value = parseInt(byte, 2);
                if (value === 0 || isNaN(value)) break;
                bytes.push(value);
            }

            const decoded = new TextDecoder().decode(new Uint8Array(bytes));

            const clean = decoded.replace(
                /[^\uAC00-\uD7A3\u3131-\u318E\w\s.,!?@#$%^&*()\[\]{}<>'"\/\\`~+=:;-]/g,
                ''
            );


            if (isPossiblyCorrupted(clean)) {
                status.textContent = '⚠️ Message may be corrupted or invalid';
                output.textContent = '📭 No hidden message found.';
                decodeBtn.textContent = '⚠️ Check Message';
                setTimeout(() => {
                    decodeBtn.textContent = '🔍 Decode'
                    status.textContent = 'OStatus: Ready';
                }, 2000);
            } else {
                output.textContent = clean;
                status.textContent = '✅ Message decoded successfully';
                decodeBtn.textContent = '✅ Done';
                setTimeout(() => {
                    decodeBtn.textContent = '🔍 Decode'
                    status.textContent = 'Status: Ready';
                }, 2000);
            }
        } catch (err) {
            status.textContent = '❌ Error: ' + err.message;
            decodeBtn.textContent = '❌ Failed';
            setTimeout(() => decodeBtn.textContent = '🔍 Decode', 2000);
        } finally {
            decodeBtn.disabled = false;
        }
    };

    decodeBtn.addEventListener('click', () => {
        if (!isImageLoaded) {
            status.textContent = '❌ Please upload an image first';
            setTimeout(() => {
                status.textContent = 'Status: Ready';
            }, 2000);
            return;
        }

        decodeMessage();
    });
};
