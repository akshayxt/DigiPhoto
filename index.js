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

// Build Albums and Nav
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

        albumDiv.appendChild(panel);
        albumDiv.appendChild(grid);
        albumsContainer.appendChild(albumDiv);
    });

    setupNavigation();
}

// Password Unlock
unlockBtn.addEventListener('click', () => {
    if (passwordInput.value === correctPassword) {
        unlocked = true;
        document.querySelector('header p').style.display = 'none';
        loadAllImages();  // This loads ALL albums at once
    } else {
        alert('Incorrect password!');
    }
});
passwordInput.addEventListener('keypress', e => e.key === 'Enter' && unlockBtn.click());

// Load Images - Auto-slider fixed
async function loadImagesForAlbum(name, path) {
    const panel = document.querySelector(`#album-${name} .panel`);
    const grid = document.querySelector(`#album-${name} .grid`);

    const oldSlider = panel.querySelector('.slider-container');
    if (oldSlider) oldSlider.remove();

    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    const sliderImages = document.createElement('div');
    sliderImages.className = 'slider-images';

    const thumbnails = document.createElement('div');
    thumbnails.className = 'slider-thumbnails';

    sliderContainer.appendChild(sliderImages);
    sliderContainer.appendChild(thumbnails);
    panel.prepend(sliderContainer);

    let photos = [];
    let currentIndex = 0;
    let autoSlideInterval = null;

    const getSlideSpeed = () => slideshowMode ? 3000 : 5000;

    const goToSlide = (index) => {
        sliderImages.querySelectorAll('img').forEach((img, i) => img.classList.toggle('active', i === index));
        thumbnails.querySelectorAll('img').forEach((img, i) => img.classList.toggle('active', i === index));
        currentIndex = index;
    };

    const startAutoSlide = () => {
        stopAutoSlide();
        if (photos.length <= 1) return;
        autoSlideInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % photos.length;
            goToSlide(currentIndex);
        }, getSlideSpeed());
    };

    const stopAutoSlide = () => {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    };

    // Safely expose functions
    sliderContainer.dataset.startAuto = startAutoSlide;
    sliderContainer.dataset.stopAuto = stopAutoSlide;

    try {
        const response = await fetch(`${path}/photos.json?t=${Date.now()}`);
        photos = await response.json();

        if (photos.length === 0) {
            sliderContainer.innerHTML = '<p style="color:#ff6b6b;text-align:center;padding:100px;font-size:1.5rem;">No photos found.</p>';
            return;
        }

        photos.forEach((src, index) => {
            // Main image
            const mainImg = document.createElement('img');
            mainImg.src = src;
            mainImg.loading = 'lazy';
            mainImg.alt = `Photo ${index + 1}`;
            if (index === 0) mainImg.classList.add('active');
            mainImg.onclick = () => openLightbox(src);
            sliderImages.appendChild(mainImg);

            // Thumbnail
            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.loading = 'lazy';
            thumb.alt = `Thumb ${index + 1}`;
            if (index === 0) thumb.classList.add('active');
            thumb.onclick = () => {
                currentIndex = index;
                goToSlide(index);
                thumb.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                startAutoSlide();
            };
            thumbnails.appendChild(thumb);

            // Grid image
            const gridImg = document.createElement('img');
            gridImg.src = src;
            gridImg.loading = 'lazy';
            gridImg.alt = `Photo ${index + 1}`;
            gridImg.onclick = () => openLightbox(src);
            grid.appendChild(gridImg);
        });

        // Interactions
        sliderContainer.addEventListener('mouseenter', stopAutoSlide);
        sliderContainer.addEventListener('mouseleave', startAutoSlide);

        let touchStartX = 0;
        sliderContainer.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoSlide();
        }, { passive: true });

        sliderContainer.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) currentIndex = (currentIndex + 1) % photos.length;
                else currentIndex = (currentIndex - 1 + photos.length) % photos.length;
                goToSlide(currentIndex);
            }
            startAutoSlide();
        }, { passive: true });

        document.addEventListener('keydown', e => {
            if (!document.getElementById(`album-${name}`).classList.contains('active')) return;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                stopAutoSlide();
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') currentIndex = (currentIndex + 1) % photos.length;
                else currentIndex = (currentIndex - 1 + photos.length) % photos.length;
                goToSlide(currentIndex);
                startAutoSlide();
            }
        });

        sliderContainer.addEventListener('click', e => {
            if (e.target.tagName === 'IMG' && e.target.parentElement === sliderImages) {
                stopAutoSlide();
                currentIndex = (currentIndex + 1) % photos.length;
                goToSlide(currentIndex);
                startAutoSlide();
            }
        });

        // Auto-start only if this album is currently active
        if (document.getElementById(`album-${name}`).classList.contains('active')) {
            startAutoSlide();
        }

    } catch (err) {
        console.error('Error loading album:', name, err);
        panel.innerHTML += '<p style="color:#ff6b6b;text-align:center;">Failed to load photos.</p>';
    }
}

