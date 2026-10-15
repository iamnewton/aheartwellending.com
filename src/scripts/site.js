const audioPlayer = document.getElementById('audio-player');
const trackButtons = Array.from(document.querySelectorAll('#tracklist button[data-track]'));
const playButton = document.getElementById('play-track');
const progress = document.getElementById('track-progress');
const progressFill = progress?.querySelector('span');
const playerNote = document.getElementById('player-note');
let trackIndex = 0;

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function setTrack(index, autoplay = false) {
    if (!audioPlayer || trackButtons.length === 0) return;
    trackIndex = (index + trackButtons.length) % trackButtons.length;
    const selected = trackButtons[trackIndex];
    document.getElementById('now-playing').textContent = selected.dataset.trackTitle;
    trackButtons.forEach((button, buttonIndex) => button.classList.toggle('active', buttonIndex === trackIndex));
    audioPlayer.pause();
    audioPlayer.removeAttribute('src');
    audioPlayer.load();
    progressFill.style.width = '0%';
    progress.setAttribute('aria-valuenow', '0');
    playButton.textContent = '▶';
    playButton.setAttribute('aria-label', 'Play selected song');
    playerNote.textContent = `Ready: ${selected.dataset.trackTitle}`;
    if (autoplay) startPlayback();
}

async function startPlayback() {
    if (!audioPlayer || trackButtons.length === 0) return;
    try {
        const selected = trackButtons[trackIndex];
        if (audioPlayer.getAttribute('src') !== selected.dataset.trackSrc) {
            audioPlayer.src = selected.dataset.trackSrc;
            audioPlayer.load();
        }
        await audioPlayer.play();
    } catch {
        playerNote.textContent = 'Could not load this track. Add its audio file to public/assets/audio/.';
    }
}

