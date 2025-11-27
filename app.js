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
