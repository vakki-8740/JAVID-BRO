const LOAD_SECONDS = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const supportForm = document.getElementById('supportForm');
const fullName = document.getElementById('fullName');
const uidField = document.getElementById('uid');
const amountField = document.getElementById('amount');
const phoneField = document.getElementById('phone');
const fileField = document.getElementById('proofImage');
const uploadBox = document.getElementById('uploadBox');
const uploadEmpty = document.getElementById('uploadEmpty');
const uploadPreview = document.getElementById('uploadPreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImage');
const submitBtn = document.getElementById('submitBtn');

const loadingOverlay = document.getElementById('loadingOverlay');
const progressFill = document.getElementById('progressFill');
const countdownEl = document.getElementById('countdown');

const successPopup = document.getElementById('successPopup');
const doneBtn = document.getElementById('doneBtn');

const toast = document.getElementById('toast');

let selectedImage = null;
let toastTimer = null;

function setError(input, message) {
    if (!input) return;
    const field = input.closest('.field');
    const err = field.querySelector('.err');
    if (message) {
        field.classList.add('invalid');
        if (err) err.textContent = message;
    } else {
        field.classList.remove('invalid');
        if (err) err.textContent = '';
    }
}

function clearErrors() {
    if (!supportForm) return;
    supportForm.querySelectorAll('.field').forEach(function(field) {
        field.classList.remove('invalid');
        const err = field.querySelector('.err');
        if (err) err.textContent = '';
    });
}

function validate() {
    clearErrors();
    let valid = true;

    const name = (fullName.value || '').trim();
    if (name.length < 2) {
        setError(fullName, 'Please enter your name');
        valid = false;
    }

    const uid = (uidField.value || '').trim();
    if (!/^[A-Za-z0-9]{4,}$/.test(uid)) {
        setError(uidField, 'Please enter a valid UID');
        valid = false;
    }

    const phone = (phoneField.value || '').trim();
    if (!/^[0-9]{10}$/.test(phone)) {
        setError(phoneField, 'Please enter a valid 10 digit mobile number');
        valid = false;
    }

    if (amountField) {
        const amount = parseFloat((amountField.value || '').trim());
        if (!amountField.value.trim() || isNaN(amount) || amount <= 0) {
            setError(amountField, 'Please enter a valid amount');
            valid = false;
        }
    }

    if (!selectedImage) {
        setError(uploadBox, 'Please upload an image');
        valid = false;
    }

    return valid;
}

function resetImage() {
    selectedImage = null;
    if (fileField) fileField.value = '';
    if (previewImg) previewImg.removeAttribute('src');
    if (uploadPreview) uploadPreview.hidden = true;
    if (uploadEmpty) uploadEmpty.hidden = false;
}

async function submitComplaint(payload) {
    return true;
}

function runLoading() {
    return new Promise(function(resolve) {
        loadingOverlay.hidden = false;
        document.body.classList.add('is-locked');

        const total = LOAD_SECONDS * 1000;
        const started = Date.now();

        const tick = setInterval(function() {
            const elapsed = Date.now() - started;
            const ratio = Math.min(elapsed / total, 1);

            progressFill.style.width = (ratio * 100) + '%';
            countdownEl.textContent = Math.ceil((total - elapsed) / 1000) + 's';

            if (ratio >= 1) {
                clearInterval(tick);
                loadingOverlay.hidden = true;
                document.body.classList.remove('is-locked');
                resolve();
            }
        }, 40);
    });
}

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
        toast.hidden = true;
    }, 2600);
}

if (phoneField) {
    phoneField.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
        setError(this, '');
    });
}

if (uidField) {
    uidField.addEventListener('input', function() {
        this.value = this.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
        setError(this, '');
    });
}

if (amountField) {
    amountField.addEventListener('input', function() {
        let v = this.value.replace(/[^0-9.]/g, '');
        const dot = v.indexOf('.');
        if (dot !== -1) {
            v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '');
        }
        this.value = v;
        setError(this, '');
    });
}

if (uploadBox) {
    uploadBox.addEventListener('click', function(e) {
        if (e.target.closest('.upload-remove')) return;
        fileField.click();
    });

    uploadBox.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileField.click();
        }
    });

    uploadBox.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadBox.classList.add('dragging');
    });

    uploadBox.addEventListener('dragleave', function() {
        uploadBox.classList.remove('dragging');
    });

    uploadBox.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadBox.classList.remove('dragging');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
}

if (fileField) {
    fileField.addEventListener('change', function() {
        if (this.files && this.files[0]) handleFile(this.files[0]);
    });
}

if (removeImageBtn) {
    removeImageBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        resetImage();
        setError(uploadBox, '');
    });
}

function handleFile(file) {
    if (!/^image\//.test(file.type)) {
        setError(uploadBox, 'Please select an image file');
        return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
        setError(uploadBox, 'Image is larger than 5 MB, please compress it');
        return;
    }

    selectedImage = file;
    setError(uploadBox, '');

    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        uploadPreview.hidden = false;
        uploadEmpty.hidden = true;
    };
    reader.readAsDataURL(file);
}

if (supportForm) {
    supportForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validate()) {
            const firstInvalid = supportForm.querySelector('.field.invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        const payload = {
            issue: supportForm.dataset.issue,
            name: fullName.value.trim(),
            uid: uidField.value.trim(),
            phone: phoneField.value.trim(),
            amount: amountField ? amountField.value.trim() : '',
            imageName: selectedImage.name,
            imageData: selectedImage,
            submittedAt: new Date().toISOString()
        };

        submitBtn.disabled = true;

        await runLoading();
        await submitComplaint(payload);

        submitBtn.disabled = false;
        successPopup.hidden = false;
        supportForm.reset();
        clearErrors();
        resetImage();
    });
}

if (doneBtn) {
    doneBtn.addEventListener('click', function() {
        successPopup.hidden = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

const chatTrigger = document.querySelector('[data-coming-soon]');
if (chatTrigger) {
    chatTrigger.addEventListener('click', function(e) {
        e.preventDefault();
        showToast(chatTrigger.dataset.comingSoon);
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