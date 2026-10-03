const IS_ADMIN = document.body.dataset.page === 'admin';
const SIDE = IS_ADMIN ? 'admin' : 'user';

const listPane = document.getElementById('listPane');
const chatPane = document.getElementById('chatPane');
const chatList = document.getElementById('chatList');
const emptyState = document.getElementById('emptyState');
const searchField = document.getElementById('chatSearch');

const backBtn = document.getElementById('backBtn');
const peerBtn = document.getElementById('peerBtn');
const peerAvatar = document.getElementById('peerAvatar');
const peerName = document.getElementById('peerName');
const peerStatus = document.getElementById('peerStatus');
const chatMenuBtn = document.getElementById('chatMenuBtn');
const messagesBox = document.getElementById('messages');

const attachBtn = document.getElementById('attachBtn');
const attachMenu = document.getElementById('attachMenu');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const imageInput = document.getElementById('imageInput');
const fileInput = document.getElementById('fileInput');

const gatePopup = document.getElementById('gatePopup');
const gateForm = document.getElementById('gateForm');
const gateUid = document.getElementById('gateUid');
const gatePhone = document.getElementById('gatePhone');

const newChatPopup = document.getElementById('newChatPopup');
const newChatForm = document.getElementById('newChatForm');
const newChatTopic = document.getElementById('newChatTopic');
const newChatText = document.getElementById('newChatText');
const newChatBtn = document.getElementById('newChatBtn');
const emptyNewChat = document.getElementById('emptyNewChat');

const infoPopup = document.getElementById('infoPopup');
const infoAvatar = document.getElementById('infoAvatar');
const infoName = document.getElementById('infoName');
const infoTopic = document.getElementById('infoTopic');
const infoFacts = document.getElementById('infoFacts');
const infoEditBtn = document.getElementById('infoEditBtn');
const infoDeleteBtn = document.getElementById('infoDeleteBtn');

const editPopup = document.getElementById('editPopup');
const editForm = document.getElementById('editForm');
const editName = document.getElementById('editName');
const editUid = document.getElementById('editUid');
const editPhone = document.getElementById('editPhone');
const editAmount = document.getElementById('editAmount');
const editAmountField = document.getElementById('editAmountField');
const editIssue = document.getElementById('editIssue');

const msgSheet = document.getElementById('msgSheet');
const msgSheetHead = document.getElementById('msgSheetHead');

const editMsgPopup = document.getElementById('editMsgPopup');
const editMsgForm = document.getElementById('editMsgForm');
const editMsgText = document.getElementById('editMsgText');

const confirmPopup = document.getElementById('confirmPopup');
const confirmTitle = document.getElementById('confirmTitle');
const confirmText = document.getElementById('confirmText');
const confirmOk = document.getElementById('confirmOk');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxName = document.getElementById('lightboxName');
const lightboxDownload = document.getElementById('lightboxDownload');
const lightboxClose = document.getElementById('lightboxClose');

let activeChatId = null;
let sheetMsgId = null;
let confirmAction = null;

const IDENTITY_STORE = IS_ADMIN ? 'tivra_admin_identity_v1' : 'tivra_identity_v1';
const AUTO_STORE = 'tivra_autoreply_v1';

const AUTO_REPLIES = [
    { keys: ['deposit', 'credited', 'credit', 'not received', 'money not'], text: 'We have noted your deposit issue. Our payments team is verifying the transaction and you will get an update shortly.' },
    { keys: ['withdraw', 'withdrawal', 'payout'], text: 'Your withdrawal request is under review. Payouts are usually processed within 2 to 4 hours once approved.' },
    { keys: ['kyc', 'verify', 'verification', 'document'], text: 'Please make sure your KYC images are clear with all four corners visible. Our verification team will review them.' },
    { keys: ['refund', 'money back', 'return'], text: 'Refunds are processed to the same source account and usually reflect within 5 to 7 working days.' },
    { keys: ['screenshot', 'image', 'proof', 'transaction id', 'txn', 'utr'], text: 'Please share the transaction ID along with a screenshot of the issue so we can check it faster.' },
    { keys: ['hi', 'hello', 'hey'], text: 'Hello! Welcome to TIVRA Pay support. Please tell us what issue you are facing.' },
    { keys: ['thanks', 'thank you', 'thx'], text: 'Happy to help. Is there anything else you need assistance with?' },
    { keys: ['account', 'login', 'lock', 'blocked'], text: 'We have received your account concern. Our team will verify your login details and update you shortly.' },
    { keys: ['not working', 'error', 'failed'], text: 'Sorry about the trouble. Please tell us which step is failing and we will resolve it.' }
];

