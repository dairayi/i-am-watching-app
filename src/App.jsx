import { useState, useEffect } from 'react';
import { X, Gamepad2, Film, Moon, Sun, Menu, Settings, User, CreditCard, Search } from 'lucide-react';

// API Keys from environment variables
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;

export default function App() {
  const [viewMode, setViewMode] = useState('movies');
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [movieItems, setMovieItems] = useState([]);
  const [gameItems, setGameItems] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formReleaseDate, setFormReleaseDate] = useState('');
  const [formDirector, setFormDirector] = useState('');
  const [formGenre, setFormGenre] = useState('');
  const [formDeveloper, setFormDeveloper] = useState('');
  const [formPlatform, setFormPlatform] = useState('');

  const items = viewMode === 'movies' ? movieItems : gameItems;

  // Load items and dark mode from localStorage on mount
  useEffect(() => {
    const savedMovies = localStorage.getItem('watchedMedia');
    const savedGames = localStorage.getItem('playedGames');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedMovies) {
      setMovieItems(JSON.parse(savedMovies));
    }
    if (savedGames) {
      setGameItems(JSON.parse(savedGames));
    }

    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    } else {
      setDarkMode(prefersDark);
    }
  }, []);

  // Save movie items to localStorage
  useEffect(() => {
    localStorage.setItem('watchedMedia', JSON.stringify(movieItems));
  }, [movieItems]);

  // Save game items to localStorage
  useEffect(() => {
    localStorage.setItem('playedGames', JSON.stringify(gameItems));
  }, [gameItems]);

  // Save dark mode to localStorage and toggle class on root element
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Search API function - placeholder for now
  useEffect(() => {
    const searchAPI = async () => {
      if (searchInput.trim().length < 3) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setSearchResults([]); // Clear previous results while searching

      try {
        let results = [];
        if (viewMode === 'movies') {
          const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${searchInput}`);
          if (!response.ok) throw new Error('Failed to fetch movies from TMDB');
          const data = await response.json();
          results = data.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            releaseDate: movie.release_date ? movie.release_date.split('-')[0] : '',
            // Director and Genre often require a second API call per item.
            // We'll leave them empty for the user to fill in the modal.
            director: '',
            genre: '',
          }));
        } else { // viewMode === 'games'
          const response = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${searchInput}`);
          if (!response.ok) throw new Error('Failed to fetch games from RAWG');
          const data = await response.json();
          results = data.results.map(game => ({
            id: game.id,
            title: game.name,
            releaseDate: game.released ? game.released.split('-')[0] : '',
            platform: game.platforms?.map(p => p.platform.name).join(', ') || '',
            developer: game.developers?.[0]?.name || '',
          }));
        }
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        // You could set an error state here to show a message in the UI
      } finally {
        setIsSearching(false);
      }
    };

    // Use a debounce to prevent API calls on every keystroke
    const debounce = setTimeout(searchAPI, 500);
    return () => clearTimeout(debounce);
  }, [searchInput, viewMode]);

  const handleSelectSearchResult = (result) => {
    setFormTitle(result.title);
    setFormReleaseDate(result.releaseDate || '');
    setFormDirector(result.director || '');
    setFormGenre(result.genre || '');
    setFormDeveloper(result.developer || '');
    setFormPlatform(result.platform || '');
    setSearchInput('');
    setSearchResults([]);
    setModalOpen(true);
  };

  const handleAddItem = () => {
    if (formTitle.trim()) {
      if (viewMode === 'movies') {
        const newItem = {
          id: Date.now().toString(),
          title: formTitle.trim(),
          addedAt: Date.now(),
          releaseDate: formReleaseDate || undefined,
          director: formDirector || undefined,
          genre: formGenre || undefined,
        };
        setMovieItems([newItem, ...movieItems]);
      } else {
        const newItem = {
          id: Date.now().toString(),
          title: formTitle.trim(),
          addedAt: Date.now(),
          releaseDate: formReleaseDate || undefined,
          developer: formDeveloper || undefined,
          platform: formPlatform || undefined,
        };
        setGameItems([newItem, ...gameItems]);
      }
      // Reset form
      setFormTitle('');
      setFormReleaseDate('');
      setFormDirector('');
      setFormGenre('');
      setFormDeveloper('');
      setFormPlatform('');
      setModalOpen(false);
    }
  };

  const handleRemoveItem = (id) => {
    if (viewMode === 'movies') {
      setMovieItems(movieItems.filter(item => item.id !== id));
    } else {
      setGameItems(gameItems.filter(item => item.id !== id));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      {/* Menu button */}
      <div className="fixed top-6 left-6 z-20">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-full p-3 hover:bg-accent hover:shadow-md transition-all"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          
          {/* Menu */}
          <div className="fixed top-20 left-6 z-20 bg-card/80 backdrop-blur-md border border-border rounded-2xl shadow-xl min-w-[220px] flex flex-col">
            <div className="p-2">
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-all"
              >
                <Settings size={20} className="text-muted-foreground" />
                <span className="text-card-foreground">Settings</span>
              </button>
              
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-all"
              >
                <User size={20} className="text-muted-foreground" />
                <span className="text-card-foreground">Profile</span>
              </button>
              
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-all"
              >
                <CreditCard size={20} className="text-muted-foreground" />
                <span className="text-card-foreground">Subscriptions</span>
              </button>
              
              <div className="my-2 border-t border-border"></div>
              
              <button
                onClick={() => {
                  setDarkMode(!darkMode);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-all"
              >
                {darkMode ? (
                  <>
                    <Sun size={20} className="text-muted-foreground" />
                    <span className="text-card-foreground">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={20} className="text-muted-foreground" />
                    <span className="text-card-foreground">Dark Mode</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Footer */}
            <div className="mt-2 pt-3 pb-3 px-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                i am watching © 2025 PRISM PODCAST
              </p>
            </div>
          </div>
        </>
      )}

      {/* Top right toggle button */}
      <div className="fixed top-6 right-6 z-10">
        <button
          onClick={() => setViewMode(viewMode === 'movies' ? 'games' : 'movies')}
          className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-full px-4 py-2 hover:bg-accent hover:shadow-md transition-all"
        >
          {viewMode === 'movies' ? (
            <>
              <Gamepad2 size={18} className="text-muted-foreground" />
              <span className="text-sm text-card-foreground">Games</span>
            </>
          ) : (
            <>
              <Film size={18} className="text-muted-foreground" />
              <span className="text-sm text-card-foreground">Movies</span>
            </>
          )}
        </button>
      </div>

      {/* List of saved items */}
      <div className="flex-1 overflow-y-auto px-6 pt-20 pb-32">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No {viewMode === 'movies' ? 'movies or shows' : 'games'} added yet</p>
          </div>
        ) : (
          <ul className="space-y-3 max-w-2xl mx-auto">
            {items.map((item) => (
              <li
                key={item.id}
                className="bg-card/50 backdrop-blur-sm rounded-xl p-5 hover:bg-accent hover:shadow-lg transition-all border border-border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-card-foreground mb-2">{item.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {item.releaseDate && (
                        <span>Release: {item.releaseDate}</span>
                      )}
                      {viewMode === 'movies' && 'director' in item && item.director && (
                        <span>Director: {item.director}</span>
                      )}
                      {viewMode === 'movies' && 'genre' in item && item.genre && (
                        <span>Genre: {item.genre}</span>
                      )}
                      {viewMode === 'games' && 'developer' in item && item.developer && (
                        <span>Developer: {item.developer}</span>
                      )}
                      {viewMode === 'games' && 'platform' in item && item.platform && (
                        <span>Platform: {item.platform}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="ml-4 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    aria-label="Remove item"
                  >
                    <X size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Fixed bottom section with search bar */}
      <div className="fixed bottom-8 left-0 right-0 px-6 z-10">
        <div className="max-w-2xl mx-auto relative">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Search for ${viewMode === 'movies' ? 'movies or shows' : 'games'}...`}
              className="w-full pl-12 pr-4 py-4 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-ring bg-input/80 text-foreground placeholder:text-muted-foreground shadow-lg backdrop-blur-sm"
            />
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-card/80 backdrop-blur-md border border-border rounded-2xl shadow-xl max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full text-left p-4 hover:bg-accent first:rounded-t-2xl last:rounded-b-2xl transition-all border-b border-border last:border-b-0"
                >
                  <div className="text-card-foreground">{result.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {viewMode === 'movies' ? (
                      <>{result.releaseDate && `${result.releaseDate}`}{result.genre && ` • ${result.genre}`}</>
                    ) : (
                      <>{result.releaseDate && `${result.releaseDate}`}{result.platform && ` • ${result.platform}`}</>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Loading indicator */}
          {isSearching && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-card/80 backdrop-blur-md border border-border rounded-2xl shadow-xl p-4 text-center">
              <span className="text-card-foreground">Searching...</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {modalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
            <div className={`${theme.buttonBg} backdrop-blur-md border ${theme.buttonBorder} rounded-2xl shadow-2xl max-w-md w-full p-6`}>
              <h2 className={`text-xl mb-4 ${theme.itemText}`}>
                Add {viewMode === 'movies' ? 'Movie/Show' : 'Game'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm mb-1 ${theme.buttonText}`}>Title*</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`w-full px-4 py-2 rounded-lg border ${theme.inputBorder} focus:outline-none focus:ring-2 ${theme.inputRing} ${theme.inputBg} ${theme.inputText}`}
                    placeholder="Enter title"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm mb-1 ${theme.buttonText}`}>Release Date</label>
                  <input
                    type="text"
                    value={formReleaseDate}
                    onChange={(e) => setFormReleaseDate(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`w-full px-4 py-2 rounded-lg border ${theme.inputBorder} focus:outline-none focus:ring-2 ${theme.inputRing} ${theme.inputBg} ${theme.inputText}`}
                    placeholder="e.g., 2024"
                  />
                </div>
                
                {viewMode === 'movies' ? (
                  <>
                    <div>
                      <label className={`block text-sm mb-1 ${theme.buttonText}`}>Director</label>
                      <input
                        type="text"
                        value={formDirector}
                        onChange={(e) => setFormDirector(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className={`w-full px-4 py-2 rounded-lg border ${theme.inputBorder} focus:outline-none focus:ring-2 ${theme.inputRing} ${theme.inputBg} ${theme.inputText}`}
                        placeholder="Enter director"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm mb-1 ${theme.buttonText}`}>Genre</label>
                      <input
                        type="text"
                        value={formGenre}
                        onChange={(e) => setFormGenre(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className={`w-full px-4 py-2 rounded-lg border ${theme.inputBorder} focus:outline-none focus:ring-2 ${theme.inputRing} ${theme.inputBg} ${theme.inputText}`}
                        placeholder="Enter genre"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className={`block text-sm mb-1 ${theme.buttonText}`}>Developer</label>
                      <input
                        type="text"
                        value={formDeveloper}
                        onChange={(e) => setFormDeveloper(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className={`w-full px-4 py-2 rounded-lg border ${theme.inputBorder} focus:outline-none focus:ring-2 ${theme.inputRing} ${theme.inputBg} ${theme.inputText}`}
                        placeholder="Enter developer"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm mb-1 ${theme.buttonText}`}>Platform</label>
                      <input
                        type="text"
                        value={formPlatform}
                        onChange={(e) => setFormPlatform(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className={`w-full px-4 py-2 rounded-lg border ${theme.inputBorder} focus:outline-none focus:ring-2 ${theme.inputRing} ${theme.inputBg} ${theme.inputText}`}
                        placeholder="Enter platform"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-all text-card-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground border border-transparent hover:bg-primary/90 transition-all"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}