// ============================================
// LIBRISMUNDIS - Book Manager Application
// ============================================

// State Management
let books = [];
let vocabulary = [];
let currentFilter = 'all';
let currentLanguageFilter = 'all';
let currentVocabLanguageFilter = 'all';
let currentSort = 'date_desc';
let currentBookId = null;
let currentWordId = null;

// Gamification State
let userStats = {
    xp: 0,
    level: 1,
    streak: 0,
    lastVisit: null,
    booksRead: 0,
    wordsLearned: 0
};

const LEVEL_THRESHOLDS = {
    1: 0,
    2: 100,  // Novice Reader
    3: 300,  // Bookworm
    4: 600,  // Scholar
    5: 1000, // Master Librarian
    6: 2000  // Grand Archmage
};

let currentView = 'library'; // 'library' | 'vocabulary'

// Pagination State
let currentLibraryPage = 1;
let currentVocabPage = 1;
const booksPerPage = 12;
const wordsPerPage = 20;

// DOM Elements - Will be initialized in init()
let booksGrid;
let emptyState;
let searchInput;
let sortSelect;
let languageFilter;
let categoryTabs;
let vocabularyGrid;
let vocabEmptyState;
let vocabSearchInput;
let vocabLanguageFilter;
let addWordBtn;
let addWordModal;
let closeAddWordModal;
let cancelAddWord;
let addWordForm;
let wordDetailsModal;
let closeWordDetailsModal;
let editWordForm;
let deleteWordBtn;
let navTabs;
let libraryView;
let vocabularyView;
let chatView;
let addBookModal;
let bookDetailsModal;
let addBookBtn;
let closeAddModal;
let cancelAddBook;
let closeDetailsModal;
let addBookForm;
let themeToggle;
// ============================================
// Theme Management
// ============================================

