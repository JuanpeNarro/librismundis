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

let currentView = 'library'; // 'library' | 'vocabulary'

// DOM Elements
const booksGrid = document.getElementById('booksGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const languageFilter = document.getElementById('languageFilter');
const categoryTabs = document.querySelectorAll('.category-tab');

// Vocabulary Elements
const vocabularyGrid = document.getElementById('vocabularyGrid');
const vocabEmptyState = document.getElementById('vocabEmptyState');
const vocabSearchInput = document.getElementById('vocabSearchInput');
const vocabLanguageFilter = document.getElementById('vocabLanguageFilter');
const addWordBtn = document.getElementById('addWordBtn');
const addWordModal = document.getElementById('addWordModal');
const closeAddWordModal = document.getElementById('closeAddWordModal');
const cancelAddWord = document.getElementById('cancelAddWord');
const addWordForm = document.getElementById('addWordForm');

// Word Details Elements
const wordDetailsModal = document.getElementById('wordDetailsModal');
const closeWordDetailsModal = document.getElementById('closeWordDetailsModal');
const editWordForm = document.getElementById('editWordForm');
const deleteWordBtn = document.getElementById('deleteWordBtn');

// Navigation Elements
const navTabs = document.querySelectorAll('.nav-tab');
const libraryView = document.getElementById('libraryView');
const vocabularyView = document.getElementById('vocabularyView');

// Modal Elements
const addBookModal = document.getElementById('addBookModal');
const bookDetailsModal = document.getElementById('bookDetailsModal');
const addBookBtn = document.getElementById('addBookBtn');
const closeAddModal = document.getElementById('closeAddModal');
const cancelAddBook = document.getElementById('cancelAddBook');
const closeDetailsModal = document.getElementById('closeDetailsModal');
const addBookForm = document.getElementById('addBookForm');
const themeToggle = document.getElementById('themeToggle');

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
        localStorage.setItem('librismundis_books', JSON.stringify(books));
        localStorage.setItem('librismundis_vocabulary', JSON.stringify(vocabulary));
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const storedBooks = localStorage.getItem('librismundis_books');
        if (storedBooks) {
            books = JSON.parse(storedBooks);
        }

        const storedVocab = localStorage.getItem('librismundis_vocabulary');
        if (storedVocab) {
            vocabulary = JSON.parse(storedVocab);
        }
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

function createBook(title, author, totalPages, category, language = 'es', currentPage = 0, rating = 0, comments = '') {
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
        dateAdded: Date.now()
    };

    book.percentage = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;

    return book;
}

function addBook(book) {
    books.push(book);
    saveToLocalStorage();
    renderBooks();
    renderStatistics();
}

function updateBook(id, updates) {
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
        books[index] = { ...books[index], ...updates };

        if (updates.currentPage !== undefined || updates.totalPages !== undefined) {
            const book = books[index];
            book.percentage = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
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
    saveToLocalStorage();
    renderVocabulary();
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

    if (filteredWords.length === 0) {
        vocabularyGrid.classList.add('hidden');
        vocabEmptyState.classList.remove('hidden');
    } else {
        vocabularyGrid.classList.remove('hidden');
        vocabEmptyState.classList.add('hidden');

        vocabularyGrid.innerHTML = filteredWords.map(word => `
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
    renderBooks();
}

function filterByLanguage(language) {
    currentLanguageFilter = language;
    renderBooks();
}

function sortBooks(sortType) {
    currentSort = sortType;
    renderBooks();
}

function searchBooks(query) {
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

function renderBooks(searchQuery = '') {
    const filteredBooks = getFilteredAndSortedBooks(searchQuery);

    if (filteredBooks.length === 0) {
        booksGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        booksGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');

        booksGrid.innerHTML = filteredBooks.map(book => `
            <div class="book-card" onclick="openBookDetails('${book.id}')">
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

    document.getElementById('detailTitle').textContent = book.title;
    document.getElementById('detailAuthor').textContent = `por ${book.author}`;
    document.getElementById('detailCategory').textContent = getCategoryLabel(book.category);

    // Language display
    const langCode = book.language || 'es';
    document.getElementById('detailLanguage').textContent = `${getLanguageFlag(langCode)} ${getLanguageName(langCode)}`;

    document.getElementById('detailTotalPages').textContent = book.totalPages;
    document.getElementById('detailProgressPercentage').textContent = `${book.percentage}%`;
    document.getElementById('detailProgressBar').style.width = `${book.percentage}%`;
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
// Rating Management (Removed - now using numeric input)
// ============================================

// ============================================
// Event Handlers
// ============================================

// Navigation
navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const view = tab.dataset.view;

        // Update tabs
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update views
        if (view === 'library') {
            libraryView.classList.remove('hidden');
            vocabularyView.classList.add('hidden');
            renderBooks();
        } else {
            libraryView.classList.add('hidden');
            vocabularyView.classList.remove('hidden');
            renderVocabulary();
        }
    });
});

// Book Events
addBookBtn.addEventListener('click', openAddBookModal);
closeAddModal.addEventListener('click', closeAddBookModal);
cancelAddBook.addEventListener('click', closeAddBookModal);
closeDetailsModal.addEventListener('click', closeBookDetailsModal);

// Vocabulary Events
addWordBtn.addEventListener('click', openAddWordModal);
closeAddWordModal.addEventListener('click', closeAddWordModalFunc);
cancelAddWord.addEventListener('click', closeAddWordModalFunc);
closeWordDetailsModal.addEventListener('click', closeWordDetailsModalFunc);

