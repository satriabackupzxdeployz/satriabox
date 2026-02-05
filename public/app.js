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
        
        if(!data || !Array.isArray(data)) {
            dom.dramaList.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
                    <i class="fas fa-search" style="font-size:4rem; color:var(--cyan); margin-bottom:20px;"></i>
                    <h3>Invalid response from server</h3>
                </div>
            `;
            showAlert('Server returned invalid data', 'error');
            return;
        }
        
        const filteredData = data.filter(item => {
            if(!item || typeof item !== 'object') return false;
            const title = item.title ? String(item.title).toLowerCase() : '';
            const queryLower = query.toLowerCase();
            return title.includes(queryLower);
        });
        
        if(filteredData.length === 0) {
            dom.dramaList.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
                    <i class="fas fa-search" style="font-size:4rem; color:var(--cyan); margin-bottom:20px;"></i>
                    <h3>No results found for "${query}"</h3>
                    <p style="margin-top:10px; color:var(--text-muted);">Try different keywords</p>
                </div>
            `;
            showAlert(`No results found for "${query}"`, 'error');
        } else {
            renderList(filteredData);
            showAlert(`Found ${filteredData.length} results for "${query}"`);
        }
    } catch (e) {
        console.error('Search error:', e);
        dom.loading.style.display = 'none';
        dom.dramaList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size:4rem; color:var(--warning); margin-bottom:20px;"></i>
                <h3>Search failed</h3>
                <p style="margin-top:10px; color:var(--text-muted);">${e.message}</p>
                <button class="nav-btn" onclick="loadHome()" style="margin-top:20px;">
                    <i class="fas fa-redo"></i> Return Home
                </button>
            </div>
        `;
        showAlert('Search failed. Please try again.', 'error');
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
        
        if(!data || !Array.isArray(data)) {
            throw new Error('Invalid data format from server');
        }
        
        renderList(data);
    } catch (e) {
        console.error('Load home error:', e);
        dom.loading.style.display = 'none';
        dom.dramaList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size:4rem; color:var(--warning); margin-bottom:20px;"></i>
                <h3>Failed to load content</h3>
                <p style="margin-top:10px; color:var(--text-muted);">${e.message}</p>
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
        if(!item || !item.title || !item.url) return;
        
        const card = document.createElement('div');
        card.className = 'drama-card';
        card.innerHTML = `
            <img src="${item.image || ''}" loading="lazy" alt="${item.title}" 
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
    if(!url || typeof url !== 'string') {
        showAlert('Invalid drama URL', 'error');
        return;
    }
    
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
        
        if(!data || !data.title) {
            throw new Error('Invalid drama data received');
        }
        
        dom.currentTitle.textContent = data.title;
        
        if(!data.episodes || !Array.isArray(data.episodes)) {
            throw new Error('No episodes found');
        }
        
        renderEpisodes(data.episodes);
        
        if (data.episodes.length > 0 && data.episodes[0].url) {
            playEpisode(data.episodes[0].url, data.episodes[0].episode_id || '1');
        } else {
            dom.epGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:40px; color:#666;">No episodes found.</p>';
            showAlert('No playable episodes found', 'error');
        }

    } catch (e) {
        console.error('Open player error:', e);
        dom.currentTitle.textContent = 'Error loading drama';
        dom.epGrid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px;">
                <i class="fas fa-exclamation-circle" style="font-size:3rem; color:var(--warning); margin-bottom:20px;"></i>
                <p>Failed to load drama details</p>
                <button class="nav-btn" onclick="closePlayer()" style="margin-top:20px;">
                    <i class="fas fa-arrow-left"></i> Go Back
                </button>
            </div>
        `;
        showAlert('Failed to load drama details', 'error');
    }
}

function renderEpisodes(episodes) {
    dom.epGrid.innerHTML = '';
    episodes.forEach(ep => {
        if(!ep || !ep.url) return;
        
        const btn = document.createElement('button');
        btn.className = 'ep-btn';
        btn.textContent = ep.episode_id || 'N/A';
        btn.onclick = () => {
            playEpisode(ep.url, ep.episode_id || 'N/A');
        };
        dom.epGrid.appendChild(btn);
    });
}

function playEpisode(videoUrl, epNum) {
    if(!videoUrl || typeof videoUrl !== 'string') {
        showAlert('Invalid video URL', 'error');
        return;
    }
    
    document.querySelectorAll('.ep-btn').forEach(b => {
        const btnNum = parseInt(b.textContent);
        const epNumInt = parseInt(epNum);
        b.classList.toggle('active', !isNaN(btnNum) && !isNaN(epNumInt) && btnNum === epNumInt);
    });

    const proxyUrl = `${API_BASE}?type=stream&url=${encodeURIComponent(videoUrl)}`;
    dom.video.src = proxyUrl;
    
    dom.video.load();
    
    dom.video.onerror = function() {
        console.error('Video playback error');
        showAlert('Failed to play video. The source might be unavailable.', 'error');
        
        dom.video.innerHTML = `
            <source src="${proxyUrl}" type="video/mp4">
            Your browser does not support the video tag.
        `;
        dom.video.load();
    };
    
    dom.video.oncanplay = function() {
        showAlert(`Playing Episode ${epNum}`);
    };
    
    const playPromise = dom.video.play();
    if (playPromise !== undefined) {
        playPromise.catch(e => {
            console.log("Autoplay blocked:", e);
        });
    }
}

function closePlayer() {
    dom.playerView.classList.remove('active');
    if(dom.video) {
        dom.video.pause();
        dom.video.src = '';
        dom.video.innerHTML = '';
    }
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
