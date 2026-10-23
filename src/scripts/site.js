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
const chatForm = document.getElementById('chat-form');
if (chatForm) {
	const chatInput = document.getElementById('chat-input');
	const chatStatus = document.getElementById('chat-status');
	const draftKey = 'ahe-discord-message-draft';
	chatInput.value = localStorage.getItem(draftKey) || '';
	chatInput.addEventListener('input', () => localStorage.setItem(draftKey, chatInput.value));
	chatForm.addEventListener('submit', async event => {
		event.preventDefault();
		const message = chatInput.value.trim();
		if (!message) return;
		localStorage.setItem(draftKey, message);
		const invite = chatForm.dataset.discordInvite;
		if (!invite) {
			chatStatus.textContent = 'Add the Discord invite link to finish connecting this room.';
			return;
		}
		// Open during the submit gesture so browsers do not block the new tab.
		window.open(invite, '_blank', 'noopener,noreferrer');
		try {
			await navigator.clipboard.writeText(message);
			chatStatus.textContent = 'Message copied! Paste it into the Discord chat after you join.';
		} catch {
			chatStatus.textContent = 'Your draft is saved here. Copy it before pasting into Discord.';
		}
	});
}
const discordServerCard = document.getElementById('discord-server-card');
if (discordServerCard) {
	const serverName = document.getElementById('discord-server-name');
	const presenceCount = document.getElementById('discord-presence-count');
	const serverNote = document.getElementById('discord-server-note');
	const onlineFriends = document.getElementById('discord-online-friends');
	const serverUpdated = document.getElementById('discord-server-updated');
	const widgetDataUrl = 'https://discord.com/api/guilds/1536825871875178568/widget.json';
	const statusLabels = { online: 'online', idle: 'away', dnd: 'do not disturb', offline: 'offline' };
	fetch(widgetDataUrl)
		.then(response => {
			if (!response.ok) throw new Error('Discord widget data is unavailable.');
			return response.json();
		})
		.then(data => {
			serverName.textContent = data.name || 'Heartwell Discord';
			presenceCount.textContent = Number.isFinite(data.presence_count) ? data.presence_count.toLocaleString() : '—';
			const members = Array.isArray(data.members) ? data.members : [];
			const priority = { online: 0, idle: 1, dnd: 2, offline: 3 };
			members
				.filter(member => member && member.username && member.status !== 'offline')
				.sort((a, b) => (priority[a.status] ?? 4) - (priority[b.status] ?? 4))
				.slice(0, 10)
				.forEach(member => {
					const card = document.createElement('div');
					const avatar = document.createElement(member.avatar_url ? 'img' : 'span');
					const copy = document.createElement('span');
					const name = document.createElement('span');
					const status = document.createElement('span');
					card.className = 'online-friend';
					if (member.avatar_url) {
						avatar.src = member.avatar_url;
						avatar.alt = '';
						avatar.loading = 'lazy';
					} else {
						avatar.className = 'online-friend-avatar';
						avatar.textContent = member.username.slice(0, 1).toUpperCase();
					}
					copy.className = 'online-friend-copy';
					name.className = 'online-friend-name';
					name.textContent = member.username;
					status.className = 'online-friend-status';
					status.dataset.status = member.status || 'online';
					status.textContent = statusLabels[member.status] || 'around';
					copy.append(name, status);
					card.append(avatar, copy);
					onlineFriends.append(card);
				});
			serverNote.textContent = members.length
				? 'A few familiar faces currently hanging out in the server:'
				: 'Be the first to say hi in the Heartwell server!';
			serverUpdated.textContent = 'Live from Discord · refresh the page for an update';
		})
		.catch(() => {
			serverNote.textContent = 'Live server details could not load right now.';
			serverUpdated.textContent = 'You can still visit the server using the button below.';
		});
}
const modal = document.getElementById('modal'),
	content = document.getElementById('modal-content');
let returnFocus;
function closeModal() {
	modal.classList.remove('open');
	modal.classList.remove('photo-modal');
	returnFocus?.focus()
}
document.querySelectorAll('[data-modal]').forEach(button => button.addEventListener('click', () => {
	returnFocus = button;
	document.getElementById('modal-title').textContent = button.dataset.title;
	content.replaceChildren();
	modal.classList.toggle('photo-modal', button.dataset.modal === 'photo');
	if (button.dataset.modal === 'photo' && button.dataset.image) {
		const img = document.createElement('img');
		img.src = button.dataset.image;
		img.alt = button.querySelector('img')?.alt || button.dataset.title;
		img.className = 'photo-modal-image';
		content.append(img);
	} else if (button.dataset.modal === 'video' && button.dataset.videoId) {
		const frame = document.createElement('iframe');
		frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(button.dataset.videoId)}?autoplay=1`;
		frame.title = button.dataset.title;
		frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
		frame.allowFullscreen = true;
		content.append(frame);
	} else if (button.dataset.image) {
		const img = document.createElement('img');
		img.src = button.dataset.image;
		img.alt = button.dataset.title + ' artwork';
		content.append(img);
		const detail = document.createElement('p');
		detail.className = 'merch-detail';
		detail.textContent = button.dataset.detail || '';
		content.append(detail);
		const buyButton = document.createElement('div');
		buyButton.className = 'shopify-buy-button';
		buyButton.dataset.shopifyProduct = button.dataset.shopifyProduct || '';
		if (!buyButton.dataset.shopifyProduct) {
			const note = document.createElement('p');
			note.className = 'shopify-placeholder';
			note.textContent = 'Merch store coming soon.';
			buyButton.append(note);
		}
		content.append(buyButton)
	}
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
document.querySelectorAll('[data-photo-carousel]').forEach(carousel => {
	const slides = Array.from(carousel.querySelectorAll('[data-photo-slide]'));
	const previous = carousel.querySelector('[data-photo-previous]');
	const next = carousel.querySelector('[data-photo-next]');
	const count = carousel.querySelector('[data-photo-count]');
	if (!slides.length || !previous || !next || !count) return;
	let start = 0;
	const update = () => {
		slides.forEach((slide, index) => {
			slide.hidden = index < start || index >= start + 2;
		});
		const end = Math.min(start + 2, slides.length);
		count.textContent = `${start + 1}–${end} of ${slides.length}`;
		previous.disabled = start === 0;
		next.disabled = end === slides.length;
	};
	previous.addEventListener('click', () => {
		start = Math.max(0, start - 2);
		update();
	});
	next.addEventListener('click', () => {
		start = Math.min(Math.max(0, slides.length - 2), start + 2);
		update();
	});
	update();
});
document.querySelectorAll('[data-merch-carousel]').forEach(carousel => {
	const track = carousel.querySelector('[data-merch-track]');
	const previous = carousel.querySelector('[data-merch-previous]');
	const next = carousel.querySelector('[data-merch-next]');
	if (!track || !previous || !next) return;
	const update = () => {
		const end = track.scrollWidth - track.clientWidth - 2;
		previous.disabled = track.scrollLeft <= 2;
		next.disabled = track.scrollLeft >= end;
	};
	previous.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' }));
	next.addEventListener('click', () => track.scrollBy({ left: track.clientWidth, behavior: 'smooth' }));
	track.addEventListener('scroll', update, { passive: true });
	window.addEventListener('resize', update);
	update();
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
			})).catch(() => { })
		} catch { }
	}
}
