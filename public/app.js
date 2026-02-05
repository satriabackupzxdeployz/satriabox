const API_BASE = '/api/index';

const dom = {
    homeView: document.getElementById('home-view'),
    playerView: document.getElementById('player-view'),
    dramaList: document.getElementById('drama-list'),
    loading: document.getElementById('loading'),
    video: document.getElementById('main-video'),
    epGrid: document.getElementById('ep-grid'),
    epDrawer: document.getElementById('ep-drawer'),
    currentTitle: document.getElementById('current-title'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    pageTitle: document.getElementById('page-title'),
    alert: document.getElementById('alert'),
    navHome: document.getElementById('nav-home')
};

window.addEventListener('DOMContentLoaded', loadHome);

function showAlert(message, type = 'success') {
    dom.alert.textContent = message;
    dom.alert.className = `alert ${type} show`;
    setTimeout(() => {
        dom.alert.classList.remove('show');
    }, 3000);
}

dom.searchBtn.onclick = () => {
    const query = dom.searchInput.value.trim();
    if (query) {
        doSearch(query);
    } else {
        showAlert('Please enter search keywords', 'error');
    }
};

dom.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = dom.searchInput.value.trim();
        if (query) {
            doSearch(query);
        } else {
            showAlert('Please enter search keywords', 'error');
        }
    }
});

async function doSearch(query) {
    if(!query) {
        showAlert('Please enter search keywords', 'error');
        return;
    }
    
    dom.loading.style.display = 'block';
    dom.dramaList.innerHTML = '';
    dom.pageTitle.style.display = 'block';
    dom.pageTitle.textContent = `Search Results: "${query}"`;
    dom.navHome.classList.remove('active');
    
    try {
        const res = await fetch(`${API_BASE}?type=search&query=${encodeURIComponent(query)}`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        dom.loading.style.display = 'none';
        
        if(data.length === 0) {
            dom.dramaList.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
                    <i class="fas fa-search" style="font-size:4rem; color:var(--cyan); margin-bottom:20px;"></i>
                    <h3>No results found for "${query}"</h3>
                    <p style="margin-top:10px; color:var(--text-muted);">Try different keywords</p>
                </div>
            `;
            showAlert(`No results found for "${query}"`, 'error');
        } else {
            renderList(data);
            showAlert(`Found ${data.length} results for "${query}"`);
        }
    } catch (e) {
        console.error('Search error:', e);
        dom.loading.style.display = 'none';
        showAlert('Search failed. Please try again.', 'error');
        setTimeout(loadHome, 2000);
    }
}

async function loadHome() {
    dom.searchInput.value = '';
    dom.pageTitle.style.display = 'block';
    dom.pageTitle.textContent = 'Recommended For You';
    dom.loading.style.display = 'block';
    dom.dramaList.innerHTML = '';
    dom.navHome.classList.add('active');

    try {
        const res = await fetch(`${API_BASE}?type=home`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        dom.loading.style.display = 'none';
        renderList(data);
    } catch (e) {
        console.error('Load home error:', e);
        dom.loading.style.display = 'none';
        dom.dramaList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size:4rem; color:var(--warning); margin-bottom:20px;"></i>
                <h3>Failed to load content</h3>
                <p style="margin-top:10px; color:var(--text-muted);">Please check your connection</p>
                <button class="nav-btn" onclick="loadHome()" style="margin-top:20px;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

function renderList(data) {
    dom.dramaList.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'drama-card';
        card.innerHTML = `
            <img src="${item.image}" loading="lazy" alt="${item.title}" 
                 onerror="this.src='https://via.placeholder.com/280x400/1a1a1a/ffffff?text=No+Image'">
            <div class="drama-info">
                <div class="drama-title">${item.title}</div>
            </div>
        `;
        card.onclick = () => openPlayer(item.url);
        dom.dramaList.appendChild(card);
    });
}

async function openPlayer(url) {
    dom.playerView.classList.add('active');
    dom.video.src = '';
    dom.epGrid.innerHTML = '<div class="loader" style="grid-column:1/-1; margin:40px auto;"></div>';
    dom.currentTitle.textContent = 'Fetching episodes...';
    dom.epDrawer.classList.remove('show');

    try {
        const res = await fetch(`${API_BASE}?type=detail&url=${encodeURIComponent(url)}`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        dom.currentTitle.textContent = data.title;
        renderEpisodes(data.episodes);
        
        if (data.episodes.length > 0) {
            playEpisode(data.episodes[0].url, data.episodes[0].episode_id);
        } else {
            dom.epGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:40px; color:#666;">No episodes found.</p>';
        }

    } catch (e) {
        console.error('Open player error:', e);
        dom.currentTitle.textContent = 'Error loading drama';
        showAlert('Failed to load drama details', 'error');
    }
}

function renderEpisodes(episodes) {
    dom.epGrid.innerHTML = '';
    episodes.forEach(ep => {
        const btn = document.createElement('button');
        btn.className = 'ep-btn';
        btn.textContent = ep.episode_id;
        btn.onclick = () => {
            playEpisode(ep.url, ep.episode_id);
        };
        dom.epGrid.appendChild(btn);
    });
}

function playEpisode(videoUrl, epNum) {
    document.querySelectorAll('.ep-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.textContent) === parseInt(epNum));
    });

    const proxyUrl = `${API_BASE}?type=stream&url=${encodeURIComponent(videoUrl)}`;
    dom.video.src = proxyUrl;
    
    dom.video.load();
    dom.video.play().catch(e => {
        console.log("Autoplay blocked, waiting for user interaction");
    });
    
    showAlert(`Playing Episode ${epNum}`);
}

function closePlayer() {
    dom.playerView.classList.remove('active');
    dom.video.pause();
    dom.video.src = '';
}

function toggleDrawer() {
    dom.epDrawer.classList.toggle('show');
    
    const toggleIcon = document.querySelector('.episodes-toggle i');
    if (dom.epDrawer.classList.contains('show')) {
        toggleIcon.className = 'fas fa-chevron-down';
    } else {
        toggleIcon.className = 'fas fa-chevron-up';
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && dom.playerView.classList.contains('active')) {
        closePlayer();
    }
});