if (audioPlayer && trackButtons.length > 0) {
    setTrack(0);
    document.getElementById('tracklist').addEventListener('click', event => {
        const button = event.target.closest('button[data-track]');
        if (button) setTrack(Number(button.dataset.track), true);
    });
    document.getElementById('prev-track').addEventListener('click', () => setTrack(trackIndex - 1, true));
    document.getElementById('next-track').addEventListener('click', () => setTrack(trackIndex + 1, true));
    playButton.addEventListener('click', () => {
        if (audioPlayer.paused) startPlayback();
        else audioPlayer.pause();
    });
    audioPlayer.addEventListener('play', () => {
        playButton.textContent = '⏸';
        playButton.setAttribute('aria-label', 'Pause selected song');
        playerNote.textContent = 'Now playing';
    });
    audioPlayer.addEventListener('pause', () => {
        playButton.textContent = '▶';
        playButton.setAttribute('aria-label', 'Play selected song');
    });
    audioPlayer.addEventListener('timeupdate', () => {
        const percent = audioPlayer.duration ? (audioPlayer.currentTime / audioPlayer.duration) * 100 : 0;
        progressFill.style.width = `${percent}%`;
        progress.setAttribute('aria-valuenow', String(Math.round(percent)));
        playerNote.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
    });
    audioPlayer.addEventListener('ended', () => setTrack(trackIndex + 1, true));
    audioPlayer.addEventListener('error', () => {
        playerNote.textContent = 'Could not load this track. Add its audio file to public/assets/audio/.';
    });
    function seek(event) {
        if (!Number.isFinite(audioPlayer.duration) || audioPlayer.duration === 0) return;
        const bounds = progress.getBoundingClientRect();
        const percent = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
        audioPlayer.currentTime = percent * audioPlayer.duration;
    }
    progress.addEventListener('click', seek);
    progress.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const step = audioPlayer.duration ? audioPlayer.duration / 100 : 0;
        audioPlayer.currentTime = Math.max(0, Math.min(audioPlayer.duration || 0, audioPlayer.currentTime + (event.key === 'ArrowRight' ? step : -step)));
    });
}

    const boardList = document.getElementById('board-list');
    const savedPosts = JSON.parse(localStorage.getItem('ahe-board-posts') || '[]');
    function addPost(name, message, save) {
        const li = document.createElement('li'),
            icon = document.createElement('div'),
            body = document.createElement('div'),
            b = document.createElement('b'),
            small = document.createElement('small'),
            p = document.createElement('p');
        icon.className = 'board-icon';
        icon.textContent = '✦';
        b.textContent = name;
        small.textContent = 'From this browser';
        p.textContent = message;
        body.append(b, small, p);
        li.append(icon, body);
        boardList.append(li);
        if (save) {
            savedPosts.push({
                name,
                message
            });
            localStorage.setItem('ahe-board-posts', JSON.stringify(savedPosts.slice(-30)))
        }
    }
    savedPosts.forEach(x => addPost(x.name, x.message, false));
    document.getElementById('board-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('board-name'),
            message = document.getElementById('board-message');
        addPost(name.value.trim(), message.value.trim(), true);
        message.value = '';
        boardList.lastElementChild.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        })
    });
    const chatMessages = document.getElementById('chat-messages');
    const savedChat = JSON.parse(localStorage.getItem('ahe-chat-messages') || '[]');
    function addChat(message, save) {
        const p = document.createElement('p'),
            b = document.createElement('b');
        b.textContent = 'guest_2006: ';
        p.append(b, document.createTextNode(message));
        chatMessages.append(p);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        if (save) {
            savedChat.push(message);
            localStorage.setItem('ahe-chat-messages', JSON.stringify(savedChat.slice(-40)))
        }
    }
    savedChat.forEach(x => addChat(x, false));
    document.getElementById('chat-form').addEventListener('submit', e => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        addChat(input.value.trim(), true);
        input.value = '';
        input.focus()
    });
    const modal = document.getElementById('modal'),
        content = document.getElementById('modal-content');
    let returnFocus;
    function closeModal() {
        modal.classList.remove('open');
        returnFocus?.focus()
    }
    document.querySelectorAll('[data-modal]').forEach(button => button.addEventListener('click', () => {
        returnFocus = button;
        document.getElementById('modal-title').textContent = button.dataset.title;
        content.replaceChildren();
        if (button.dataset.image) {
            const img = document.createElement('img');
            img.src = button.dataset.image;
            img.alt = button.dataset.title + ' artwork';
            content.append(img)
        }
        const p = document.createElement('p');
        p.textContent = button.dataset.modal === 'video' ? 'This is a video gallery slot in the concept. Add the band’s videos to play them here.' : 'This item uses the supplied product image. Add its price and store link when the shop is ready.';
        content.append(p);
        modal.classList.add('open');
        document.getElementById('modal-close').focus()
    }));
    document.getElementById('modal-close').onclick = closeModal;
    modal.addEventListener('click', e => {
        if (e.target === modal)
            closeModal()
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('open'))
            closeModal()
    });
    if (document.modelContext?.registerTool) {
        for (const tool of [{
            name: 'post_message_board',
            title: 'Post to message board',
            description: 'Add a message to this browser’s Heartwell message board demo.',
            inputSchema: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string'
                    },
                    message: {
                        type: 'string'
                    }
                },
                required: ['name', 'message'],
                additionalProperties: false
            },
            execute(input) {
                const name = String(input?.name || '').trim(),
                    message = String(input?.message || '').trim();
                if (!name || name.length > 24 || !message || message.length > 280)
                    throw Error('Use a name up to 24 characters and a message up to 280 characters.');
                addPost(name, message, true);
                return {
                    posted: true,
                    name,
                    message
                }
            }
        }, {
            name: 'send_chat_message',
            title: 'Send chat message',
            description: 'Send a message as guest_2006 in this browser’s Heartwell chat demo.',
            inputSchema: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string'
                    }
                },
                required: ['message'],
                additionalProperties: false
            },
            execute(input) {
                const message = String(input?.message || '').trim();
                if (!message || message.length > 200)
                    throw Error('Use a message up to 200 characters.');
                addChat(message, true);
                return {
                    sent: true,
                    screenName: 'guest_2006',
                    message
                }
            }
        }]) {
            try {
                Promise.resolve(document.modelContext.registerTool({
                    ...tool,
                    annotations: {
                        readOnlyHint: false,
                        untrustedContentHint: false
                    }
                })).catch(() => {})
            } catch {}
        }
    }
