const chatList = document.getElementById('chatList');
const emptyState = document.getElementById('emptyState');
const searchField = document.getElementById('chatSearch');
const identityBar = document.getElementById('identityBar');
const identityName = document.getElementById('identityName');
const identityMeta = document.getElementById('identityMeta');
const changeIdentityBtn = document.getElementById('changeIdentity');

const gatePopup = document.getElementById('gatePopup');
const gateForm = document.getElementById('gateForm');
const gateUid = document.getElementById('gateUid');
const gatePhone = document.getElementById('gatePhone');

const chatModal = document.getElementById('chatModal');
const detailName = document.getElementById('detailName');
const detailIssue = document.getElementById('detailIssue');
const detailFacts = document.getElementById('detailFacts');
const detailMessages = document.getElementById('detailMessages');

const composePopup = document.getElementById('composePopup');
const composeTitle = document.getElementById('composeTitle');
const composeForm = document.getElementById('composeForm');
const composeChat = document.getElementById('composeChat');
const composeFile = document.getElementById('composeFile');
const composeFileLabel = document.getElementById('composeFileLabel');
const composeNote = document.getElementById('composeNote');

const editPopup = document.getElementById('editPopup');
const editForm = document.getElementById('editForm');
const editId = document.getElementById('editId');
const editName = document.getElementById('editName');
const editUid = document.getElementById('editUid');
const editPhone = document.getElementById('editPhone');
const editAmount = document.getElementById('editAmount');
const editAmountField = document.getElementById('editAmountField');
const editIssue = document.getElementById('editIssue');

const confirmPopup = document.getElementById('confirmPopup');
const confirmDelete = document.getElementById('confirmDelete');

const newChatPopup = document.getElementById('newChatPopup');
const newChatForm = document.getElementById('newChatForm');
const newChatTopic = document.getElementById('newChatTopic');
const newChatText = document.getElementById('newChatText');

const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxName = document.getElementById('lightboxName');
const lightboxDownload = document.getElementById('lightboxDownload');
const lightboxClose = document.getElementById('lightboxClose');

let composeMode = 'image';
let activeChatId = null;
let pendingDeleteId = null;

function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function openModal(el) {
    el.hidden = false;
    document.body.classList.add('is-locked');
}

function closeModal(el) {
    el.hidden = true;
    if (document.querySelectorAll('.modal-overlay:not([hidden]), .lightbox:not([hidden])').length === 0) {
        document.body.classList.remove('is-locked');
    }
}

function lastMessageOf(chat) {
    const msgs = chat.messages || [];
    return msgs.length ? msgs[msgs.length - 1] : null;
}

function previewText(chat) {
    const last = lastMessageOf(chat);
    if (!last) return 'No message';
    if (last.text) return last.text;
    if (last.image) return 'Image';
    if (last.file) return last.file.name;
    return 'No message';
}

