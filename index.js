const albums = {
    Engagement: 'assets/Engagement',
    Haldi: 'assets/Haldi',
    Mehndi: 'assets/Mehndi',
    Wedding: 'assets/Wedding',
    Reception: 'assets/Reception'
};

const correctPassword = "love2025";
let unlocked = false;

const nav = document.getElementById('nav');
const albumsContainer = document.getElementById('albums');
const unlockBtn = document.getElementById('unlockBtn');
const passwordInput = document.getElementById('password');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const closeLightbox = document.getElementById('closeLightbox');
const downloadBtn = document.getElementById('downloadBtn');
const sharePanel = document.getElementById('sharePanel');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const slideshowBtn = document.getElementById('slideshowBtn');

let hideTimeout = null;
let slideshowMode = false;

// Loading Screen
window.addEventListener('load', () => {
    const loading = document.getElementById('loading');
    setTimeout(() => {
        loading.style.opacity = '0';
        setTimeout(() => {
            loading.style.display = 'none';
            buildAlbumsAndNav();
        }, 1400);
    }, 2500);
});

function buildAlbumsAndNav() {
    Object.keys(albums).forEach((albumName, index) => {
        const btn = document.createElement('button');
        btn.textContent = albumName;
        btn.dataset.album = albumName;
        if (index === 0) btn.classList.add('active');
        nav.appendChild(btn);

        const albumDiv = document.createElement('div');
        albumDiv.classList.add('album');
        if (index === 0) albumDiv.classList.add('active');
        albumDiv.id = `album-${albumName}`;

        const title = document.createElement('h2');
        title.textContent = albumName;
        albumDiv.appendChild(title);

        const panel = document.createElement('div');
        panel.className = 'panel';
        panel.style.cssText = `--radius:20px;--glass-blur:12px;--panel-bg:rgba(255,255,255,0.05);--panel-border:rgba(255,255,255,0.1);--shadow-glow:0 0 40px rgba(255,107,107,0.3);`;

        const grid = document.createElement('div');
        grid.className = 'grid';
        albumDiv.appendChild(grid);
        albumDiv.appendChild(panel);
        albumsContainer.appendChild(albumDiv);
    });
    setupNavigation();
}

// Password
unlockBtn.addEventListener('click', () => {
    if (passwordInput.value === correctPassword) {
        unlocked = true;
        document.querySelector('header p').style.display = 'none';
        loadAllImages();
    } else {
        alert('Incorrect password!');
    }
});
passwordInput.addEventListener('keypress', e => e.key === 'Enter' && unlockBtn.click());

// Load Images
async function loadImagesForAlbum(name, path) {
    const grid = document.querySelector(`#album-${name} .grid`);
    const panel = document.querySelector(`#album-${name} .panel`);

    const oldSlider = panel.querySelector('.slider-container');
    if (oldSlider) oldSlider.remove();

    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    const sliderImages = document.createElement('div');
    sliderImages.className = 'slider-images';

    const thumbnails = document.createElement('div');
    thumbnails.className = 'slider-thumbnails';

    sliderContainer.append(sliderImages, thumbnails);
    panel.insertBefore(sliderContainer, grid);

    let photos = [];
    let currentIndex = 0;
    let autoSlideInterval = null;

    const startAutoSlide = (speed = 5000) => {
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(nextSlide, speed);
    };

    const stopAutoSlide = () => clearInterval(autoSlideInterval);

    try {
        const response = await fetch(`${path}/photos.json?t=${Date.now()}`);
        photos = await response.json();

        if (photos.length === 0) {
            sliderContainer.innerHTML = '<p style="color:#ff6b6b;text-align:center;padding:100px;">No photos found.</p>';
            return;
        }

        photos.forEach((src, index) => {
            const mainImg = document.createElement('img');
            mainImg.src = src;
            mainImg.loading = 'lazy';
            if (index === 0) mainImg.classList.add('active');
            mainImg.onclick = () => openLightbox(src);
            sliderImages.appendChild(mainImg);

            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.loading = 'lazy';
            if (index === 0) thumb.classList.add('active');
            thumb.onclick = () => {
                goToSlide(index);
                thumb.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                startAutoSlide(slideshowMode ? 3000 : 5000);
            };
            thumbnails.appendChild(thumb);

            const gridImg = document.createElement('img');
            gridImg.src = src;
            gridImg.loading = 'lazy';
            gridImg.onclick = () => openLightbox(src);
            grid.appendChild(gridImg);
        });

        const goToSlide = (index) => {
            sliderImages.querySelectorAll('img').forEach((img, i) => img.classList.toggle('active', i === index));
            thumbnails.querySelectorAll('img').forEach((img, i) => img.classList.toggle('active', i === index));
            currentIndex = index;
        };

        const nextSlide = () => goToSlide((currentIndex + 1) % photos.length);
        const prevSlide = () => goToSlide((currentIndex - 1 + photos.length) % photos.length);

        // Touch Swipe
        let touchStartX = 0;
        sliderContainer.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; stopAutoSlide(); }, { passive: true });
        sliderContainer.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
            startAutoSlide(slideshowMode ? 3000 : 5000);
        }, { passive: true });

        // Keyboard
        document.addEventListener('keydown', e => {
            if (!document.getElementById(`album-${name}`).classList.contains('active')) return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextSlide(); startAutoSlide(slideshowMode ? 3000 : 5000); }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prevSlide(); startAutoSlide(slideshowMode ? 3000 : 5000); }
        });

        // Click main image to next
        sliderContainer.addEventListener('click', e => {
            if (e.target.tagName === 'IMG' && e.target.parentElement === sliderImages) {
                nextSlide();
                startAutoSlide(slideshowMode ? 3000 : 5000);
            }
        });

        if (document.getElementById(`album-${name}`).classList.contains('active')) {
            startAutoSlide();
        }

        sliderContainer.dataset.startAuto = () => startAutoSlide(slideshowMode ? 3000 : 5000);
        sliderContainer.dataset.stopAuto = stopAutoSlide;

    } catch (err) {
        console.error(err);
        grid.innerHTML = `<p style="color:#ff6b6b;text-align:center;">Failed to load photos.</p>`;
    }
}

