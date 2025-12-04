# LIBRISMUNDIS - Gestor de Libros

![LIBRISMUNDIS](icon.svg)

**LIBRISMUNDIS** es un gestor de libros profesional y moderno con seguimiento de progreso, sistema de gamificación, y funcionalidades avanzadas para amantes de la lectura.

## ✨ Características

### 📚 Gestión de Libros
- Agregar libros manualmente o buscar en Google Books API
- Categorías: Quiero leer, Leyendo, Terminado, No terminado
- Seguimiento de progreso de lectura (páginas y porcentaje)
- Sistema de calificación (1-10)
- Comentarios y notas personales
- Portadas de libros completas
- Soporte multi-idioma

### 🎮 Gamificación
- Sistema de experiencia (XP) con barra de progreso visual
- Niveles con badges circulares y efectos de brillo
- Contador de racha con animación de llama
- Notificaciones de logros

### 🧠 Vocabulario
- Diccionario personal de palabras
- Definiciones y contexto
- Filtrado por idioma
- Búsqueda rápida

### 🔐 Sistema de Autenticación
- Registro e inicio de sesión
- Datos de usuario separados
- Persistencia local

### 📱 Diseño Responsive
- Optimizado para desktop (1024px+)
- Adaptado para tablet (768px-1023px)
- Completamente funcional en móvil (<768px)
- Touch-friendly con botones de 44px mínimo
- Diseño adaptativo con breakpoints múltiples

### 📤 Importación/Exportación
- Exportar biblioteca completa (JSON)
- Importar desde Goodreads (CSV)
- Backup y restauración de datos

## 🚀 Instalación

### Opción 1: Uso Directo (Recomendado)
1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/librismundis.git
cd librismundis
```

2. Abre `index.html` en tu navegador favorito

¡Eso es todo! No requiere instalación de dependencias.

### Opción 2: Con Servidor Local
Si prefieres usar un servidor local:

```bash
# Con Python
python -m http.server 8000

# Con Node.js (http-server)
npx http-server
```

Luego abre `http://localhost:8000` en tu navegador.

## 📋 Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- JavaScript habilitado

## 🎨 Tecnologías Utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos con variables CSS y animaciones
- **JavaScript (Vanilla)** - Sin frameworks, código puro
- **LocalStorage** - Persistencia de datos
- **Google Books API** - Búsqueda de libros
- **PWA** - Progressive Web App con Service Worker

## 📱 PWA (Progressive Web App)

LIBRISMUNDIS funciona como una PWA, lo que significa que puedes:
- Instalarlo en tu dispositivo
- Usarlo offline (próximamente)
- Recibir notificaciones
- Experiencia similar a una app nativa

## 🎯 Uso

### Agregar un Libro
1. Click en "➕ Agregar Libro"
2. Usa "🔍 Buscar en Internet" para autocompletar desde Google Books
3. O completa manualmente los campos
4. Guarda el libro

### Seguimiento de Progreso
1. Click en cualquier libro para ver detalles
2. Actualiza la página actual o porcentaje
3. Los cambios se guardan automáticamente

### Importar desde Goodreads
1. Exporta tu biblioteca desde Goodreads como CSV
2. Click en "📚 Importar de Goodreads"
3. Selecciona el archivo CSV
4. Las portadas se buscarán automáticamente

## 🎨 Personalización

### Temas
- Tema oscuro (por defecto)
- Tema claro
- Cambio con el botón 🌙/☀️

### Responsive
El diseño se adapta automáticamente a:
- Desktop (1920px, 1366px)
- Tablet (768px, 1024px)
- Mobile (375px, 414px)

## 🔒 Privacidad

- Todos los datos se almacenan localmente en tu navegador
- No se envía información a servidores externos (excepto API calls opcionales)


## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## 👤 Autor

**Juanpe Narro**

## 🙏 Agradecimientos

- Google Books API por la búsqueda de libros
- La comunidad de desarrolladores web

---

**¿Te gusta LIBRISMUNDIS?** ⭐ Dale una estrella al repositorio!