const DEFAULT_REPLY = 'Thank you for reaching out. We have received your message and our support team will get back to you shortly.';

function autoReplyEnabled() {
    return localStorage.getItem(AUTO_STORE) !== 'off';
}

function setAutoReply(on) {
    localStorage.setItem(AUTO_STORE, on ? 'on' : 'off');
}

function pickAutoReply(text) {
    const t = String(text || '').toLowerCase();
    for (let i = 0; i < AUTO_REPLIES.length; i++) {
        const r = AUTO_REPLIES[i];
        for (let k = 0; k < r.keys.length; k++) {
            if (t.includes(r.keys[k])) return r.text;
        }
    }
    return DEFAULT_REPLY;
}

const autoChip = document.getElementById('autoChip');

let typingChatId = null;

function showTyping(id) {
    typingChatId = id;
    const chat = getChat(id);
    if (chat) renderConversation(chat);
}

function hideTyping() {
    typingChatId = null;
}

function maybeAutoReply(chatId) {
    if (IS_ADMIN) return;
    if (!autoReplyEnabled()) return;

    const chat = getChat(chatId);
    if (!chat) return;

    const msgs = chat.messages || [];
    const last = msgs[msgs.length - 1];
    if (!last || last.from !== 'user') return;

    const adminTookOver = msgs.some(function(m) { return m.from === 'admin' && !m.auto; });
    if (adminTookOver) return;

    showTyping(chatId);

    setTimeout(function() {
        hideTyping();

        const fresh = getChat(chatId);
        if (!fresh) return;
        const freshMsgs = fresh.messages || [];
        const freshLast = freshMsgs[freshMsgs.length - 1];
        if (!freshLast || freshLast.from !== 'user') return;

        try {
            addMessage(chatId, { from: 'admin', text: pickAutoReply(freshLast.text), auto: true });
        } catch (e) {
            showToast('Browser storage is full, could not save');
            return;
        }

        openChat(chatId);
    }, 2400);
}

function currentIdentity() {
    try {
        return JSON.parse(localStorage.getItem(IDENTITY_STORE)) || null;
    } catch (e) {
        return null;
    }
}

function saveIdentity(uid, phone) {
    localStorage.setItem(IDENTITY_STORE, JSON.stringify({ uid: uid, phone: phone }));
}

const AVATAR_COLORS = ['#e53935', '#8e24aa', '#3949ab', '#00897b', '#f57c00', '#5e35b1', '#c2185b', '#00796b'];

function avatarFor(seed) {
    const text = String(seed || '?');
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
    const initials = text.trim().slice(0, 2).toUpperCase() || '?';
    return { color: color, initials: initials };
}

function applyAvatar(el, seed) {
    const a = avatarFor(seed);
    el.textContent = a.initials;
    el.style.background = a.color;
}

function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function openLayer(el) {
    el.hidden = false;
    document.body.classList.add('is-locked');
}

function closeLayer(el) {
    el.hidden = true;
    const open = document.querySelectorAll('.modal-overlay:not([hidden]), .sheet-overlay:not([hidden]), .lightbox:not([hidden])');
    if (open.length === 0) document.body.classList.remove('is-locked');
}

function lastMessageOf(chat) {
    const m = chat.messages || [];
    return m.length ? m[m.length - 1] : null;
}

function previewOf(chat) {
    const last = lastMessageOf(chat);
    if (!last) return 'No message';
    if (last.text) return last.text;
    if (last.image) return 'Image';
    if (last.file) return last.file.name;
    return 'No message';
}