function loadAllImages() {
    if (!unlocked) return;
    Object.entries(albums).forEach(([name, path]) => loadImagesForAlbum(name, path));
}

// Navigation
function setupNavigation() {
    document.querySelectorAll('nav button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.album').forEach(a => a.classList.remove('active'));
            const activeAlbum = document.getElementById(`album-${btn.dataset.album}`);
            activeAlbum.classList.add('active');

            const slider = activeAlbum.querySelector('.slider-container');
            if (slider && slider.dataset.startAuto) slider.dataset.startAuto();
        });
    });

    const firstSlider = document.querySelector('#album-Engagement .slider-container');
    if (firstSlider && firstSlider.dataset.startAuto) firstSlider.dataset.startAuto();
}

// Lightbox
function openLightbox(src) {
    if (document.fullscreenElement) toggleFullscreen();
    lightboxImg.src = src;
    lightbox.classList.add('active');
    showSharePanel();

    downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = src;
        a.download = src.split('/').pop() || 'photo.jpg';
        a.click();
    };

    document.getElementById('shareWhatsapp').onclick = () => window.open(`https://wa.me/?text=Check this beautiful moment! 💍 ${encodeURIComponent(src)}`, '_blank');
    document.getElementById('shareFacebook').onclick = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(src)}`, '_blank');
    document.getElementById('shareInstagram').onclick = () => { navigator.clipboard.writeText(src); alert("Link copied! Best on mobile."); };
    document.getElementById('shareCopy').onclick = () => { navigator.clipboard.writeText(src); alert("Link copied!"); };
}

function showSharePanel() {
    sharePanel.classList.add('visible');
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => sharePanel.classList.remove('visible'), 4000);
}

// Fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (lightbox.requestFullscreen) lightbox.requestFullscreen();
        else if (lightbox.webkitRequestFullscreen) lightbox.webkitRequestFullscreen();
        else if (lightbox.mozRequestFullScreen) lightbox.mozRequestFullScreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}
fullscreenBtn.addEventListener('click', toggleFullscreen);

// Slideshow Mode
function toggleSlideshow() {
    const activeAlbum = document.querySelector('.album.active');
    if (!activeAlbum) return;
    const slider = activeAlbum.querySelector('.slider-container');

    slideshowMode = !slideshowMode;
    slideshowBtn.textContent = slideshowMode ? "⏸️" : "▶️";
    slideshowBtn.title = slideshowMode ? "Pause Slideshow" : "Start Slideshow";

    if (slideshowMode) {
        if (!document.fullscreenElement) toggleFullscreen();
        if (slider && slider.dataset.startAuto) slider.dataset.startAuto(); // 3s speed inside startAuto
    } else {
        if (slider && slider.dataset.startAuto) slider.dataset.startAuto(); // back to 5s
    }
}
slideshowBtn.addEventListener('click', toggleSlideshow);

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && slideshowMode) toggleSlideshow();
});

closeLightbox.addEventListener('click', () => lightbox.classList.remove('active'));
lightbox.addEventListener('click', e => e.target === lightbox && lightbox.classList.remove('active'));
lightbox.addEventListener('mousemove', showSharePanel);
lightbox.addEventListener('touchstart', showSharePanel, { passive: true });