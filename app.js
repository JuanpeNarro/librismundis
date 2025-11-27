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
let addBookRatingValue = 0;
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
        rating: parseInt(rating) || 0,
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
                    <div class="star-rating">
                        ${generateStars(book.rating, false)}
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

function generateStars(rating, interactive = true) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= rating ? 'filled' : '';
        const onclick = interactive ? `onclick="setRating(${i})"` : '';
        stars += `<span class="star ${filled}" data-rating="${i}" ${onclick}>⭐</span>`;
    }
    return stars;
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
    addBookRatingValue = 0;
    updateAddBookRating(0);
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

    updateDetailRating(book.rating);

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
// Rating Management
// ============================================

function setRating(rating) {
    addBookRatingValue = rating;
    updateAddBookRating(rating);
}

function updateAddBookRating(rating) {
    const stars = document.querySelectorAll('#addBookRating .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
    });
    document.getElementById('bookRating').value = rating;
}

function setDetailRating(rating) {
    updateDetailRating(rating);
}

function updateDetailRating(rating) {
    const stars = document.querySelectorAll('#detailRating .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
    });
}

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
    const rating = addBookRatingValue;
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
    const rating = document.querySelectorAll('#detailRating .star.filled').length;

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

// Ratings
document.querySelectorAll('#addBookRating .star').forEach(star => {
    star.addEventListener('click', () => {
        setRating(parseInt(star.dataset.rating));
    });
});

document.querySelectorAll('#detailRating .star').forEach(star => {
    star.addEventListener('click', () => {
        setDetailRating(parseInt(star.dataset.rating));
    });
});

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
// Initialize Application
// ============================================

function init() {
    loadTheme();
    loadFromLocalStorage();
    renderBooks();
    renderStatistics();
    renderVocabulary();
}


// ============================================
// Share Functions
// ============================================

// Share via Email
function shareViaEmail() {
    const data = {
        books: books,
        vocabulary: vocabulary,
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const fileName = `librismundis_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    // Check if Web Share API is available
    if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'application/json' });
        
        if (navigator.canShare({ files: [file] })) {
            navigator.share({
                title: 'Copia de seguridad de LIBRISMUNDIS',
                text: `📧 Backup de LIBRISMUNDIS\n\nLibros: ${books.length}\nPalabras: ${vocabulary.length}\n\nFecha: ${new Date().toLocaleDateString()}`,
                files: [file]
            })
            .then(() => console.log('Compartido exitosamente'))
            .catch((error) => {
                console.log('Error al compartir:', error);
                downloadBackupFile(blob, fileName);
            });
        } else {
            alert('Tu navegador no soporta compartir archivos. Se descargará el archivo.');
            downloadBackupFile(blob, fileName);
        }
    } else {
        // Fallback for desktop
        downloadBackupFile(blob, fileName);
        const subject = encodeURIComponent('Copia de seguridad de LIBRISMUNDIS');
        const body = encodeURIComponent(`Adjunto mi copia de seguridad de LIBRISMUNDIS.\n\n📚 Libros: ${books.length}\n🧠 Palabras: ${vocabulary.length}`);
        setTimeout(() => {
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        }, 500);
    }
}

// Share via WhatsApp
function shareViaWhatsApp() {
    const data = {
        books: books,
        vocabulary: vocabulary,
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const fileName = `librismundis_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    // Check if Web Share API is available (works on mobile)
    if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'application/json' });
        
        if (navigator.canShare({ files: [file] })) {
            navigator.share({
                title: 'Copia de seguridad de LIBRISMUNDIS',
                text: `📚 Backup de LIBRISMUNDIS\n\nLibros: ${books.length}\nPalabras: ${vocabulary.length}\n\nFecha: ${new Date().toLocaleDateString()}`,
                files: [file]
            })
            .then(() => console.log('Compartido exitosamente'))
            .catch((error) => {
                console.log('Error al compartir:', error);
                downloadBackupFile(blob, fileName);
            });
        } else {
            alert('Tu navegador no soporta compartir archivos. Se descargará el archivo.');
            downloadBackupFile(blob, fileName);
        }
    } else {
        // Fallback for desktop: download + open WhatsApp
        downloadBackupFile(blob, fileName);
        const message = encodeURIComponent(`📚 *Copia de seguridad de LIBRISMUNDIS*\n\nFecha: ${new Date().toLocaleDateString()}\n📖 Libros: ${books.length}\n🧠 Palabras: ${vocabulary.length}\n\nHe descargado el archivo JSON. Para restaurar estos datos, usa la opción "Importar datos" en LIBRISMUNDIS.`);
        setTimeout(() => {
            window.open(`https://wa.me/?text=${message}`, '_blank');
        }, 500);
    }
}

// Helper function to download backup file
function downloadBackupFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

init();
