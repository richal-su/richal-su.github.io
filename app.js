const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Данные с новыми, более надежными ссылками на обложки
let tracks = [
    { id: '1', title: 'Solar Flare', artist: 'Retrowave', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover: 'https://placehold.co/400x400/248bfe/ffffff?text=Retrowave' },
    { id: '2', title: 'Deep Night Chant', artist: 'Lofi Girl', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', cover: 'https://placehold.co/400x400/5900b3/ffffff?text=Lofi+Chill' },
    { id: '3', title: 'Techno Power Bunker', artist: 'Berlin DJ', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', cover: 'https://placehold.co/400x400/000000/ffffff?text=TECHNO' },
    { id: '4', title: 'Synthwave Sunset Drive', artist: 'FutureCop', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', cover: 'https://placehold.co/400x400/ff5500/ffffff?text=Synthwave' }
];

let favorites = JSON.parse(localStorage.getItem('my_fav_tracks')) || [];
let currentTrackIndex = 0;
let isPlaying = false;
let currentTab = 'all';
const audio = new Audio();

function render() {
    const container = document.getElementById('trackList');
    container.innerHTML = '';
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = tracks.filter(t => t.title.toLowerCase().includes(searchTerm) || t.artist.toLowerCase().includes(searchTerm));
    if (currentTab === 'favorites') filtered = filtered.filter(t => favorites.includes(t.id));

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--hint); margin-top:20px;">Ничего не найдено</div>';
        return;
    }

    filtered.forEach(track => {
        const isCurrent = tracks[currentTrackIndex].id === track.id;
        const isFav = favorites.includes(track.id);
        const div = document.createElement('div');
        div.className = `track-card ${isCurrent ? 'active-track' : ''}`;
        div.innerHTML = `
            <img src="${track.cover}" class="track-img" onclick="playById('${track.id}')">
            <div class="track-details" onclick="playById('${track.id}')">
                <div class="track-name" style="${isCurrent ? 'color: var(--accent)' : ''}">${track.title}</div>
                <div class="track-author">${track.artist}</div>
            </div>
            ${isCurrent ? `<div class="equalizer ${isPlaying ? 'animating' : ''}"><span></span><span></span><span></span></div>` : ''}
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${track.id}', event)">
                <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

function loadTrack(index, shouldPlay = true) {
    currentTrackIndex = index;
    const track = tracks[index];
    audio.src = track.src;
    
    document.getElementById('playerTitle').innerText = track.title;
    document.getElementById('playerArtist').innerText = track.artist;
    document.getElementById('playerCover').src = track.cover;
    document.getElementById('fullTitle').innerText = track.title;
    document.getElementById('fullArtist').innerText = track.artist;
    document.getElementById('fullCover').src = track.cover;

    updateFavUI(track.id);
    if (shouldPlay) playTrack();
    render();
}

function playTrack() {
    // Важно: на мобильных автоплей может быть заблокирован до первого клика
    audio.play().catch(e => console.log("Waiting for user interaction to play"));
    isPlaying = true;
    updatePlayBtns();
    render();
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    updatePlayBtns();
    render();
}

function updatePlayBtns() {
    const html = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    document.getElementById('playPauseBtn').innerHTML = html;
    document.getElementById('fullPlayPauseBtn').innerHTML = html;
}

function updateFavUI(id) {
    const isFav = favorites.includes(id);
    document.getElementById('fullFavBtn').className = `fav-btn-large ${isFav ? 'active' : ''}`;
    document.getElementById('fullFavBtn').innerHTML = `<i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>`;
}

window.toggleFav = (id, event) => {
    if(event) event.stopPropagation();
    favorites = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    if (favorites.includes(id) && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    localStorage.setItem('my_fav_tracks', JSON.stringify(favorites));
    updateFavUI(id);
    render();
};

audio.ontimeupdate = () => {
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        document.getElementById('miniProgressBar').style.width = `${progress}%`;
        document.getElementById('fullProgressBar').style.width = `${progress}%`;
        document.getElementById('currentTime').innerText = formatTime(audio.currentTime);
        document.getElementById('totalTime').innerText = formatTime(audio.duration);
    }
};

const formatTime = (s) => `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
const scrub = (e, el) => { if(audio.duration) audio.currentTime = (e.offsetX / el.clientWidth) * audio.duration; };

// Обработчики событий

// Перемотка
document.getElementById('miniProgressContainer').onclick = (e) => scrub(e, e.currentTarget);
document.getElementById('fullProgressContainer').onclick = (e) => scrub(e, e.currentTarget);

// Открытие полноэкранного плеера (нажатие на область текста и обложки)
document.querySelector('.clickable-area').onclick = () => document.getElementById('fullPlayer').classList.add('active');
// Закрытие плеера
document.getElementById('closeFullPlayer').onclick = () => document.getElementById('fullPlayer').classList.remove('active');

// Заглушка для кнопки с тремя точками
document.getElementById('moreOptionsBtn').onclick = () => {
    if(tg.showPopup) {
         tg.showPopup({ message: 'Функции меню скоро появятся!' });
    } else {
         alert('Функции меню скоро появятся!');
    }
};

// Управление воспроизведением
document.getElementById('playPauseBtn').onclick = (e) => { e.stopPropagation(); isPlaying ? pauseTrack() : playTrack(); };
document.getElementById('fullPlayPauseBtn').onclick = () => isPlaying ? pauseTrack() : playTrack();
document.getElementById('fullNextBtn').onclick = () => loadTrack((currentTrackIndex + 1) % tracks.length);
document.getElementById('fullPrevBtn').onclick = () => loadTrack((currentTrackIndex - 1 + tracks.length) % tracks.length);
document.getElementById('fullFavBtn').onclick = () => toggleFav(tracks[currentTrackIndex].id);

window.playById = (id) => {
    const idx = tracks.findIndex(t => t.id === id);
    idx === currentTrackIndex ? (isPlaying ? pauseTrack() : playTrack()) : loadTrack(idx);
};

// Поиск и табы
document.getElementById('searchInput').oninput = render;
document.querySelectorAll('.tab-item').forEach(tab => {
    tab.onclick = () => {
        document.querySelector('.tab-item.active').classList.remove('active');
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        render();
    };
});

// Инициализация
loadTrack(0, false);