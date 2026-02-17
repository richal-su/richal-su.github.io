// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Данные (заглушки, которые потом заменятся на данные из API)
let tracks = [
    { id: '1', title: 'Solar Flare', artist: 'Retrowave', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover: 'https://picsum.photos/200?1' },
    { id: '2', title: 'Deep Night', artist: 'Lofi Girl', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', cover: 'https://picsum.photos/200?2' },
    { id: '3', title: 'Techno Power', artist: 'Berlin DJ', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', cover: 'https://picsum.photos/200?3' },
    { id: '4', title: 'Midnight City', artist: 'M83', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', cover: 'https://picsum.photos/200?4' }
];

// Состояние приложения
let favorites = JSON.parse(localStorage.getItem('my_fav_tracks')) || [];
let currentTrackIndex = 0;
let isPlaying = false;
let currentTab = 'all';
const audio = new Audio();

// Элементы DOM
const trackListContainer = document.getElementById('trackList');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const searchInput = document.getElementById('searchInput');

/**
 * Рендер списка треков
 */
function render() {
    trackListContainer.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase();
    
    // Фильтрация по поиску
    let filtered = tracks.filter(t => 
        t.title.toLowerCase().includes(searchTerm) || 
        t.artist.toLowerCase().includes(searchTerm)
    );

    // Фильтрация по табам (Все / Избранное)
    if (currentTab === 'favorites') {
        filtered = filtered.filter(t => favorites.includes(t.id));
    }

    if (filtered.length === 0) {
        trackListContainer.innerHTML = '<div style="text-align:center; color:gray; margin-top:20px;">Ничего не найдено</div>';
        return;
    }

    filtered.forEach(track => {
        const isCurrent = tracks[currentTrackIndex].id === track.id;
        const isFav = favorites.includes(track.id);
        
        const div = document.createElement('div');
        div.className = `track-card ${isCurrent ? 'active-track' : ''}`;
        
        // Логика эквалайзера: класс animating добавляется только если трек текущий И играет
        const eqClass = (isCurrent && isPlaying) ? 'animating' : '';

        div.innerHTML = `
            <img src="${track.cover}" class="track-img" onclick="playById('${track.id}')">
            <div class="track-details" onclick="playById('${track.id}')">
                <div class="track-name" style="${isCurrent ? 'color: var(--accent);' : ''}">${track.title}</div>
                <div class="track-author">${track.artist}</div>
            </div>
            ${isCurrent ? `<div class="equalizer ${eqClass}"><span></span><span></span><span></span></div>` : ''}
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${track.id}', event)">
                <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
            </button>
        `;
        trackListContainer.appendChild(div);
    });
}

/**
 * Загрузка трека в плеер
 */
function loadTrack(index, shouldPlay = true) {
    currentTrackIndex = index;
    const track = tracks[index];
    audio.src = track.src;
    
    // Обновление интерфейса плеера
    document.getElementById('playerTitle').innerText = track.title;
    document.getElementById('playerArtist').innerText = track.artist;
    document.getElementById('playerCover').src = track.cover;

    if (shouldPlay) {
        playTrack();
    } else {
        render();
    }
}

function playTrack() {
    audio.play().catch(e => console.log("Нужно взаимодействие с пользователем для старта"));
    isPlaying = true;
    playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    render(); 
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    render(); 
}

/**
 * Перемотка трека
 */
progressContainer.onclick = (e) => {
    if (audio.duration) {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        audio.currentTime = (clickX / width) * duration;
    }
};

/**
 * Клик по треку из списка
 */
window.playById = (id) => {
    const idx = tracks.findIndex(t => t.id === id);
    if (idx === currentTrackIndex) {
        isPlaying ? pauseTrack() : playTrack();
    } else {
        loadTrack(idx, true);
    }
};

/**
 * Добавление/удаление из избранного
 */
window.toggleFav = (id, event) => {
    event.stopPropagation(); // Чтобы не срабатывал клик по треку
    
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
    } else {
        favorites.push(id);
        // Вибрация Telegram при добавлении
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    }
    
    localStorage.setItem('my_fav_tracks', JSON.stringify(favorites));
    render();
};

// Обработчики кнопок управления
playPauseBtn.onclick = () => isPlaying ? pauseTrack() : playTrack();

document.getElementById('nextBtn').onclick = () => {
    let next = (currentTrackIndex + 1) % tracks.length;
    loadTrack(next, true);
};

document.getElementById('prevBtn').onclick = () => {
    let prev = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    loadTrack(prev, true);
};

// Обновление прогресс-бара
audio.ontimeupdate = () => {
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${progress}%`;
    }
};

// Автопереключение на следующий трек
audio.onended = () => {
    let next = (currentTrackIndex + 1) % tracks.length;
    loadTrack(next, true);
};

// Поиск
searchInput.oninput = render;

// Переключение табов
document.querySelectorAll('.tab-item').forEach(tab => {
    tab.onclick = () => {
        document.querySelector('.tab-item.active').classList.remove('active');
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        render();
    };
});

// Запуск приложения
function init() {
    loadTrack(0, false); // Загружаем первый трек без автоплея
}

init();