function renderList() {
    const term = (searchField.value || '').trim().toLowerCase();
    let chats = readChats();

    if (term) {
        chats = chats.filter(function(c) {
            return [c.name, c.uid, c.phone, c.issue, c.amount]
                .join(' ')
                .toLowerCase()
                .includes(term);
        });
    }

    if (!chats.length) {
        chatList.innerHTML = '';
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;
    chatList.innerHTML = chats.map(function(c) {
        const last = lastMessageOf(c);
        const stamp = last ? fmtTime(last.at) : '';
        const img = last && last.image;
        return '<button type="button" class="chat-card" data-id="' + c.id + '">' +
            '<span class="chat-thumb">' +
                (img ? '<img src="' + img + '" alt="">' : '<span class="chat-thumb-icon">CH</span>') +
            '</span>' +
            '<span class="chat-body">' +
                '<span class="chat-row">' +
                    '<span class="chat-name">' + escapeHtml(c.name || 'Unknown') + '</span>' +
                    '<span class="chat-time">' + stamp + '</span>' +
                '</span>' +
                '<span class="chat-issue">' + escapeHtml(c.issue || '') + '</span>' +
                '<span class="chat-preview">' + escapeHtml(previewText(c)) + '</span>' +
                '<span class="chat-tags">' +
                    '<span class="chat-tag">UID ' + escapeHtml(c.uid || '-') + '</span>' +
                    '<span class="chat-tag">' + escapeHtml(c.phone || '-') + '</span>' +
                    (c.amount ? '<span class="chat-tag amt">' + escapeHtml(c.amount) + '</span>' : '') +
                '</span>' +
            '</span>' +
        '</button>';
    }).join('');
}

function renderDetail(chat) {
    detailName.textContent = chat.name || 'Unknown';
    detailIssue.textContent = chat.issue || '';

    const last = lastMessageOf(chat);
    const created = chat.createdAt;

    detailFacts.innerHTML =
        '<div class="fact"><span class="fact-k">Date</span><span class="fact-v">' + fmtDate(created) + '</span></div>' +
        '<div class="fact"><span class="fact-k">Time</span><span class="fact-v">' + fmtTime(created) + '</span></div>' +
        '<div class="fact"><span class="fact-k">UID</span><span class="fact-v">' + escapeHtml(chat.uid || '-') + '</span></div>' +
        '<div class="fact"><span class="fact-k">Mobile</span><span class="fact-v">' + escapeHtml(chat.phone || '-') + '</span></div>' +
        (chat.amount ? '<div class="fact"><span class="fact-k">Amount</span><span class="fact-v">' + escapeHtml(chat.amount) + '</span></div>' : '') +
        '<div class="fact"><span class="fact-k">Last Activity</span><span class="fact-v">' + (last ? fmtTime(last.at) : '-') + '</span></div>' +
        '<div class="fact"><span class="fact-k">Messages</span><span class="fact-v">' + ((chat.messages || []).length) + '</span></div>';

    const msgs = chat.messages || [];
    detailMessages.innerHTML = msgs.map(function(m, i) {
        const mine = m.from === 'admin';
        let body = '';
        if (m.image) {
            body += '<img class="msg-image" src="' + m.image + '" alt="Attachment" data-msg="' + i + '">';
        }
        if (m.file) {
            body += '<span class="msg-file">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
                '<polyline points="14 2 14 8 20 8"/></svg>' +
                escapeHtml(m.file.name) +
                (m.file.size ? '<em>' + formatSize(m.file.size) + '</em>' : '') +
            '</span>';
        }
        if (m.text) body += '<span class="msg-text">' + escapeHtml(m.text) + '</span>';

        return '<div class="msg ' + (mine ? 'admin' : 'user') + '">' +
            '<span class="msg-from">' + (mine ? 'Support' : 'You') + '</span>' +
            '<span class="msg-bubble">' + body + '</span>' +
            '<span class="msg-at">' + fmtDate(m.at) + ' &middot; ' + fmtTime(m.at) + '</span>' +
        '</div>';
    }).join('');
}

function openChat(id) {
    const chat = getChat(id);
    if (!chat) return;
    activeChatId = id;
    renderDetail(chat);
    openModal(chatModal);
}

function populateCompose() {
    composeChat.innerHTML = readChats().map(function(c) {
        const label = (c.name || 'Unknown') + ' (UID ' + (c.uid || '-') + ')';
        return '<option value="' + c.id + '">' + escapeHtml(label) + '</option>';
    }).join('');

    if (activeChatId) composeChat.value = activeChatId;
}

function openCompose(mode) {
    const chats = readChats();
    if (!chats.length) {
        showToast('No chats available yet');
        return;
    }

    composeMode = mode;
    composeTitle.textContent = mode === 'image' ? 'Send Image' : 'Send File';
    composeFileLabel.textContent = mode === 'image' ? 'Choose Image' : 'Choose File (PDF etc)';
    composeFile.accept = mode === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.csv';
    composeFile.value = '';
    composeNote.value = '';
    populateCompose();
    openModal(composePopup);
}

function openEdit(id) {
    const chat = getChat(id);
    if (!chat) return;

    editId.value = id;
    editName.value = chat.name || '';
    editUid.value = chat.uid || '';
    editPhone.value = chat.phone || '';
    editAmount.value = chat.amount || '';
    editIssue.value = chat.issue || 'Deposit Problem';
    editAmountField.hidden = !chat.amount;

    openModal(editPopup);
}

function openLightbox(src, name) {
    lightboxImg.src = src;
    lightboxName.textContent = name || 'Image';
    lightboxDownload.href = src;
    lightboxDownload.setAttribute('download', name || 'image.jpg');
    openModal(lightbox);
}

function appendMessage(chatId, message) {
    return updateChat(chatId, function(chat) {
        if (!Array.isArray(chat.messages)) chat.messages = [];
        chat.messages.push(message);
    });
}

gateForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const uid = gateUid.value.trim();
    const phone = gatePhone.value.trim();
    let valid = true;

    setError(gateUid, /^[A-Za-z0-9]{4,}$/.test(uid) ? '' : 'Please enter a valid UID');
    setError(gatePhone, /^[0-9]{10}$/.test(phone) ? '' : 'Please enter a valid 10 digit mobile number');

    if (!/^[A-Za-z0-9]{4,}$/.test(uid)) valid = false;
    if (!/^[0-9]{10}$/.test(phone)) valid = false;
    if (!valid) return;

    setIdentity(uid, phone);
    renderIdentity();
    closeModal(gatePopup);
});

