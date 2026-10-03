const supportForm = document.getElementById('supportForm');
const successPopup = document.getElementById('successPopup');
const successNote = document.getElementById('successNote');
const doneBtn = document.getElementById('doneBtn');

const phoneField = document.getElementById('phone');
const amountField = document.getElementById('amount');

if (phoneField) {
    phoneField.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
}

if (amountField) {
    amountField.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    });
}

function setError(name, message) {
    const input = document.getElementById(name);
    if (!input) return;
    const field = input.closest('.field');
    const err = field.querySelector('.err');
    if (message) {
        field.classList.add('invalid');
        err.textContent = message;
    } else {
        field.classList.remove('invalid');
        err.textContent = '';
    }
}

function validate() {
    const get = id => (document.getElementById(id) || {}).value || '';
    const trimmed = v => v.trim();

    let valid = true;

    if (trimmed(get('fullName')).length < 2) {
        setError('fullName', 'Please enter your name');
        valid = false;
    } else {
        setError('fullName', '');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed(get('email')))) {
        setError('email', 'Please enter a valid email address');
        valid = false;
    } else {
        setError('email', '');
    }

    if (trimmed(get('phone')).length < 10) {
        setError('phone', 'Please enter a valid phone number');
        valid = false;
    } else {
        setError('phone', '');
    }

    if (get('txnId') && trimmed(get('txnId')).length < 4) {
        setError('txnId', 'Please enter the full reference or leave it blank');
        valid = false;
    } else {
        setError('txnId', '');
    }

    if (get('amount') && isNaN(parseFloat(get('amount')))) {
        setError('amount', 'Please enter a valid amount');
        valid = false;
    } else {
        setError('amount', '');
    }

    if (trimmed(get('message')).length < 10) {
        setError('message', 'Please describe the issue in a few more words');
        valid = false;
    } else {
        setError('message', '');
    }

    return valid;
}

if (supportForm) {
    supportForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!validate()) return;

        successNote.textContent = 'Your ' + this.dataset.issue.toLowerCase() +
            ' request has been recorded. Our support team will contact you shortly.';
        successPopup.hidden = false;
        this.reset();
    });
}

if (doneBtn) {
    doneBtn.addEventListener('click', function() {
        successPopup.hidden = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

const faqButtons = document.querySelectorAll('.faq-q');

faqButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
        const item = this.closest('.faq-item');
        const answer = item.querySelector('.faq-a');
        const isOpen = item.classList.contains('open');

        faqButtons.forEach(function(other) {
            const otherItem = other.closest('.faq-item');
            otherItem.classList.remove('open');
            other.setAttribute('aria-expanded', 'false');
            otherItem.querySelector('.faq-a').style.maxHeight = null;
        });

        if (isOpen) return;

        item.classList.add('open');
        this.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
    });
});