function loadAllImages() {
    if (!unlocked) return;
    Object.entries(albums).forEach(([name, path]) => loadImagesForAlbum(name, path));
}

// FIXED Navigation - Safe calls to start/stop
function setupNavigation() {
    document.querySelectorAll('nav button').forEach(btn => {
        btn.addEventListener('click', () => {
            // Hide all albums and stop their sliders safely
            document.querySelectorAll('.album').forEach(album => {
                album.classList.remove('active');
                const slider = album.querySelector('.slider-container');
                if (slider && typeof slider.dataset.stopAuto === 'function') {
                    slider.dataset.stopAuto();
                }
            });

            // Remove active from all buttons
            document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show selected album
            const activeAlbum = document.getElementById(`album-${btn.dataset.album}`);
            activeAlbum.classList.add('active');

            // Start auto-slide safely
            const slider = activeAlbum.querySelector('.slider-container');
            if (slider && typeof slider.dataset.startAuto === 'function') {
                slider.dataset.startAuto();
            }
        });
    });
}

// Lightbox & Controls (unchanged - working perfectly)
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

    ['shareWhatsapp', 'shareFacebook', 'shareInstagram', 'shareCopy'].forEach(id => {
        document.getElementById(id).onclick = () => {
            if (id === 'shareWhatsapp') window.open(`https://wa.me/?text=Check this beautiful moment! 💍 ${encodeURIComponent(src)}`, '_blank');
            if (id === 'shareFacebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(src)}`, '_blank');
            if (id === 'shareInstagram' || id === 'shareCopy') {
                navigator.clipboard.writeText(src);
                alert("Link copied to clipboard!");
            }
        };
    });
}

function showSharePanel() {
    sharePanel.classList.add('visible');
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => sharePanel.classList.remove('visible'), 4000);
}

function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        (lightbox.requestFullscreen || lightbox.webkitRequestFullscreen || (() => {})).call(lightbox);
    } else {
        (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
    }
}
fullscreenBtn.addEventListener('click', toggleFullscreen);

function toggleSlideshow() {
    slideshowMode = !slideshowMode;
    slideshowBtn.textContent = slideshowMode ? "⏸️" : "▶️";
    slideshowBtn.title = slideshowMode ? "Pause Slideshow" : "Start Slideshow";

    const activeSlider = document.querySelector('.album.active .slider-container');
    if (activeSlider && typeof activeSlider.dataset.startAuto === 'function') {
        activeSlider.dataset.startAuto();
    }

    if (slideshowMode && !document.fullscreenElement) {
        toggleFullscreen();
    }
}
slideshowBtn.addEventListener('click', toggleSlideshow);

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && slideshowMode) {
        toggleSlideshow();
    }
});

closeLightbox.addEventListener('click', () => lightbox.classList.remove('active'));
lightbox.addEventListener('click', e => e.target === lightbox && lightbox.classList.remove('active'));
lightbox.addEventListener('mousemove', showSharePanel);
lightbox.addEventListener('touchstart', showSharePanel, { passive: true });