function unreadCount(chat) {
    const mine = SIDE === 'admin' ? 'user' : 'admin';
    return (chat.messages || []).filter(function(m) { return m.from === mine && !m.readBy && m.from !== SIDE; }).length;
}

function renderList() {
    const term = (searchField.value || '').trim().toLowerCase();
    let chats = readChats();

    if (term) {
        chats = chats.filter(function(c) {
            return [c.name, c.uid, c.phone, c.issue, c.amount].join(' ').toLowerCase().includes(term);
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
        const unread = unreadCount(c);
        const preview = last && last.from === SIDE ? 'You: ' + previewOf(c) : previewOf(c);
        const avatarSeed = c.uid || c.name || c.id;

        return '<button type="button" class="ms-chat-row' + (unread ? ' unread' : '') + '" data-id="' + c.id + '">' +
            '<span class="ms-avatar" data-seed="' + escapeHtml(avatarSeed) + '"></span>' +
            '<span class="ms-row-main">' +
                '<span class="ms-row-top">' +
                    '<span class="ms-row-name">' + escapeHtml(c.name || 'Guest') + '</span>' +
                    '<span class="ms-row-time">' + stamp + '</span>' +
                '</span>' +
                '<span class="ms-row-topic">' + escapeHtml(c.issue || '') + '</span>' +
                '<span class="ms-row-msg">' + escapeHtml(preview) + '</span>' +
            '</span>' +
            (unread ? '<span class="ms-unread">' + unread + '</span>' : '') +
        '</button>';
    }).join('');

    chatList.querySelectorAll('.ms-avatar[data-seed]').forEach(function(el) {
        applyAvatar(el, el.dataset.seed);
    });
}

function renderConversation(chat) {
    applyAvatar(peerAvatar, chat.uid || chat.name || chat.id);
    peerName.textContent = chat.name || 'Guest';
    peerStatus.textContent = (chat.issue || '') + (chat.phone ? ' · ' + chat.phone : '');

    const msgs = chat.messages || [];
    if (!msgs.length) {
        messagesBox.innerHTML = '<div class="ms-no-msgs">No messages yet. Say hello.</div>';
        return;
    }

    let lastDay = '';
    let html = '';

    msgs.forEach(function(m) {
        const day = fmtDate(m.at);
        if (day !== lastDay) {
            html += '<div class="ms-daysep"><span>' + day + '</span></div>';
            lastDay = day;
        }

        const mine = m.from === SIDE;
        let body = '';

        if (m.image) {
            body += '<img class="ms-bubble-img" src="' + m.image + '" alt="Image" data-img="1">';
        }
        if (m.file) {
            body += '<span class="ms-bubble-file">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
                '<polyline points="14 2 14 8 20 8"/></svg>' +
                '<span class="ms-file-text">' + escapeHtml(m.file.name) +
                (m.file.size ? '<em>' + formatSize(m.file.size) + '</em>' : '') + '</span>' +
            '</span>';
        }
        if (m.text) body += '<span class="ms-bubble-text">' + escapeHtml(m.text) + '</span>';

        html += '<div class="ms-msg ' + (mine ? 'out' : 'in') + '" data-msg-id="' + m.id + '">' +
            '<div class="ms-bubble">' + body +
                '<span class="ms-bubble-time">' + fmtTime(m.at) +
                (m.auto ? ' · auto' : '') + (m.edited ? ' · edited' : '') + '</span>' +
            '</div>' +
        '</div>';
    });

    if (typingChatId) {
        html += '<div class="ms-msg in typing">' +
            '<div class="ms-bubble"><span class="ms-typing"><i></i><i></i><i></i></span></div>' +
        '</div>';
    }

    messagesBox.innerHTML = html;
}

function scrollToBottom() {
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

function openChat(id, skipScroll) {
    const chat = getChat(id);
    if (!chat) return;

    activeChatId = id;

    if (SIDE === 'admin') {
        updateChat(id, function(c) {
            (c.messages || []).forEach(function(m) {
                if (m.from === 'admin') m.readBy = true;
            });
        });
    }

    const fresh = getChat(id) || chat;
    renderConversation(fresh);
    chatPane.hidden = false;
    document.body.classList.add('chat-open');
    if (!skipScroll) requestAnimationFrame(scrollToBottom);
    renderList();
}

function closeChat() {
    activeChatId = null;
    chatPane.hidden = true;
    document.body.classList.remove('chat-open');
    renderList();
}

function openInfo() {
    const chat = getChat(activeChatId);
    if (!chat) return;

    applyAvatar(infoAvatar, chat.uid || chat.name || chat.id);
    infoName.textContent = chat.name || 'Guest';
    infoTopic.textContent = chat.issue || '';

    const last = lastMessageOf(chat);
    infoFacts.innerHTML =
        fact('Date', fmtDate(chat.createdAt)) +
        fact('Time', fmtTime(chat.createdAt)) +
        fact('UID', chat.uid || '-') +
        fact('Mobile', chat.phone || '-') +
        (chat.amount ? fact('Amount', chat.amount) : '') +
        fact('Last Activity', last ? fmtTime(last.at) : '-') +
        fact('Messages', String((chat.messages || []).length));

    openLayer(infoPopup);
}

function fact(k, v) {
    return '<div class="fact"><span class="fact-k">' + k + '</span><span class="fact-v">' + escapeHtml(v) + '</span></div>';
}

function renderAutoChip() {
    if (IS_ADMIN || !autoChip) return;
    const on = autoReplyEnabled();
    autoChip.textContent = 'Auto: ' + (on ? 'On' : 'Off');
    autoChip.classList.toggle('off', !on);
    autoChip.title = on
        ? 'Auto reply is on. Tap to switch off when an agent replies.'
        : 'Auto reply is off. Tap to switch on.';
}

if (autoChip) {
    autoChip.addEventListener('click', function() {
        const next = !autoReplyEnabled();
        setAutoReply(next);
        renderAutoChip();
        showToast(next ? 'Auto reply switched on' : 'Auto reply switched off');
    });
}

function sendText() {
    const text = messageInput.value.trim();
    if (!text || !activeChatId) return;

    addMessage(activeChatId, { from: SIDE, text: text });
    messageInput.value = '';
    openChat(activeChatId);
    messageInput.focus();
    maybeAutoReply(activeChatId);
}

function openAttachMenu() {
    attachMenu.hidden = !attachMenu.hidden;
}

async function sendFile(kind, file) {
    if (!file || !activeChatId) return;

    const msg = { from: SIDE, text: '' };

    if (kind === 'image') {
        try {
            msg.image = await compressImage(file);
        } catch (e) {
            showToast('Could not read that image');
            return;
        }
    } else {
        msg.file = { name: file.name, size: file.size, type: file.type };
    }

    try {
        addMessage(activeChatId, msg);
    } catch (e) {
        showToast('Browser storage is full, could not save');
        return;
    }

    openChat(activeChatId);
    showToast(kind === 'image' ? 'Image sent' : 'File sent');
    maybeAutoReply(activeChatId);
}

function openMsgSheet(msgId) {
    const chat = getChat(activeChatId);
    if (!chat) return;
    const msg = (chat.messages || []).find(function(m) { return m.id === msgId; });
    if (!msg) return;

    sheetMsgId = msgId;
    msgSheetHead.textContent = msg.text ? msg.text.slice(0, 60) : (msg.image ? 'Image' : 'File');

    const mine = msg.from === SIDE;
    msgSheet.querySelector('[data-sheet="edit"]').hidden = !mine || !msg.text;
    msgSheet.querySelector('[data-sheet="delete"]').hidden = false;

    openLayer(msgSheet);
}

if (newChatBtn) newChatBtn.addEventListener('click', function() {
    newChatText.value = '';
    setError(newChatText, '');
    openLayer(newChatPopup);
    newChatText.focus();
});

if (emptyNewChat) emptyNewChat.addEventListener('click', function() { openLayer(newChatPopup); });

if (newChatForm) newChatForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const text = newChatText.value.trim();
    if (text.length < 2) {
        setError(newChatText, 'Please type your message');
        return;
    }

    const id = currentIdentity() || {};

    const chat = {
        id: newId(),
        issue: newChatTopic.value,
        name: 'Guest',
        uid: id.uid || '',
        phone: id.phone || '',
        amount: '',
        createdAt: new Date().toISOString(),
        messages: []
    };

    addChat(chat);
    addMessage(chat.id, { from: SIDE, text: text });

    closeLayer(newChatPopup);
    renderList();
    openChat(chat.id);
    showToast('Chat started');
    maybeAutoReply(chat.id);
});

gateForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const uid = gateUid.value.trim();
    const phone = gatePhone.value.trim();
    const uidOk = /^[A-Za-z0-9]{4,}$/.test(uid);
    const phoneOk = /^[0-9]{10}$/.test(phone);

    setError(gateUid, uidOk ? '' : 'Please enter a valid UID');
    setError(gatePhone, phoneOk ? '' : 'Please enter a valid 10 digit mobile number');
    if (!uidOk || !phoneOk) return;

    saveIdentity(uid, phone);
    closeLayer(gatePopup);
});

gateUid.addEventListener('input', function() {
    this.value = this.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
    setError(this, '');
});

gatePhone.addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
    setError(this, '');
});

backBtn.addEventListener('click', closeChat);
peerBtn.addEventListener('click', openInfo);
chatMenuBtn.addEventListener('click', openInfo);
searchField.addEventListener('input', renderList);

chatList.addEventListener('click', function(e) {
    const row = e.target.closest('.ms-chat-row');
    if (row) openChat(row.dataset.id);
});

attachBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    openAttachMenu();
});

attachMenu.addEventListener('click', function(e) {
    const item = e.target.closest('[data-attach]');
    if (!item) return;
    attachMenu.hidden = true;
    if (item.dataset.attach === 'image') imageInput.click();
    else fileInput.click();
});

