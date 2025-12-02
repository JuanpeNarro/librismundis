// Google Books API Search Extension for LIBRISMUNDIS - CON SOPORTE DE PORTADAS

// ============================================
// Google Books API Search
// ============================================

async function searchBookOnline(query) {
    if (!query || query.trim() === '') return [];

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<div class="search-loading">🔍 Buscando...</div>';

    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&langRestrict=es,en`);
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            searchResults.innerHTML = '<div class="empty-state-text" style="text-align: center; padding: 2rem;">No se encontraron resultados</div>';
            return [];
        }

        return data.items;
    } catch (error) {
        console.error('Error searching books:', error);
        searchResults.innerHTML = '<div class="empty-state-text" style="text-align: center; padding: 2rem; color: var(--color-danger);">Error al buscar. Intenta de nuevo.</div>';
        return [];
    }
}

function renderSearchResults(results) {
    const searchResults = document.getElementById('searchResults');

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="empty-state-text" style="text-align: center; padding: 2rem;">No se encontraron resultados</div>';
        return;
    }

    searchResults.innerHTML = results.map((item, index) => {
        const volumeInfo = item.volumeInfo;
        const title = volumeInfo.title || 'Sin título';
        const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Autor desconocido';
        const publishedDate = volumeInfo.publishedDate ? volumeInfo.publishedDate.substring(0, 4) : '';
        const pageCount = volumeInfo.pageCount || 0;
        const thumbnail = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '';
        const language = volumeInfo.language || 'es';

        return `
            <div class="search-result-card" onclick="selectBookFromSearch(${index})">
                ${thumbnail ? `<img src="${thumbnail}" alt="${escapeHtml(title)}" class="search-result-thumbnail">` : '<div class="search-result-thumbnail"></div>'}
                <div class="search-result-info">
                    <div class="search-result-title">${escapeHtml(title)}</div>
                    <div class="search-result-author">${escapeHtml(authors)}</div>
                    <div class="search-result-meta">
                        ${publishedDate ? `📅 ${publishedDate}` : ''} 
                        ${pageCount > 0 ? `• 📖 ${pageCount} páginas` : ''}
                        ${language ? `• 🌐 ${getLanguageName(language)}` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

let currentSearchResults = [];

window.selectBookFromSearch = function (index) {
    const selectedBook = currentSearchResults[index];
    if (!selectedBook) return;

    const volumeInfo = selectedBook.volumeInfo;

    // Map language codes
    let languageCode = volumeInfo.language || 'es';
    const validLanguages = ['es', 'en', 'fr', 'de', 'it', 'pt'];
    if (!validLanguages.includes(languageCode)) {
        languageCode = 'other';
    }



    // Fill the form
    document.getElementById('bookTitle').value = volumeInfo.title || '';
    document.getElementById('bookAuthor').value = volumeInfo.authors ? volumeInfo.authors.join(', ') : '';
    document.getElementById('bookTotalPages').value = volumeInfo.pageCount || 0;
    document.getElementById('bookLanguage').value = languageCode;
    document.getElementById('bookComments').value = volumeInfo.description || '';

    // Store cover URL in hidden field
    const coverUrl = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '';
    let coverInput = document.getElementById('bookCoverUrl');
    if (!coverInput) {
        coverInput = document.createElement('input');
        coverInput.type = 'hidden';
        coverInput.id = 'bookCoverUrl';
        document.getElementById('addBookForm').appendChild(coverInput);
    }
    coverInput.value = coverUrl;

    // Close search modal
    closeSearchBookModal();
}

function openSearchBookModal() {
    const searchModal = document.getElementById('searchBookModal');
    if (searchModal) {
        searchModal.classList.add('active');
        document.getElementById('onlineSearchInput').value = '';
        document.getElementById('searchResults').innerHTML = '<div class="empty-state-text" style="text-align: center; padding: 2rem;">Escribe algo para buscar...</div>';
    }
}

function closeSearchBookModal() {
    const searchModal = document.getElementById('searchBookModal');
    if (searchModal) {
        searchModal.classList.remove('active');
    }
}

// Setup search event listeners
document.addEventListener('DOMContentLoaded', function () {
    const openSearchBtn = document.getElementById('openSearchBtn');
    const closeSearchModal = document.getElementById('closeSearchModal');
    const triggerSearchBtn = document.getElementById('triggerSearchBtn');
    const onlineSearchInput = document.getElementById('onlineSearchInput');
    const searchBookModal = document.getElementById('searchBookModal');

    if (openSearchBtn) {
        openSearchBtn.addEventListener('click', openSearchBookModal);
    }

    if (closeSearchModal) {
        closeSearchModal.addEventListener('click', closeSearchBookModal);
    }

    if (triggerSearchBtn && onlineSearchInput) {
        triggerSearchBtn.addEventListener('click', async () => {
            const query = onlineSearchInput.value.trim();
            if (query) {
                currentSearchResults = await searchBookOnline(query);
                renderSearchResults(currentSearchResults);
            }
        });

        onlineSearchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const query = onlineSearchInput.value.trim();
                if (query) {
                    currentSearchResults = await searchBookOnline(query);
                    renderSearchResults(currentSearchResults);
                }
            }
        });
    }

    if (searchBookModal) {
        searchBookModal.addEventListener('click', (e) => {
            if (e.target === searchBookModal) {
                closeSearchBookModal();
            }
        });
    }
});

// ============================================
// Background Cover Fetching for Goodreads Import
// ============================================

async function fetchGoodreadsCovers(importedBooks) {
    const notification = document.createElement('div');
    notification.className = 'toast-notification';
    notification.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">🔄</span>
            <span class="toast-message">Buscando portadas en segundo plano...</span>
        </div>
    `;
    document.body.appendChild(notification);

    // Add toast styles if not present
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                padding: 1rem;
                box-shadow: var(--shadow-lg);
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
            }
            .toast-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            @keyframes slideIn {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    let updatedCount = 0;

    for (const book of importedBooks) {
        // Skip if already has cover
        if (book.coverUrl) continue;

        try {
            let query = '';
            // Clean ISBN (remove non-numeric characters)
            const cleanIsbn = book.isbn ? book.isbn.replace(/[^0-9X]/gi, '') : '';

            if (cleanIsbn && cleanIsbn.length >= 10) {
                query = `isbn:${cleanIsbn}`;
            } else {
                query = `${book.title} ${book.author}`;
            }

            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const volumeInfo = data.items[0].volumeInfo;
                const coverUrl = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail;

                if (coverUrl) {
                    // Update book in global state
                    if (typeof books !== 'undefined') {
                        const globalBook = books.find(b => b.id === book.id);
                        if (globalBook) {
                            globalBook.coverUrl = coverUrl;
                            updatedCount++;
                        }
                    }
                }
            }

            // Respect API rate limits - small delay
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
            console.error(`Error fetching cover for ${book.title}:`, error);
        }
    }

    // Save changes to local storage
    if (typeof saveToLocalStorage === 'function') {
        saveToLocalStorage();
    }

    // Update notification
    notification.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">✅</span>
            <span class="toast-message">Portadas actualizadas (${updatedCount} nuevas)</span>
        </div>
    `;

    // Refresh view to show new covers
    if (typeof renderBooks === 'function') {
        renderBooks();
    }

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
