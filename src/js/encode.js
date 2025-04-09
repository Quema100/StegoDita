const encode = () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const upload = document.getElementById('upload');
    const encodeBtn = document.getElementById('encodeBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const messageInput = document.getElementById('message');
    const output = document.getElementById('output');
    const status = document.getElementById('status');
    const dropArea = document.getElementById('dropArea');
    let img = new Image();
    let isImageLoaded = false;
    let isEncoding = false;

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
        if (status) status.textContent = '🖼 Image loaded';
    };

    const decodeMessage = async () => {
        try {
            encodeBtn.disabled = true;

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

            output.textContent = clean;
        } catch (err) {
            console.error('Decode Error:', err);
        } finally {
            encodeBtn.disabled = false;
        }
    };

    const encodeMessage = async (message) => {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        const encoded = new TextEncoder().encode(message + '\0');
        let bitString = '';
        for (let byte of encoded) {
            bitString += byte.toString(2).padStart(8, '0');
        }

        let bitIndex = 0;
        const CHUNK_SIZE = 100000;

        const processChunk = (start, resolve) => {
            let i = start;
            const end = Math.min(data.length, start + CHUNK_SIZE);

            while (i < end && bitIndex < bitString.length) {
                for (let j = 0; j < 3 && bitIndex < bitString.length; j++) {
                    data[i + j] = (data[i + j] & 0xFE) | parseInt(bitString[bitIndex++]);
                }
                i += 4;
            }

            if (i < data.length && bitIndex < bitString.length) {
                setTimeout(() => processChunk(i, resolve), 0);
            } else {
                resolve();
            }
        };

        await new Promise((resolve) => processChunk(0, resolve));

        ctx.putImageData(imgData, 0, 0);
        status.textContent = '✅ Encoding complete';
        encodeBtn.textContent = '✅ Done';
        setTimeout(() => { 
            encodeBtn.textContent = '📝 Encode' 
            status.textContent = 'Status: Ready';
        }, 2000);
        decodeMessage();
    };

    encodeBtn.addEventListener('click', () => {
        const message = messageInput.value.trim();

        if (!isImageLoaded) {
            status.textContent = '❗Please upload an image first.';
            setTimeout(() => { 
                status.textContent = 'Status: Ready';
            }, 2000);
            return;
        }

        if (!message) {
            status.textContent = '❗Please enter a message to encode.';
            setTimeout(() => { 
                status.textContent = 'Status: Ready';
            }, 2000);
            return;
        }

        isEncoding = true;
        status.textContent = '⏳ Encoding in progress...';
        encodeMessage(message);
    });

    downloadBtn.addEventListener('click', () => {

        if (!isImageLoaded) {
            status.textContent = '❗ Please upload an image first.';
            setTimeout(() => { 
                status.textContent = 'Status: Ready';
            }, 2000);
            return;
        }

        if (!isEncoding) {
            status.textContent = '❗Please begin with the encoding process.';
            setTimeout(() => { 
                status.textContent = 'Status: Ready';
            }, 2000);
            return;
        }

        isEncoding = false;
        isImageLoaded = false;
        const link = document.createElement('a');
        link.download = 'stego_image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
};