document.addEventListener('click', function(e) {
    if (!attachMenu.hidden && !e.target.closest('#attachMenu') && !e.target.closest('#attachBtn')) {
        attachMenu.hidden = true;
    }
});

imageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) sendFile('image', this.files[0]);
    this.value = '';
});

fileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) sendFile('file', this.files[0]);
    this.value = '';
});

sendBtn.addEventListener('click', sendText);

messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendText();
    }
});

messagesBox.addEventListener('click', function(e) {
    const img = e.target.closest('[data-img]');
    if (img) {
        openLightbox(img.src, 'chat-image.jpg');
        return;
    }

    const msg = e.target.closest('.ms-msg');
    if (msg) openMsgSheet(msg.dataset.msgId);
});

let longPressTimer = null;
messagesBox.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    const msg = e.target.closest('.ms-msg');
    if (msg) openMsgSheet(msg.dataset.msgId);
});

if (msgSheet) msgSheet.addEventListener('click', function(e) {
    const item = e.target.closest('[data-sheet]');
    if (!item) return;

    const action = item.dataset.sheet;
    if (action === 'cancel') {
        closeLayer(msgSheet);
        return;
    }

    if (action === 'reply') {
        closeLayer(msgSheet);
        messageInput.focus();
        return;
    }

    if (action === 'edit') {
        const chat = getChat(activeChatId);
        const msg = (chat.messages || []).find(function(m) { return m.id === sheetMsgId; });
        closeLayer(msgSheet);
        if (!msg || !editMsgPopup) return;
        editMsgText.value = msg.text || '';
        openLayer(editMsgPopup);
        editMsgText.focus();
        return;
    }

    if (action === 'delete') {
        closeLayer(msgSheet);
        confirmTitle.textContent = 'Delete this message?';
        confirmText.textContent = 'The message will be removed from this chat.';
        confirmAction = function() {
            deleteMessage(activeChatId, sheetMsgId);
            openChat(activeChatId);
            showToast('Message deleted');
        };
        openLayer(confirmPopup);
    }
});