function loadTheme() {
    const savedTheme = localStorage.getItem('librismundis_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function saveThemePreference(theme) {
    localStorage.setItem('librismundis_theme', theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    saveThemePreference(newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
}

// ============================================
// LocalStorage Management
// ============================================

function saveToLocalStorage() {
    try {
        // Determine storage key based on user login status
        const booksKey = currentUser ? `librismundis_user_${currentUser.id}_books` : 'librismundis_guest_books';
        const vocabKey = currentUser ? `librismundis_user_${currentUser.id}_vocabulary` : 'librismundis_guest_vocabulary';
        const statsKey = currentUser ? `librismundis_user_${currentUser.id}_stats` : 'librismundis_guest_stats';

        localStorage.setItem(booksKey, JSON.stringify(books));
        localStorage.setItem(vocabKey, JSON.stringify(vocabulary));
        localStorage.setItem(statsKey, JSON.stringify(userStats));

        console.log(`Data saved to localStorage for ${currentUser ? 'user ' + currentUser.email : 'guest'}`);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        // Determine storage key based on user login status
        const booksKey = currentUser ? `librismundis_user_${currentUser.id}_books` : 'librismundis_guest_books';
        const vocabKey = currentUser ? `librismundis_user_${currentUser.id}_vocabulary` : 'librismundis_guest_vocabulary';
        const statsKey = currentUser ? `librismundis_user_${currentUser.id}_stats` : 'librismundis_guest_stats';

        const storedBooks = localStorage.getItem(booksKey);
        if (storedBooks) {
            books = JSON.parse(storedBooks);
        } else {
            books = [];
        }

        const storedVocab = localStorage.getItem(vocabKey);
        if (storedVocab) {
            vocabulary = JSON.parse(storedVocab);
        } else {
            vocabulary = [];
        }

        const storedStats = localStorage.getItem(statsKey);
        if (storedStats) {
            userStats = JSON.parse(storedStats);
        } else {
            // Reset to default stats
            userStats = {
                xp: 0,
                level: 1,
                streak: 0,
                lastVisit: null,
                booksRead: 0,
                wordsLearned: 0
            };
        }

        checkStreak();

        console.log(`Data loaded for ${currentUser ? 'user ' + currentUser.email : 'guest'}`);
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        books = [];
        vocabulary = [];
    }
}

// ============================================
// Data Export/Import
// ============================================

function exportData() {
    const data = {
        books: books,
        vocabulary: vocabulary,
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `librismundis_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const content = e.target.result;
            const importedData = JSON.parse(content);

            // Handle both old format (array of books) and new format (object with books and vocabulary)
            let newBooks = [];
            let newVocab = [];

            if (Array.isArray(importedData)) {
                newBooks = importedData;
            } else if (importedData.books) {
                newBooks = importedData.books;
                newVocab = importedData.vocabulary || [];
            }

            if (confirm(`¿Estás seguro de que quieres importar los datos? Esto reemplazará tu colección actual.`)) {
                books = newBooks;
                vocabulary = newVocab;
                saveToLocalStorage();
                renderBooks();
                renderStatistics();
                renderVocabulary();
                alert('✅ Datos importados correctamente');
            }
        } catch (error) {
            console.error('Error importing data:', error);
            alert('❌ Error al leer el archivo JSON');
        }
        input.value = '';
    };
    reader.readAsText(file);
}

// ============================================
// Book Data Management
// ============================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createBook(title, author, totalPages, category, language = 'es', currentPage = 0, rating = 0, comments = '', coverUrl = '', isbn = '') {
    const book = {
        id: generateId(),
        title: title.trim(),
        author: author.trim(),
        totalPages: parseInt(totalPages),
        currentPage: parseInt(currentPage) || 0,
        category: category,
        language: language,
        rating: parseFloat(rating) || 0,
        comments: comments.trim(),
        coverUrl: coverUrl.trim(),
        isbn: isbn.trim(),
        dateAdded: Date.now()
    };

    book.percentage = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;

    return book;
}

function addBook(book) {
    books.unshift(book);
    updateXP(10, 'Libro agregado'); // +10 XP for adding a book
    if (book.category === 'completed') {
        updateXP(50, 'Libro terminado'); // +50 XP if added as completed
        userStats.booksRead++;
    }
    saveToLocalStorage();
    renderBooks();
    renderStatistics();
    renderUserStats();
}

function updateBook(id, updates) {
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
        books[index] = { ...books[index], ...updates };

        if (updates.currentPage !== undefined || updates.totalPages !== undefined) {
            const book = books[index];
            book.percentage = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
        }

        // Check if book was just completed
        if (updates.category === 'completed' && books[index].category !== 'completed') {
            updateXP(50, 'Libro terminado');
            userStats.booksRead++;
        }

        saveToLocalStorage();
        renderBooks();
        renderStatistics();
    }
}

function deleteBook(id) {
    books = books.filter(b => b.id !== id);
    saveToLocalStorage();
    renderBooks();
    renderStatistics();
}

function getBook(id) {
    return books.find(b => b.id === id);
}

// ============================================
// Vocabulary Management
// ============================================

function createWord(word, language, definition, context) {
    return {
        id: generateId(),
        word: word.trim(),
        language: language,
        definition: definition.trim(),
        context: context.trim(),
        dateAdded: Date.now()
    };
}

function addWord(wordObj) {
    vocabulary.push(wordObj);
    updateXP(5, 'Palabra agregada'); // +5 XP for adding a word
    userStats.wordsLearned++;
    saveToLocalStorage();
    renderVocabulary();
    renderUserStats();
}

function updateWord(id, updates) {
    const index = vocabulary.findIndex(w => w.id === id);
    if (index !== -1) {
        vocabulary[index] = { ...vocabulary[index], ...updates };
        saveToLocalStorage();
        renderVocabulary();
    }
}

function deleteWord(id) {
    vocabulary = vocabulary.filter(w => w.id !== id);
    saveToLocalStorage();
    renderVocabulary();
}

function getWord(id) {
    return vocabulary.find(w => w.id === id);
}

function getFilteredVocabulary(searchQuery = '') {
    let filtered = vocabulary;

    // Filter by language
    if (currentVocabLanguageFilter !== 'all') {
        filtered = filtered.filter(word => word.language === currentVocabLanguageFilter);
    }

    // Filter by search query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(word =>
            word.word.toLowerCase().includes(query) ||
            word.definition.toLowerCase().includes(query) ||
            word.context.toLowerCase().includes(query)
        );
    }

    // Sort by most recent
    return filtered.sort((a, b) => b.dateAdded - a.dateAdded);
}

function renderVocabulary(searchQuery = '') {
    const filteredWords = getFilteredVocabulary(searchQuery);

    // Pagination Logic
    const totalWords = filteredWords.length;
    const startIndex = (currentVocabPage - 1) * wordsPerPage;
    const endIndex = startIndex + wordsPerPage;
    const wordsToShow = filteredWords.slice(startIndex, endIndex);

    renderPaginationControls(totalWords, wordsPerPage, currentVocabPage, 'changeVocabPage', 'vocabPagination');

    if (filteredWords.length === 0) {
        vocabularyGrid.classList.add('hidden');
        vocabEmptyState.classList.remove('hidden');
        const paginationContainer = document.getElementById('vocabPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
    } else {
        vocabularyGrid.classList.remove('hidden');
        vocabEmptyState.classList.add('hidden');

        vocabularyGrid.innerHTML = wordsToShow.map(word => `
            <div class="word-card" onclick="openWordDetails('${word.id}')" style="cursor: pointer;">
                <div class="word-header">
                    <div>
                        <h3 class="word-term">${escapeHtml(word.word)}</h3>
                        <span class="book-language-badge">${getLanguageFlag(word.language)} ${getLanguageName(word.language)}</span>
                    </div>
                </div>
                
                <p class="word-definition">${escapeHtml(word.definition)}</p>
                
                <div class="word-context-box">
                    <p class="word-context">"${escapeHtml(word.context)}"</p>
                </div>
            </div>
        `).join('');
    }
}

// ============================================
// Gamification Logic
// ============================================

function updateXP(amount, reason) {
    userStats.xp += amount;

    // Check for level up
    const nextLevel = userStats.level + 1;
    const threshold = LEVEL_THRESHOLDS[nextLevel] || Infinity;

    if (userStats.xp >= threshold) {
        userStats.level++;
        showNotification(`¡Nivel Subido! Ahora eres Nivel ${userStats.level}`, 'level-up');
    } else {
        showNotification(`+${amount} XP: ${reason}`, 'xp-gain');
    }

    saveToLocalStorage();
    renderUserStats();
}

function checkStreak() {
    const today = new Date().toDateString();

    if (userStats.lastVisit !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (userStats.lastVisit === yesterday.toDateString()) {
            userStats.streak++;
        } else {
            userStats.streak = 1; // Reset or start new streak
        }

        userStats.lastVisit = today;
        updateXP(10, 'Visita diaria');
        saveToLocalStorage();
    }
}

function getLevelTitle(level) {
    if (level >= 6) return 'Gran Archimago';
    if (level >= 5) return 'Maestro Bibliotecario';
    if (level >= 4) return 'Erudito';
    if (level >= 3) return 'Ratón de Biblioteca';
    if (level >= 2) return 'Lector Novato';
    return 'Iniciado';
}

function renderUserStats() {
    const userStatsContainer = document.getElementById('userStats');
    if (!userStatsContainer) return;

    const nextLevel = userStats.level + 1;
    const currentThreshold = LEVEL_THRESHOLDS[userStats.level] || 0;
    const nextThreshold = LEVEL_THRESHOLDS[nextLevel] || (currentThreshold + 1000);

    const progress = Math.min(100, Math.max(0, ((userStats.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100));

    // Calculate completed books
    const stats = calculateStatistics();
    const booksRead = stats.completed || 0;

    userStatsContainer.innerHTML = `
        <div class="gamification-compact">
            <div class="xp-line">
                <div class="xp-progress-bar-compact" title="${userStats.xp} / ${nextThreshold} XP">
                    <div class="xp-progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="xp-text-compact">${userStats.xp} XP</span>
            </div>
            <div class="level-line">
                <span class="level-text-compact">Nivel ${userStats.level}</span>
                <span class="books-read-compact">(${booksRead} libros leídos)</span>
                ${userStats.streak > 0 ? `<span class="streak-compact" title="Racha de ${userStats.streak} días">🔥 ${userStats.streak}</span>` : ''}
            </div>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // Trigger animation
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ============================================
// Statistics
// ============================================

function calculateStatistics() {
    const stats = {
        total: books.length,
        want_to_read: 0,
        reading: 0,
        completed: 0,
        abandoned: 0
    };

    books.forEach(book => {
        if (stats.hasOwnProperty(book.category)) {
            stats[book.category]++;
        }
    });

    return stats;
}

function renderStatistics() {
    const stats = calculateStatistics();

    const animateValue = (id, start, end, duration) => {
        const obj = document.getElementById(id);
        if (!obj) return;

        if (start === end) {
            obj.textContent = end;
            return;
        }

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    const currentTotal = parseInt(document.getElementById('statTotal').textContent) || 0;
    const currentWant = parseInt(document.getElementById('statWantToRead').textContent) || 0;
    const currentReading = parseInt(document.getElementById('statReading').textContent) || 0;
    const currentCompleted = parseInt(document.getElementById('statCompleted').textContent) || 0;
    const currentAbandoned = parseInt(document.getElementById('statAbandoned').textContent) || 0;

    animateValue('statTotal', currentTotal, stats.total, 500);
    animateValue('statWantToRead', currentWant, stats.want_to_read, 500);
    animateValue('statReading', currentReading, stats.reading, 500);
    animateValue('statCompleted', currentCompleted, stats.completed, 500);
    animateValue('statAbandoned', currentAbandoned, stats.abandoned, 500);
}

// ============================================
// Filtering and Sorting
// ============================================

function filterBooks(category) {
    currentFilter = category;
    currentLibraryPage = 1; // Reset page
    renderBooks();
}

function filterByLanguage(language) {
    currentLanguageFilter = language;
    currentLibraryPage = 1; // Reset page
    renderBooks();
}

function sortBooks(sortType) {
    currentSort = sortType;
    currentLibraryPage = 1; // Reset page
    renderBooks();
}

function searchBooks(query) {
    currentLibraryPage = 1; // Reset page
    renderBooks(query);
}

function getFilteredAndSortedBooks(searchQuery = '') {
    let filtered = books;

    // Filter by category
    if (currentFilter !== 'all') {
        filtered = filtered.filter(book => book.category === currentFilter);
    }

    // Filter by language
    if (currentLanguageFilter !== 'all') {
        filtered = filtered.filter(book => (book.language || 'es') === currentLanguageFilter);
    }

    // Filter by search query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(book =>
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            book.comments.toLowerCase().includes(query)
        );
    }

    const sorted = [...filtered].sort((a, b) => {
        switch (currentSort) {
            case 'date_desc':
                return b.dateAdded - a.dateAdded;
            case 'date_asc':
                return a.dateAdded - b.dateAdded;
            case 'title_asc':
                return a.title.localeCompare(b.title);
            case 'title_desc':
                return b.title.localeCompare(a.title);
            case 'author_asc':
                return a.author.localeCompare(b.author);
            case 'author_desc':
                return b.author.localeCompare(a.author);
            case 'rating_desc':
                return b.rating - a.rating;
            case 'rating_asc':
                return a.rating - b.rating;
            default:
                return 0;
        }
    });

    return sorted;
}

// ============================================
// Rendering
// ============================================

function getLanguageFlag(code) {
    const flags = {
        'es': '🇪🇸',
        'en': '🇬🇧',
        'fr': '🇫🇷',
        'de': '🇩🇪',
        'it': '🇮🇹',
        'pt': '🇵🇹',
        'other': '🌐'
    };
    return flags[code] || '🌐';
}

function getLanguageName(code) {
    const names = {
        'es': 'Español',
        'en': 'Inglés',
        'fr': 'Francés',
        'de': 'Alemán',
        'it': 'Italiano',
        'pt': 'Portugués',
        'other': 'Otro'
    };
    return names[code] || 'Otro';
}

function renderPaginationControls(totalItems, itemsPerPage, currentPage, onPageChange, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${onPageChange}(${currentPage - 1})">
            ◀ Anterior
        </button>
        <span class="pagination-info">
            Página ${currentPage} de ${totalPages}
        </span>
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${onPageChange}(${currentPage + 1})">
            Siguiente ▶
        </button>
    `;
}

function renderBooks(searchQuery = '') {
    if (!booksGrid || !emptyState) return;

    const filteredBooks = getFilteredAndSortedBooks(searchQuery);

    // Pagination Logic
    const totalBooks = filteredBooks.length;
    const startIndex = (currentLibraryPage - 1) * booksPerPage;
    const endIndex = startIndex + booksPerPage;
    const booksToShow = filteredBooks.slice(startIndex, endIndex);

    renderPaginationControls(totalBooks, booksPerPage, currentLibraryPage, 'changeLibraryPage', 'booksPagination');

    if (filteredBooks.length === 0) {
        booksGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        const paginationContainer = document.getElementById('booksPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
    } else {
        booksGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');

        booksGrid.innerHTML = booksToShow.map(book => `
            <div class="book-card" onclick="openBookDetails('${book.id}')">
                ${book.coverUrl ? `
                    <div class="book-cover-container">
                        <img src="${book.coverUrl}" alt="${escapeHtml(book.title)}" class="book-cover-image" onerror="this.parentElement.style.display='none'">
                    </div>
                ` : ''}
                <div class="book-header">
                    <h3 class="book-title">${escapeHtml(book.title)}</h3>
                    <p class="book-author">por ${escapeHtml(book.author)}</p>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <span class="book-category-badge">${getCategoryLabel(book.category)}</span>
                        <span class="book-language-badge">${getLanguageFlag(book.language || 'es')} ${getLanguageName(book.language || 'es')}</span>
                    </div>
                </div>
                
                <div class="book-progress">
                    <div class="progress-info">
                        <span class="progress-label">${book.currentPage} / ${book.totalPages} páginas</span>
                        <span class="progress-percentage">${book.percentage}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${book.percentage}%"></div>
                    </div>
                </div>
                
                ${book.rating > 0 ? `
                    <div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
                        Puntuación: <strong style="color: var(--text-primary);">${book.rating}</strong>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
}

function getCategoryLabel(category) {
    const labels = {
        'want_to_read': '🎯 Quiero leer',
        'reading': '📖 Leyendo',
        'completed': '✅ Terminado',
        'abandoned': '❌ No terminado'
    };
    return labels[category] || category;
}



function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Modal Management
// ============================================

function openAddBookModal() {
    addBookModal.classList.add('active');
    addBookForm.reset();
}

function closeAddBookModal() {
    addBookModal.classList.remove('active');
}

function openBookDetails(bookId) {
    const book = getBook(bookId);
    if (!book) return;

    currentBookId = bookId;

    document.getElementById('detailTitle').value = book.title;
    document.getElementById('detailAuthor').value = book.author;
    document.getElementById('detailCategory').textContent = getCategoryLabel(book.category);

    // Language display
    const langCode = book.language || 'es';
    document.getElementById('detailLanguage').textContent = `${getLanguageFlag(langCode)} ${getLanguageName(langCode)} `;

    document.getElementById('detailTotalPages').textContent = book.totalPages;
    document.getElementById('detailProgressPercentage').textContent = `${book.percentage}% `;
    document.getElementById('detailProgressBar').style.width = `${book.percentage}% `;
    document.getElementById('detailCurrentPage').value = book.currentPage;
    document.getElementById('detailPercentage').value = book.percentage;
    document.getElementById('detailComments').value = book.comments;
    document.getElementById('detailCategorySelect').value = book.category;
    document.getElementById('detailLanguageSelect').value = langCode;

    document.getElementById('detailRating').value = book.rating || '';

    bookDetailsModal.classList.add('active');
}

function closeBookDetailsModal() {
    bookDetailsModal.classList.remove('active');
    currentBookId = null;
}

function openAddWordModal() {
    addWordModal.classList.add('active');
    addWordForm.reset();
}

function closeAddWordModalFunc() {
    addWordModal.classList.remove('active');
}

function openWordDetails(wordId) {
    const word = getWord(wordId);
    if (!word) return;

    currentWordId = wordId;

    document.getElementById('detailWordText').value = word.word;
    document.getElementById('detailWordLanguage').value = word.language;
    document.getElementById('detailWordDefinition').value = word.definition;
    document.getElementById('detailWordContext').value = word.context;

    wordDetailsModal.classList.add('active');
}

function closeWordDetailsModalFunc() {
    wordDetailsModal.classList.remove('active');
    currentWordId = null;
}
// ============================================
// Goodreads CSV Import
// ============================================

function parseGoodreadsCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) {
        alert('El archivo CSV está vacío o no tiene el formato correcto.');
        return [];
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    // Find column indices
    const titleIdx = header.findIndex(h => h.toLowerCase() === 'title');
    const authorIdx = header.findIndex(h => h.toLowerCase() === 'author');
    const pagesIdx = header.findIndex(h => h.toLowerCase() === 'number of pages');
    const ratingIdx = header.findIndex(h => h.toLowerCase() === 'my rating');
    const shelfIdx = header.findIndex(h => h.toLowerCase() === 'exclusive shelf');
    const isbnIdx = header.findIndex(h => h.toLowerCase() === 'isbn');
    const isbn13Idx = header.findIndex(h => h.toLowerCase() === 'isbn13');

    if (titleIdx === -1 || authorIdx === -1) {
        alert('El archivo CSV no tiene las columnas requeridas (Title, Author).');
        return [];
    }

    const books = [];

    // Parse each line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parsing (handles quotes)
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const title = values[titleIdx] || '';
        const author = values[authorIdx] || '';

        if (!title || !author) continue;

        // Map Goodreads shelf to our category
        const shelf = (values[shelfIdx] || '').toLowerCase();
        let category = 'want_to_read';
        if (shelf === 'read') {
            category = 'completed';
        } else if (shelf === 'currently-reading') {
            category = 'reading';
        }

        const pages = parseInt(values[pagesIdx]) || 0;
        const rating = parseInt(values[ratingIdx]) || 0;

        // Get ISBN (prefer ISBN13, fallback to ISBN)
        let isbn = '';
        if (isbn13Idx !== -1 && values[isbn13Idx]) {
            isbn = values[isbn13Idx].replace(/^="|"$/g, ''); // Remove =" prefix often found in CSVs
        } else if (isbnIdx !== -1 && values[isbnIdx]) {
            isbn = values[isbnIdx].replace(/^="|"$/g, '');
        }

        // Convert Goodreads 5-star rating to our 10-point scale
        const convertedRating = rating > 0 ? rating * 2 : 0;

        books.push({
            title: title.replace(/^"|"$/g, ''),
            author: author.replace(/^"|"$/g, ''),
            totalPages: pages,
            category: category,
            rating: convertedRating,
            language: 'en', // Default to English for Goodreads imports
            currentPage: category === 'completed' ? pages : 0,
            isbn: isbn.replace(/^"|"$/g, '')
        });
    }

    return books;
}

function importFromGoodreads(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        const csvText = e.target.result;
        const parsedBooks = parseGoodreadsCSV(csvText);

        if (parsedBooks.length === 0) {
            alert('No se pudieron importar libros del archivo CSV.');
            return;
        }

        // Add all books
        let addedCount = 0;
        const newBooks = [];

        parsedBooks.forEach(bookData => {
            const book = createBook(
                bookData.title,
                bookData.author,
                bookData.totalPages,
                bookData.category,
                bookData.language,
                bookData.currentPage,
                bookData.rating,
                '',
                '',
                bookData.isbn
            );
            addBook(book);
            newBooks.push(book);
            addedCount++;
        });

        alert(`Se importaron ${addedCount} libros de Goodreads exitosamente. Las portadas se buscarán en segundo plano.`);

        // Trigger background cover fetch
        if (typeof fetchGoodreadsCovers === 'function') {
            fetchGoodreadsCovers(newBooks);
        }
    };

    reader.onerror = function () {
        alert('Error al leer el archivo CSV.');
    };

    reader.readAsText(file);
}


// ============================================
// Authentication System
// ============================================

let currentUser = null;

function loadCurrentUser() {
    const stored = localStorage.getItem('librismundis_currentUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        updateAuthUI();
    }
}

function saveCurrentUser() {
    if (currentUser) {
        localStorage.setItem('librismundis_currentUser', JSON.stringify(currentUser));
    } else {
        localStorage.removeItem('librismundis_currentUser');
    }
}

function migrateGuestData(userId) {
    // Check for guest data
    const guestBooks = localStorage.getItem('librismundis_guest_books');
    const guestVocab = localStorage.getItem('librismundis_guest_vocabulary');
    const guestStats = localStorage.getItem('librismundis_guest_stats');

    // If guest has books, copy them to user account
    if (guestBooks && guestBooks !== '[]') {
        localStorage.setItem(`librismundis_user_${userId}_books`, guestBooks);
        console.log('Migrated books from guest to user');
    }

    // If guest has vocabulary, copy to user account
    if (guestVocab && guestVocab !== '[]') {
        localStorage.setItem(`librismundis_user_${userId}_vocabulary`, guestVocab);
        console.log('Migrated vocabulary from guest to user');
    }

    // Initialize stats if needed, or migrate (optional, maybe better to start fresh? No, user wants to keep account)
    // Let's migrate stats too if they exist
    if (guestStats) {
        localStorage.setItem(`librismundis_user_${userId}_stats`, guestStats);
    }

    // Optional: Clear guest data to avoid confusion? 
    // For now, let's keep it harmlessly in background or clear it. 
    // Clearing it makes "Logout" return to a clean state.
    localStorage.removeItem('librismundis_guest_books');
    localStorage.removeItem('librismundis_guest_vocabulary');
    localStorage.removeItem('librismundis_guest_stats');
}

function registerUser(name, email, password) {
    // Get existing users
    const users = JSON.parse(localStorage.getItem('librismundis_users') || '[]');

    // Check if email already exists
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Este correo ya está registrado' };
    }

    // Create new user
    const newUser = {
        id: generateId(),
        name: name,
        email: email,
        password: password, // In production, this should be hashed!
        createdAt: Date.now()
    };

    users.push(newUser);
    localStorage.setItem('librismundis_users', JSON.stringify(users));

    return { success: true, user: newUser };
}

function loginUser(email, password) {
    const users = JSON.parse(localStorage.getItem('librismundis_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = { id: user.id, name: user.name, email: user.email };
        saveCurrentUser();

        // Load user-specific data
        loadFromLocalStorage();
        renderBooks();
        renderStatistics();
        renderVocabulary();
        renderUserStats();

        return { success: true, user: currentUser };
    }

    return { success: false, message: 'Correo o contraseña incorrectos' };
}

function logoutUser() {
    // Save current user data before logout
    saveToLocalStorage();

    // Clear current user
    currentUser = null;
    saveCurrentUser();

    // Load guest data (if any)
    loadFromLocalStorage();
    renderBooks();
    renderStatistics();
    renderVocabulary();
    renderUserStats();
    updateAuthUI();
}

function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    if (!authBtn) return;

    if (currentUser) {
        // Show user profile
        authBtn.innerHTML = `
            <div class="user-profile" style="display: flex; align-items: center; gap: 1rem;">
                <span class="user-name" style="font-weight: 600;">${currentUser.name}</span>
                <span class="logout-icon" onclick="event.stopPropagation(); logoutUser()" title="Cerrar sesión" style="cursor: pointer; font-size: 1.2rem;">🚪</span>
            </div>
        `;
        authBtn.classList.remove('btn-primary');
        authBtn.classList.add('btn-secondary');
    } else {
        // Show login button
        authBtn.innerHTML = '<span>👤 Iniciar Sesión</span>';
        authBtn.classList.remove('btn-secondary');
        authBtn.classList.add('btn-primary');
    }
}

function openAuthModal() {
    if (currentUser) return; // Already logged in
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.add('active');
        showLoginForm();
    }
}

function closeAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.remove('active');
    }
}

function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('authModalTitle').textContent = 'Iniciar Sesión';
}

function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('authModalTitle').textContent = 'Crear Cuenta';
}

// ============================================
// Initialization
// ============================================

function init() {
    // Initialize DOM Elements
    booksGrid = document.getElementById('booksGrid');
    emptyState = document.getElementById('emptyState');
    searchInput = document.getElementById('searchInput');
    sortSelect = document.getElementById('sortSelect');
    languageFilter = document.getElementById('languageFilter');
    categoryTabs = document.querySelectorAll('.category-tab');
    vocabularyGrid = document.getElementById('vocabularyGrid');
    vocabEmptyState = document.getElementById('vocabEmptyState');
    vocabSearchInput = document.getElementById('vocabSearchInput');
    vocabLanguageFilter = document.getElementById('vocabLanguageFilter');
    addWordBtn = document.getElementById('addWordBtn');
    addWordModal = document.getElementById('addWordModal');
    closeAddWordModal = document.getElementById('closeAddWordModal');
    cancelAddWord = document.getElementById('cancelAddWord');
    addWordForm = document.getElementById('addWordForm');
    wordDetailsModal = document.getElementById('wordDetailsModal');
    closeWordDetailsModal = document.getElementById('closeWordDetailsModal');
    editWordForm = document.getElementById('editWordForm');
    deleteWordBtn = document.getElementById('deleteWordBtn');
    navTabs = document.querySelectorAll('.nav-tab');
    libraryView = document.getElementById('libraryView');
    vocabularyView = document.getElementById('vocabularyView');
    chatView = document.getElementById('chatView');
    addBookModal = document.getElementById('addBookModal');
    bookDetailsModal = document.getElementById('bookDetailsModal');
    addBookBtn = document.getElementById('addBookBtn');
    closeAddModal = document.getElementById('closeAddModal');
    cancelAddBook = document.getElementById('cancelAddBook');
    closeDetailsModal = document.getElementById('closeDetailsModal');
    addBookForm = document.getElementById('addBookForm');
    themeToggle = document.getElementById('themeToggle');

    // Load Data
    // Auth System
    loadCurrentUser(); // Must be loaded FIRST to determine if we load user or guest data
    loadFromLocalStorage(); // Now it will load the correct data
    loadTheme();

    const authBtn = document.getElementById('authBtn');
    const authModal = document.getElementById('authModal');
    const closeAuthModal_btn = document.getElementById('closeAuthModal');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const loginFormElement = document.getElementById('loginFormElement');
    const registerFormElement = document.getElementById('registerFormElement');

    if (authBtn) {
        authBtn.addEventListener('click', openAuthModal);
    }

    if (closeAuthModal_btn) {
        closeAuthModal_btn.addEventListener('click', closeAuthModal);
    }

    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModal();
        });
    }

    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', showRegisterForm);
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', showLoginForm);
    }

    if (loginFormElement) {
        loginFormElement.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const result = loginUser(email, password);
            if (result.success) {
                closeAuthModal();
                updateAuthUI();
                showNotification(`¡Bienvenido de vuelta, ${result.user.name}!`, 'info');
                // Clear form
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
            } else {
                alert(result.message);
            }
        });
    }

    if (registerFormElement) {
        registerFormElement.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

            if (password !== passwordConfirm) {
                alert('Las contraseñas no coinciden');
                return;
            }

            const result = registerUser(name, email, password);
            if (result.success) {
                // Auto-login after registration
                currentUser = { id: result.user.id, name: result.user.name, email: result.user.email };
                saveCurrentUser();

                // Migrate guest data to new user
                migrateGuestData(result.user.id);

                // Load user data (will now include migrated guest data)
                loadFromLocalStorage();
                renderBooks();
                renderStatistics();
                renderVocabulary();
                renderUserStats();

                closeAuthModal();
                updateAuthUI();
                showNotification(`¡Bienvenido, ${name}!`, 'level-up');

                // Clear form
                document.getElementById('registerName').value = '';
                document.getElementById('registerEmail').value = '';
                document.getElementById('registerPassword').value = '';
                document.getElementById('registerPasswordConfirm').value = '';
            } else {
                alert(result.message);
            }
        });
    }



    // Event Listeners - Navigation
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentView = tab.dataset.view;

            if (currentView === 'library') {
                libraryView.classList.remove('hidden');
                vocabularyView.classList.add('hidden');
                if (chatView) chatView.classList.add('hidden');
                renderBooks();
            } else if (currentView === 'vocabulary') {
                libraryView.classList.add('hidden');
                vocabularyView.classList.remove('hidden');
                if (chatView) chatView.classList.add('hidden');
                renderVocabulary();
            } else if (currentView === 'chat') {
                libraryView.classList.add('hidden');
                vocabularyView.classList.add('hidden');
                if (chatView) chatView.classList.remove('hidden');
            }
        });
    });

    // Event Listeners - Library
    if (categoryTabs) {
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                filterBooks(tab.dataset.category);
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchBooks(e.target.value);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortBooks(e.target.value);
        });
    }

    if (languageFilter) {
        languageFilter.addEventListener('change', (e) => {
            filterByLanguage(e.target.value);
        });
    }

    // Event Listeners - Vocabulary
    if (vocabSearchInput) {
        vocabSearchInput.addEventListener('input', (e) => {
            renderVocabulary(e.target.value);
        });
    }

    if (vocabLanguageFilter) {
        vocabLanguageFilter.addEventListener('change', (e) => {
            currentVocabLanguageFilter = e.target.value;
            currentVocabPage = 1; // Reset page
            renderVocabulary(vocabSearchInput.value);
        });
    }

    // Event Listeners - Modals
    if (addBookBtn) addBookBtn.addEventListener('click', openAddBookModal);
    if (closeAddModal) closeAddModal.addEventListener('click', closeAddBookModal);
    if (cancelAddBook) cancelAddBook.addEventListener('click', closeAddBookModal);
    if (closeDetailsModal) closeDetailsModal.addEventListener('click', closeBookDetailsModal);

    if (addWordBtn) addWordBtn.addEventListener('click', openAddWordModal);
    if (closeAddWordModal) closeAddWordModal.addEventListener('click', closeAddWordModalFunc);
    if (cancelAddWord) cancelAddWord.addEventListener('click', closeAddWordModalFunc);
    if (closeWordDetailsModal) closeWordDetailsModal.addEventListener('click', closeWordDetailsModalFunc);

    if (addBookModal) {
        addBookModal.addEventListener('click', (e) => {
            if (e.target === addBookModal) closeAddBookModal();
        });
    }

    if (bookDetailsModal) {
        bookDetailsModal.addEventListener('click', (e) => {
            if (e.target === bookDetailsModal) closeBookDetailsModal();
        });
    }

    if (addWordModal) {
        addWordModal.addEventListener('click', (e) => {
            if (e.target === addWordModal) closeAddWordModalFunc();
        });
    }

    if (wordDetailsModal) {
        wordDetailsModal.addEventListener('click', (e) => {
            if (e.target === wordDetailsModal) closeWordDetailsModalFunc();
        });
    }

    // Forms
    if (addBookForm) {
        addBookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('bookTitle').value;
            const author = document.getElementById('bookAuthor').value;
            const pages = document.getElementById('bookTotalPages').value;
            const category = document.getElementById('bookCategory').value;
            const language = document.getElementById('bookLanguage').value;
            const comments = document.getElementById('bookComments').value;

            const currentPage = document.getElementById('bookCurrentPage').value;
            const rating = document.getElementById('bookRating').value;

            // Get cover URL from hidden field if it exists
            const coverInput = document.getElementById('bookCoverUrl');
            const coverUrl = coverInput ? coverInput.value : '';

            const book = createBook(title, author, pages, category, language, currentPage, rating, comments, coverUrl);
            addBook(book);
            closeAddBookModal();

            // Clear hidden field
            if (coverInput) coverInput.value = '';
        });
    }

    if (addWordForm) {
        addWordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const word = document.getElementById('wordText').value;
            const language = document.getElementById('wordLanguage').value;
            const definition = document.getElementById('wordDefinition').value;
            const context = document.getElementById('wordContext').value;

            const wordObj = createWord(word, language, definition, context);
            addWord(wordObj);
            closeAddWordModalFunc();
        });
    }

    // Detail Actions
    const saveBookBtn = document.getElementById('saveBookBtn');
    if (saveBookBtn) {
        saveBookBtn.addEventListener('click', () => {
            const bookIdToDelete = currentBookId;
            if (!bookIdToDelete) return;

            const title = document.getElementById('detailTitle').value;
            const author = document.getElementById('detailAuthor').value;
            let currentPage = parseInt(document.getElementById('detailCurrentPage').value) || 0;
            const percentage = parseInt(document.getElementById('detailPercentage').value) || 0;
            const comments = document.getElementById('detailComments').value;
            const category = document.getElementById('detailCategorySelect').value;
            const language = document.getElementById('detailLanguageSelect').value;
            const rating = parseFloat(document.getElementById('detailRating').value) || 0;

            // If percentage is provided but currentPage is 0, calculate page from percentage
            const book = getBook(currentBookId);
            if (book && percentage > 0 && currentPage === 0) {
                currentPage = Math.round((percentage / 100) * book.totalPages);
            }

            updateBook(currentBookId, {
                title: title,
                author: author,
                currentPage: currentPage,
                comments: comments,
                category: category,
                language: language,
                rating: rating
            });

            closeBookDetailsModal();
        });
    }

    const deleteBookBtn = document.getElementById('deleteBookBtn');
    if (deleteBookBtn) {
        deleteBookBtn.addEventListener('click', () => {
            const bookIdToDelete = currentBookId;
            if (!bookIdToDelete) return;
            if (confirm('¿Estás seguro de que quieres eliminar este libro?')) {
                closeBookDetailsModal();
                deleteBook(bookIdToDelete);
            }
        });
    }


    if (editWordForm) {
        editWordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!currentWordId) return;

            const word = document.getElementById('detailWordText').value;
            const language = document.getElementById('detailWordLanguage').value;
            const definition = document.getElementById('detailWordDefinition').value;
            const context = document.getElementById('detailWordContext').value;

            updateWord(currentWordId, {
                word: word,
                language: language,
                definition: definition,
                context: context
            });

            closeWordDetailsModalFunc();
        });
    }

    if (deleteWordBtn) {
        deleteWordBtn.addEventListener('click', () => {
            if (!currentWordId) return;
            if (confirm('¿Estás seguro de que quieres eliminar esta palabra?')) {
                deleteWord(currentWordId);
                closeWordDetailsModalFunc();
            }
        });
    }

    // Theme Toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Import/Export
    const exportBtn = document.getElementById('exportBtn');
    const importInput = document.getElementById('importInput');
    const importGoodreadsInput = document.getElementById('importGoodreadsInput');

    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    if (importInput) {
        importInput.addEventListener('change', () => importData(importInput));
    }

    if (importGoodreadsInput) {
        importGoodreadsInput.addEventListener('change', () => importFromGoodreads(importGoodreadsInput.files[0]));
    }

    // Initial Render
    renderBooks();
    renderStatistics();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);