// Theme toggle
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Forms
addBookForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const totalPages = document.getElementById('bookTotalPages').value;
    const category = document.getElementById('bookCategory').value;
    const language = document.getElementById('bookLanguage').value;
    const currentPage = document.getElementById('bookCurrentPage').value || 0;
    const rating = parseFloat(document.getElementById('bookRating').value) || 0;
    const comments = document.getElementById('bookComments').value;

    const book = createBook(title, author, totalPages, category, language, currentPage, rating, comments);
    addBook(book);

    closeAddBookModal();
});

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

editWordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentWordId) return;

    const word = document.getElementById('detailWordText').value;
    const language = document.getElementById('detailWordLanguage').value;
    const definition = document.getElementById('detailWordDefinition').value;
    const context = document.getElementById('detailWordContext').value;

    updateWord(currentWordId, {
        word: word.trim(),
        language: language,
        definition: definition.trim(),
        context: context.trim()
    });

    closeWordDetailsModalFunc();
});

deleteWordBtn.addEventListener('click', () => {
    if (!currentWordId) return;

    if (confirm('¿Estás seguro de que quieres eliminar esta palabra?')) {
        deleteWord(currentWordId);
        closeWordDetailsModalFunc();
    }
});

document.getElementById('saveBookBtn').addEventListener('click', () => {
    if (!currentBookId) return;

    const currentPage = parseInt(document.getElementById('detailCurrentPage').value) || 0;
    const percentage = parseInt(document.getElementById('detailPercentage').value) || 0;
    const comments = document.getElementById('detailComments').value;
    const category = document.getElementById('detailCategorySelect').value;
    const language = document.getElementById('detailLanguageSelect').value;
    const rating = parseFloat(document.getElementById('detailRating').value) || 0;

    const book = getBook(currentBookId);
    let updates = { comments, category, language, rating };

    if (currentPage !== book.currentPage) {
        updates.currentPage = currentPage;
    } else if (percentage !== book.percentage && book.totalPages > 0) {
        updates.currentPage = Math.round((percentage / 100) * book.totalPages);
    }

    updateBook(currentBookId, updates);
    closeBookDetailsModal();
});

document.getElementById('deleteBookBtn').addEventListener('click', () => {
    if (!currentBookId) return;

    if (confirm('¿Estás seguro de que quieres eliminar este libro?')) {
        deleteBook(currentBookId);
        closeBookDetailsModal();
    }
});

// Filters
categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        categoryTabs.forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        filterBooks(tab.dataset.category);
    });
});

sortSelect.addEventListener('change', (e) => {
    sortBooks(e.target.value);
});

if (languageFilter) {
    languageFilter.addEventListener('change', (e) => {
        filterByLanguage(e.target.value);
    });
}

if (vocabLanguageFilter) {
    vocabLanguageFilter.addEventListener('change', (e) => {
        currentVocabLanguageFilter = e.target.value;
        renderVocabulary();
    });
}

searchInput.addEventListener('input', (e) => {
    searchBooks(e.target.value);
});

if (vocabSearchInput) {
    vocabSearchInput.addEventListener('input', (e) => {
        renderVocabulary(e.target.value);
    });
}

// Ratings (removed - now using numeric input)

// Modal Outside Clicks
addBookModal.addEventListener('click', (e) => {
    if (e.target === addBookModal) {
        closeAddBookModal();
    }
});

bookDetailsModal.addEventListener('click', (e) => {
    if (e.target === bookDetailsModal) {
        closeBookDetailsModal();
    }
});

addWordModal.addEventListener('click', (e) => {
    if (e.target === addWordModal) {
        closeAddWordModalFunc();
    }
});

wordDetailsModal.addEventListener('click', (e) => {
    if (e.target === wordDetailsModal) {
        closeWordDetailsModalFunc();
    }
});

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

        // Convert Goodreads 5-star rating to our 10-point scale
        const convertedRating = rating > 0 ? rating * 2 : 0;

        books.push({
            title: title.replace(/^"|"$/g, ''),
            author: author.replace(/^"|"$/g, ''),
            totalPages: pages,
            category: category,
            rating: convertedRating,
            language: 'en', // Default to English for Goodreads imports
            currentPage: category === 'completed' ? pages : 0
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
        parsedBooks.forEach(bookData => {
            const book = createBook(
                bookData.title,
                bookData.author,
                bookData.totalPages,
                bookData.category,
                bookData.language,
                bookData.currentPage,
                bookData.rating,
                ''
            );
            addBook(book);
            addedCount++;
        });

        alert(`Se importaron ${addedCount} libros de Goodreads exitosamente.`);
    };

    reader.onerror = function () {
        alert('Error al leer el archivo CSV.');
    };

    reader.readAsText(file);
}

// ============================================
// Initialize Application
// ============================================

function init() {
    loadTheme();
    loadFromLocalStorage();
    renderBooks();
    renderStatistics();
    renderVocabulary();

    // Goodreads import event listeners
    const importGoodreadsBtn = document.getElementById('importGoodreadsBtn');
    const goodreadsFileInput = document.getElementById('goodreadsFileInput');

    if (importGoodreadsBtn && goodreadsFileInput) {
        importGoodreadsBtn.addEventListener('click', () => {
            goodreadsFileInput.click();
        });

        goodreadsFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importFromGoodreads(file);
                e.target.value = ''; // Reset file input
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
