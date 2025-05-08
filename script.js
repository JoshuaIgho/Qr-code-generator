document.addEventListener('DOMContentLoaded', function() {
    // Create animated particles
    createParticles();
    
    // Initialize QR code with default values
    generateQRCode();
    
    // Event listeners for form controls
    document.getElementById('generate-btn').addEventListener('click', generateQRCode);
    document.getElementById('qr-content').addEventListener('input', debounce(generateQRCode, 500));
    document.getElementById('qr-color').addEventListener('input', generateQRCode);
    document.getElementById('bg-color').addEventListener('input', updateBackgroundColor);
    document.getElementById('eye-style').addEventListener('change', generateQRCode);
    document.getElementById('error-correction').addEventListener('change', generateQRCode);
    document.getElementById('logo-toggle').addEventListener('change', toggleLogoUpload);
    document.getElementById('logo-upload').addEventListener('change', handleLogoUpload);
    
    // Style buttons
    const styleButtons = ['style-dots', 'style-squares', 'style-rounded'];
    styleButtons.forEach(btnId => {
        document.getElementById(btnId).addEventListener('click', function() {
            styleButtons.forEach(id => {
                const btn = document.getElementById(id);
                btn.classList.remove('bg-blue-900', 'border-blue-700');
                btn.classList.add('bg-gray-800', 'border-gray-700');
            });
            
            this.classList.remove('bg-gray-800', 'border-gray-700');
            this.classList.add('bg-blue-900', 'border-blue-700');
            generateQRCode();
        });
    });
    
    // Download buttons
    document.getElementById('download-png').addEventListener('click', downloadPNG);
    document.getElementById('download-svg').addEventListener('click', downloadSVG);
    document.getElementById('share-btn').addEventListener('click', shareQR);
    
    // Set first style button as active
    document.getElementById('style-dots').click();
});

function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = window.innerWidth < 768 ? 20 : 40;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random size between 5px and 15px
        const size = Math.random() * 10 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;
        
        // Random animation
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        particle.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
        
        container.appendChild(particle);
    }
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

function toggleLogoUpload() {
    const toggle = document.getElementById('logo-toggle');
    const container = document.getElementById('logo-upload-container');
    
    if (toggle.checked) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
        generateQRCode();
    }
}

function handleLogoUpload() {
    const file = document.getElementById('logo-upload').files[0];
    if (file) {
        generateQRCode();
    }
}

function updateBackgroundColor() {
    const bgColor = document.getElementById('bg-color').value;
    document.getElementById('qr-preview-container').style.backgroundColor = bgColor;
}

function generateQRCode() {
    const content = document.getElementById('qr-content').value || 'https://example.com';
    const qrColor = document.getElementById('qr-color').value;
    const bgColor = document.getElementById('bg-color').value;
    const errorCorrection = document.getElementById('error-correction').value;
    const eyeStyle = document.getElementById('eye-style').value;
    const hasLogo = document.getElementById('logo-toggle').checked;
    const logoFile = hasLogo ? document.getElementById('logo-upload').files[0] : null;
    
    const qrCanvas = document.getElementById('qr-preview');
    const loading = document.getElementById('qr-loading');
    
    // Show loading
    loading.classList.remove('hidden');
    
    // Determine dot style
    let dotStyle;
    if (document.getElementById('style-dots').classList.contains('bg-blue-900')) {
        dotStyle = 'square';
    } else if (document.getElementById('style-squares').classList.contains('bg-blue-900')) {
        dotStyle = 'square';
    } else {
        dotStyle = 'rounded';
    }
    
    // Generate QR code
    QRCode.toCanvas(qrCanvas, content, {
        width: 250,
        color: {
            dark: qrColor,
            light: bgColor
        },
        errorCorrectionLevel: errorCorrection,
        margin: 2,
        dotScale: dotStyle === 'rounded' ? 0.8 : 1,
        type: dotStyle === 'dots' ? 'image/png' : 'image/png'
    }, function(error) {
        if (error) {
            console.error(error);
            loading.classList.add('hidden');
            return;
        }
        
        // Apply eye style
        applyEyeStyle(qrCanvas, eyeStyle, qrColor);
        
        // Add logo if enabled
        if (hasLogo && logoFile) {
            addLogoToQR(qrCanvas, logoFile, bgColor).finally(() => {
                loading.classList.add('hidden');
            });
        } else {
            loading.classList.add('hidden');
        }
        
        // Update background color
        document.getElementById('qr-preview-container').style.backgroundColor = bgColor;
    });
}