gateUid.addEventListener('input', function() {
    this.value = this.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
    setError(this, '');
});

gatePhone.addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
    setError(this, '');
});

function renderIdentity() {
    const id = getIdentity();
    if (!id) return;
    identityBar.hidden = false;
    identityName.textContent = 'UID ' + id.uid;
    identityMeta.textContent = id.phone;
}

changeIdentityBtn.addEventListener('click', function() {
    const id = getIdentity() || { uid: '', phone: '' };
    gateUid.value = id.uid;
    gatePhone.value = id.phone;
    openModal(gatePopup);
});

chatList.addEventListener('click', function(e) {
    const card = e.target.closest('.chat-card');
    if (card) openChat(card.dataset.id);
});

searchField.addEventListener('input', renderList);

document.getElementById('newChatBtn').addEventListener('click', function() {
    const id = getIdentity() || {};
    newChatText.value = '';
    setError(newChatText, '');
    newChatForm.dataset.uid = id.uid || '';
    newChatForm.dataset.phone = id.phone || '';
    openModal(newChatPopup);
    newChatText.focus();
});

newChatForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const text = newChatText.value.trim();
    if (text.length < 2) {
        setError(newChatText, 'Please type your message');
        return;
    }

    const id = getIdentity() || {};
    const chat = {
        id: newId(),
        issue: newChatTopic.value,
        name: 'Guest',
        uid: id.uid || '',
        phone: id.phone || '',
        amount: '',
        createdAt: new Date().toISOString(),
        messages: [{ from: 'user', text: text, at: new Date().toISOString() }]
    };

    addChat(chat);
    closeModal(newChatPopup);
    renderList();
    openChat(chat.id);
    showToast('Chat started');
});

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !activeChatId) return;

    appendMessage(activeChatId, {
        from: 'user',
        text: text,
        at: new Date().toISOString()
    });

    messageInput.value = '';
    renderList();
    openChat(activeChatId);
    messageInput.focus();
}

sendMessageBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

document.getElementById('sendImageBtn').addEventListener('click', function() { openCompose('image'); });
document.getElementById('sendFileBtn').addEventListener('click', function() { openCompose('file'); });

composeForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const chatId = composeChat.value;
    const file = composeFile.files && composeFile.files[0];
    const note = composeNote.value.trim();

    if (!chatId) {
        setError(composeChat, 'Please select a chat');
        return;
    }
    if (!file) {
        setError(composeFile, composeMode === 'image' ? 'Please choose an image' : 'Please choose a file');
        return;
    }
    setError(composeFile, '');

    const message = { from: 'user', text: note, at: new Date().toISOString() };

    if (composeMode === 'image') {
        try {
            message.image = await compressImage(file);
        } catch (err) {
            setError(composeFile, 'Could not read that image');
            return;
        }
    } else {
        message.file = { name: file.name, size: file.size, type: file.type };
    }

    try {
        appendMessage(chatId, message);
    } catch (err) {
        showToast('Browser storage is full, could not save');
        return;
    }

    closeModal(composePopup);
    renderList();
    if (activeChatId === chatId && !chatModal.hidden) openChat(chatId);
    showToast(composeMode === 'image' ? 'Image sent' : 'File sent');
});

editForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const id = editId.value;
    const name = editName.value.trim();
    const uid = editUid.value.trim();
    const phone = editPhone.value.trim();

    if (name.length < 2) {
        setError(editName, 'Please enter a name');
        return;
    }
    if (!/^[A-Za-z0-9]{4,}$/.test(uid)) {
        setError(editUid, 'Please enter a valid UID');
        return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
        setError(editPhone, 'Please enter a valid 10 digit mobile number');
        return;
    }

    setError(editName, '');
    setError(editUid, '');
    setError(editPhone, '');

    updateChat(id, function(chat) {
        chat.name = name;
        chat.uid = uid;
        chat.phone = phone;
        chat.amount = editAmount.value.trim();
        chat.issue = editIssue.value;
    });

    closeModal(editPopup);
    renderList();
    if (activeChatId === id) openChat(id);
    showToast('Chat updated');
});

editUid.addEventListener('input', function() {
    this.value = this.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
    setError(this, '');
});

editName.addEventListener('input', function() {
    setError(this, '');
});

editPhone.addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
    setError(this, '');
});

editAmount.addEventListener('input', function() {
    let v = this.value.replace(/[^0-9.]/g, '');
    const dot = v.indexOf('.');
    if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '');
    this.value = v;
});

chatModal.addEventListener('click', function(e) {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (action === 'edit') openEdit(activeChatId);
        if (action === 'delete') {
            pendingDeleteId = activeChatId;
            openModal(confirmPopup);
        }
        if (action === 'reply') {
            messageInput.focus();
            messageInput.scrollIntoView({ block: 'nearest' });
            return;
        }
        return;
    }

    const img = e.target.closest('.msg-image');
    if (img) {
        const chat = getChat(activeChatId);
        const msg = chat && chat.messages[Number(img.dataset.msg)];
        openLightbox(img.src, (chat && chat.name ? chat.name : 'chat') + '-image.jpg');
        return;
    }

    const thumb = e.target.closest('.chat-thumb img');
    if (thumb) {
        const card = thumb.closest('.chat-card');
        const chat = getChat(card.dataset.id);
        const last = chat && lastMessageOf(chat);
        if (last && last.image) openLightbox(last.image, (chat.name || 'chat') + '-image.jpg');
    }
});

confirmDelete.addEventListener('click', function() {
    if (pendingDeleteId) deleteChat(pendingDeleteId);
    pendingDeleteId = null;
    activeChatId = null;
    closeModal(confirmPopup);
    closeModal(chatModal);
    renderList();
    showToast('Chat deleted');
});

lightboxClose.addEventListener('click', function() {
    lightboxImg.removeAttribute('src');
    closeModal(lightbox);
});

document.addEventListener('click', function(e) {
    const closer = e.target.closest('[data-close]');
    if (closer) closeModal(document.getElementById(closer.dataset.close));
});

document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    if (!lightbox.hidden) {
        lightboxImg.removeAttribute('src');
        closeModal(lightbox);
        return;
    }
    document.querySelectorAll('.modal-overlay:not([hidden])').forEach(function(m) {
        if (m !== gatePopup) closeModal(m);
    });
});

renderList();
renderIdentity();

if (!getIdentity()) {
    gateUid.value = '';
    gatePhone.value = '';
    openModal(gatePopup);
} else {
    closeModal(gatePopup);
}