if (editMsgForm) editMsgForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const text = editMsgText.value.trim();
    if (!text) {
        setError(editMsgText, 'Message cannot be empty');
        return;
    }
    updateMessage(activeChatId, sheetMsgId, { text: text, edited: true });
    closeLayer(editMsgPopup);
    openChat(activeChatId);
    showToast('Message updated');
});

infoEditBtn.addEventListener('click', function() {
    const chat = getChat(activeChatId);
    if (!chat) return;

    editName.value = chat.name || '';
    editUid.value = chat.uid || '';
    editPhone.value = chat.phone || '';
    editAmount.value = chat.amount || '';
    editIssue.value = chat.issue || 'General Query';
    editAmountField.hidden = !chat.amount;

    closeLayer(infoPopup);
    openLayer(editPopup);
});

infoDeleteBtn.addEventListener('click', function() {
    closeLayer(infoPopup);
    confirmTitle.textContent = 'Delete this chat?';
    confirmText.textContent = 'The chat and all its messages will be removed from this browser. This cannot be undone.';
    confirmAction = function() {
        deleteChat(activeChatId);
        closeChat();
        showToast('Chat deleted');
    };
    openLayer(confirmPopup);
});

editForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = editName.value.trim();
    const uid = editUid.value.trim();
    const phone = editPhone.value.trim();

    if (name.length < 2) { setError(editName, 'Please enter a name'); return; }
    if (!/^[A-Za-z0-9]{4,}$/.test(uid)) { setError(editUid, 'Please enter a valid UID'); return; }
    if (!/^[0-9]{10}$/.test(phone)) { setError(editPhone, 'Please enter a valid 10 digit mobile number'); return; }

    setError(editName, '');
    setError(editUid, '');
    setError(editPhone, '');

    updateChat(activeChatId, function(chat) {
        chat.name = name;
        chat.uid = uid;
        chat.phone = phone;
        chat.amount = editAmount.value.trim();
        chat.issue = editIssue.value;
    });

    closeLayer(editPopup);
    openChat(activeChatId);
    showToast('Chat updated');
});

editName.addEventListener('input', function() { setError(this, ''); });

editUid.addEventListener('input', function() {
    this.value = this.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
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

if (editMsgText) editMsgText.addEventListener('input', function() { setError(this, ''); });

confirmOk.addEventListener('click', function() {
    const fn = confirmAction;
    confirmAction = null;
    closeLayer(confirmPopup);
    if (fn) fn();
});

lightboxClose.addEventListener('click', function() {
    lightboxImg.removeAttribute('src');
    closeLayer(lightbox);
});

function openLightbox(src, name) {
    lightboxImg.src = src;
    lightboxName.textContent = name || 'Image';
    lightboxDownload.href = src;
    lightboxDownload.setAttribute('download', name || 'image.jpg');
    openLayer(lightbox);
}

document.addEventListener('click', function(e) {
    const closer = e.target.closest('[data-close]');
    if (closer) closeLayer(document.getElementById(closer.dataset.close));
});

document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;

    if (!lightbox.hidden) {
        lightboxImg.removeAttribute('src');
        closeLayer(lightbox);
        return;
    }
    if (!msgSheet.hidden) { closeLayer(msgSheet); return; }
    if (!attachMenu.hidden) { attachMenu.hidden = true; return; }
    if (!infoPopup.hidden) { closeLayer(infoPopup); return; }
    if (!editPopup.hidden) { closeLayer(editPopup); return; }
    if (!editMsgPopup.hidden) { closeLayer(editMsgPopup); return; }
    if (!confirmPopup.hidden) { closeLayer(confirmPopup); return; }
    if (!newChatPopup.hidden) { closeLayer(newChatPopup); return; }
    if (!chatPane.hidden && window.innerWidth < 768) closeChat();
});

renderList();
renderAutoChip();

if (currentIdentity()) closeLayer(gatePopup);
else openLayer(gatePopup);