function applyEyeStyle(canvas, style, color) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const eyeSize = size / 3.5;
    const eyePositions = [
        {x: 0, y: 0},
        {x: size - eyeSize, y: 0},
        {x: 0, y: size - eyeSize}
    ];
    
    // Save the original QR code data
    const imageData = ctx.getImageData(0, 0, size, size);
    
    // Draw eye styles
    eyePositions.forEach(pos => {
        // Clear the eye area
        ctx.clearRect(pos.x, pos.y, eyeSize, eyeSize);
        
        // Draw outer square
        ctx.fillStyle = color;
        ctx.fillRect(pos.x, pos.y, eyeSize, eyeSize);
        
        // Draw inner square (white)
        const innerSize = eyeSize * 0.6;
        const innerPos = pos.x + (eyeSize - innerSize) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(innerPos, innerPos, innerSize, innerSize);
        
        // Apply style to inner square
        ctx.fillStyle = color;
        switch(style) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(innerPos + innerSize/2, innerPos + innerSize/2, innerSize/2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'pointed':
                ctx.beginPath();
                ctx.moveTo(innerPos + innerSize/2, innerPos);
                ctx.lineTo(innerPos + innerSize, innerPos + innerSize/2);
                ctx.lineTo(innerPos + innerSize/2, innerPos + innerSize);
                ctx.lineTo(innerPos, innerPos + innerSize/2);
                ctx.closePath();
                ctx.fill();
                break;
            default: // square
                ctx.fillRect(innerPos, innerPos, innerSize, innerSize);
        }
    });
    
    // Restore the original QR code data where not modified
    ctx.putImageData(imageData, 0, 0);
}

async function addLogoToQR(canvas, logoFile, bgColor) {
    return new Promise((resolve) => {
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const logoSize = size / 4;
        const logoPos = (size - logoSize) / 2;
        
        // Create a temporary canvas to handle the logo
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the QR code to temp canvas
        tempCtx.drawImage(canvas, 0, 0);
        
        // Create an image for the logo
        const logoImg = new Image();
        const reader = new FileReader();
        
        reader.onload = function(e) {
            logoImg.onload = function() {
                // Draw white background for logo
                tempCtx.fillStyle = bgColor;
                tempCtx.fillRect(logoPos - 2, logoPos - 2, logoSize + 4, logoSize + 4);
                
                // Draw logo
                tempCtx.drawImage(logoImg, logoPos, logoPos, logoSize, logoSize);
                
                // Copy back to main canvas
                ctx.drawImage(tempCanvas, 0, 0);
                resolve();
            };
            logoImg.src = e.target.result;
        };
        
        reader.readAsDataURL(logoFile);
    });
}

function downloadPNG() {
    const canvas = document.getElementById('qr-preview');
    const link = document.createElement('a');
    link.download = 'nexusqr-code.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadSVG() {
    const content = document.getElementById('qr-content').value || 'https://example.com';
    const qrColor = document.getElementById('qr-color').value;
    const bgColor = document.getElementById('bg-color').value;
    const errorCorrection = document.getElementById('error-correction').value;
    
    QRCode.toString(content, {
        type: 'svg',
        color: {
            dark: qrColor,
            light: bgColor
        },
        errorCorrectionLevel: errorCorrection,
        margin: 2
    }, function(error, svg) {
        if (error) {
            console.error(error);
            return;
        }
        
        const blob = new Blob([svg], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'nexusqr-code.svg';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    });
}

function shareQR() {
    const canvas = document.getElementById('qr-preview');
    
    canvas.toBlob(function(blob) {
        if (navigator.share) {
            navigator.share({
                title: 'My QR Code',
                text: 'Check out this QR code I created with NexusQR',
                files: [new File([blob], 'qr-code.png', {type: 'image/png'})]
            }).catch(err => {
                console.log('Error sharing:', err);
                fallbackShare();
            });
        } else {
            fallbackShare();
        }
    }, 'image/png');
}

function fallbackShare() {
    const canvas = document.getElementById('qr-preview');
    const dataUrl = canvas.toDataURL('image/png');
    
    // Copy to clipboard as fallback
    const input = document.createElement('input');
    input.value = dataUrl;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    
    alert('Image URL copied to clipboard!');
}

document.getElementById('current-year').textContent = new Date().getFullYear();