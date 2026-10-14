const tracks = Array.from(document.querySelectorAll('#tracklist button[data-track]'), button => button.dataset.trackTitle);
    let trackIndex = 0;
    function selectTrack(index) {
        trackIndex = (index + tracks.length) % tracks.length;
        document.getElementById('now-playing').textContent = tracks[trackIndex];
        document.querySelectorAll('#tracklist button').forEach((b, i) => b.classList.toggle('active', i === trackIndex));
        document.getElementById('player-note').textContent = 'Selected: ' + tracks[trackIndex];
    }
    document.getElementById('tracklist').addEventListener('click', e => {
        const b = e.target.closest('button[data-track]');
        if (b)
            selectTrack(Number(b.dataset.track))
    });
    document.getElementById('prev-track').onclick = () => selectTrack(trackIndex - 1);
    document.getElementById('next-track').onclick = () => selectTrack(trackIndex + 1);
    document.getElementById('play-track').onclick = () => {
        document.getElementById('player-note').textContent = 'Audio will play here once songs are added.'
    };
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
