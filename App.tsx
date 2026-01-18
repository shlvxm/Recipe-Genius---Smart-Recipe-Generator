import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { CameraCapture } from './components/CameraCapture';
import { DietaryPreference, Recipe, DetectionResult, ShoppingItem, UserProfile, Store as StoreType } from './types';
import { analyzeImageAndGenerateRecipes, generateExploreRecipes, findNearbyStores, searchRecipes } from './services/geminiService';
import { 
  Loader2, 
  ChevronRight, 
  Clock, 
  Flame, 
  AlertCircle,
  Download,
  Bookmark,
  CookingPot,
  Bell,
  ShoppingBasket,
  Trash2,
  Plus,
  Camera,
  CheckCircle2,
  X,
  Moon,
  Sun,
  MapPin,
  RefreshCw,
  MessageSquareHeart,
  Send,
  Mail,
  Search as SearchIcon,
  Sparkles
} from 'lucide-react';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'saved' | 'explore' | 'shopping' | 'settings' | 'feedback'>('home');
  const [image, setImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Preparing your kitchen...");
  const [error, setError] = useState<string | null>(null);
  const [preference, setPreference] = useState<DietaryPreference>(DietaryPreference.NONE);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [exploreResult, setExploreResult] = useState<DetectionResult | null>(null);
  const [exploreSearchQuery, setExploreSearchQuery] = useState('');
  const [isExploring, setIsExploring] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [nearbyStores, setNearbyStores] = useState<StoreType[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  
  // Feedback state
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  // Initialize dark mode from localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('recipegenius_theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial user and data load
    const savedUser = localStorage.getItem('recipegenius_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }

    const saved = localStorage.getItem('recipegenius_saved');
    if (saved) {
      setSavedRecipes(JSON.parse(saved));
    }
    const shopping = localStorage.getItem('recipegenius_shopping');
    if (shopping) {
      setShoppingList(JSON.parse(shopping));
    }
  }, []);

  // Handle dark mode side effects
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('recipegenius_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('recipegenius_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (isLoggedIn && !exploreResult) {
      fetchExploreData();
    }
  }, [isLoggedIn, exploreResult]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    let statusTimer: number;
    if (isLoading) {
      const statuses = [
        "Analyzing ingredients...",
        "Identifying fresh produce...",
        "Consulting AI head chef...",
        "Designing personalized recipes...",
        "Calculating nutritional values...",
        "Finalizing your menu..."
      ];
      let i = 0;
      statusTimer = window.setInterval(() => {
        setLoadingStatus(statuses[i % statuses.length]);
        i++;
      }, 2000);
    }
    return () => clearInterval(statusTimer);
  }, [isLoading]);

  useEffect(() => {
    if (activeTab === 'shopping' && nearbyStores.length === 0) {
      handleGetNearbyStores();
    }
  }, [activeTab, nearbyStores.length]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const fetchExploreData = async () => {
    setIsExploring(true);
    try {
      const data = await generateExploreRecipes();
      setExploreResult(data);
    } catch (e) {
      console.error("Explore fetch failed", e);
    } finally {
      setIsExploring(false);
    }
  };

  const handleExploreSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!exploreSearchQuery.trim()) {
      fetchExploreData();
      return;
    }
    
    setIsExploring(true);
    setError(null);
    try {
      const data = await searchRecipes(exploreSearchQuery, preference);
      setExploreResult(data);
    } catch (err) {
      console.error("Search failed", err);
      setError("AI was unable to find specific recipes for that search. Try something else!");
    } finally {
      setIsExploring(false);
    }
  };

  const handleGetNearbyStores = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const stores = await findNearbyStores(position.coords.latitude, position.coords.longitude);
          setNearbyStores(stores);
        } catch (err) {
          console.error("Failed to fetch stores", err);
          setError("Failed to find nearby stores");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error("Geolocation error", err);
        setIsLocating(false);
        setError("Please enable location access to find nearby stores");
      }
    );
  };

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('recipegenius_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('recipegenius_user');
    reset();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size exceeds 5MB limit");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleImageSelection(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSelection = (base64Image: string) => {
    setImage(base64Image);
    setResult(null);
    setSelectedRecipe(null);
    setError(null);
    setIsCameraOpen(false);
    setActiveTab('home'); 
  };

  const handleProcess = async () => {
    if (!image) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeImageAndGenerateRecipes(image, preference);
      setResult(data);
    } catch (err) {
      setError("Failed to analyze ingredients. Please try a clearer photo.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    const isAlreadySaved = savedRecipes.find(r => r.id === recipe.id);
    if (!isAlreadySaved) {
      const updated = [...savedRecipes, recipe];
      setSavedRecipes(updated);
      localStorage.setItem('recipegenius_saved', JSON.stringify(updated));
      setShowToast("Recipe saved successfully!");
    } else {
      setShowToast("Recipe already in favorites.");
    }
  };

  const removeSavedRecipe = (id: string) => {
    const updated = savedRecipes.filter(r => r.id !== id);
    setSavedRecipes(updated);
    localStorage.setItem('recipegenius_saved', JSON.stringify(updated));
    setShowToast("Recipe removed.");
  };

  const handleDownloadPDF = (recipe: Recipe) => {
    const doc = new jsPDF();
    const margin = 20;
    let cursorY = 20;

    doc.setFontSize(22);
    doc.setTextColor(17, 24, 17);
    doc.text(recipe.name, margin, cursorY);
    cursorY += 10;

    doc.setFontSize(12);
    doc.setTextColor(97, 137, 97);
    doc.text(`${recipe.cuisine} | Prep: ${recipe.prepTime} | Cook: ${recipe.cookTime} | Cal: ${recipe.calories}`, margin, cursorY);
    cursorY += 15;

    doc.setFontSize(16);
    doc.setTextColor(17, 24, 17);
    doc.text('Ingredients', margin, cursorY);
    cursorY += 7;
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const splitIngredients = doc.splitTextToSize(recipe.ingredients.join(', '), 170);
    doc.text(splitIngredients, margin, cursorY);
    cursorY += (splitIngredients.length * 6) + 10;

    doc.setFontSize(16);
    doc.setTextColor(17, 24, 17);
    doc.text('Instructions', margin, cursorY);
    cursorY += 7;
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);

    recipe.instructions.forEach((step, index) => {
      if (cursorY > 270) {
        doc.addPage();
        cursorY = 20;
      }
      const stepText = `${index + 1}. ${step}`;
      const splitStep = doc.splitTextToSize(stepText, 170);
      doc.text(splitStep, margin, cursorY);
      cursorY += (splitStep.length * 6) + 4;
    });

    doc.save(`${recipe.name.replace(/\s+/g, '_')}_Recipe.pdf`);
    setShowToast("PDF downloading...");
  };

  const addToShoppingList = (ingredients: string[], recipeName?: string) => {
    const newItems: ShoppingItem[] = ingredients.map(ing => ({
      id: Math.random().toString(36).substr(2, 9),
      name: ing,
      completed: false,
      recipeName
    }));
    const updated = [...shoppingList, ...newItems];
    setShoppingList(updated);
    localStorage.setItem('recipegenius_shopping', JSON.stringify(updated));
    setShowToast("Added to shopping list!");
    setActiveTab('shopping');
  };

  const toggleShoppingItem = (id: string) => {
    const updated = shoppingList.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setShoppingList(updated);
  };

  const clearShoppingList = () => {
    setShoppingList([]);
    localStorage.setItem('recipegenius_shopping', JSON.stringify([]));
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setSelectedRecipe(null);
    setError(null);
    setActiveTab('home');
  };

  const openDeliveryApp = (app: 'zepto' | 'blinkit' | 'instamart') => {
    const urls = {
      zepto: 'https://www.zeptonow.com/',
      blinkit: 'https://blinkit.com/',
      instamart: 'https://www.swiggy.com/instamart'
    };
    window.open(urls[app], '_blank');
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;
    
    setIsSendingFeedback(true);
    
    const recipient = "wasshivam@gmail.com";
    const subject = encodeURIComponent(`RecipeGenius Feedback from ${user?.name || 'User'}`);
    const body = encodeURIComponent(feedbackMsg);
    
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;

    await new Promise(r => setTimeout(r, 800));
    setShowToast("Opening your email client...");
    setFeedbackMsg('');
    setIsSendingFeedback(false);
  };

  const getDifficultyBadge = (difficulty: string) => {
    const base = "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 ";
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return (
          <span className={base + "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40"}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Easy
          </span>
        );
      case 'medium':
        return (
          <span className={base + "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40"}>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Medium
          </span>
        );
      case 'hard':
        return (
          <span className={base + "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/40"}>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Hard
          </span>
        );
      default:
        return (
          <span className={base + "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}>
            {difficulty}
          </span>
        );
    }
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 animate-in fade-in duration-500">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white dark:bg-[#1c211c] rounded-2xl border border-gray-100 dark:border-[#2a302a] p-1 shadow-sm overflow-hidden">
          <div className="h-32 bg-gray-50 dark:bg-[#252a25] animate-pulse rounded-t-xl" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-100 dark:bg-[#252a25] w-1/4 rounded animate-pulse" />
            <div className="h-6 bg-gray-100 dark:bg-[#252a25] w-3/4 rounded animate-pulse" />
            <div className="h-4 bg-gray-100 dark:bg-[#252a25] w-1/2 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderDetail = () => {
    if (!selectedRecipe) return null;
    return (
      <div className="p-6 space-y-8 animate-in slide-in-from-right-12 duration-500">
        <button onClick={() => setSelectedRecipe(null)} className="flex items-center gap-2 text-gray-500 hover:text-[#111811] dark:hover:text-white transition-colors font-bold uppercase tracking-widest text-[10px]">
          <ChevronRight className="rotate-180" size={16} /> Back to results
        </button>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-[#111811] dark:text-white tracking-tight">{selectedRecipe.name}</h2>
            <div className="flex flex-wrap gap-3">
              {getDifficultyBadge(selectedRecipe.difficulty)}
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">{selectedRecipe.cuisine}</span>
              {selectedRecipe.isVeg && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">Vegetarian</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-[#1c211c] p-6 rounded-3xl border border-gray-100 dark:border-[#2a302a]">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2 dark:text-white">
                  <ShoppingBasket size={20} className="text-[#13ec13]" /> Ingredients
                </h3>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                      <div className="w-1.5 h-1.5 bg-[#13ec13] rounded-full" /> {ing}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => addToShoppingList(selectedRecipe.ingredients, selectedRecipe.name)}
                  className="w-full mt-6 py-3 bg-[#111811] dark:bg-[#13ec13] text-white dark:text-[#111811] rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/10"
                >
                  Add to Shopping List
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-[#1c211c] p-6 rounded-3xl border border-gray-100 dark:border-[#2a302a]">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2 dark:text-white">
                  <CookingPot size={20} className="text-[#13ec13]" /> Instructions
                </h3>
                <div className="space-y-4">
                  {selectedRecipe.instructions.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-[#13ec13] text-[#111811] flex items-center justify-center font-black text-sm">
                        {i + 1}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium pt-1">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleDownloadPDF(selectedRecipe)}
                  className="flex-1 py-3 border border-gray-200 dark:border-[#2a302a] rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252a25] transition-colors"
                >
                  <Download size={18} /> PDF
                </button>
                <button 
                  onClick={() => handleSaveRecipe(selectedRecipe)}
                  className="flex-1 py-3 border border-gray-200 dark:border-[#2a302a] rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252a25] transition-colors"
                >
                  <Bookmark size={18} /> Favorite
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHome = () => {
    return (
      <div className="animate-in fade-in duration-700 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-[#f0f4f0] dark:border-[#2a302a]">
          <div className="flex items-center gap-2">
            <span className="text-[#618961] dark:text-[#88b088] text-sm font-medium">Home</span>
            <span className="text-[#618961] dark:text-[#88b088] text-sm font-medium">/</span>
            <span className="text-[#111811] dark:text-white text-sm font-medium">Recipe Generator</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end">
               <span className="text-xs font-black text-[#111811] dark:text-white uppercase tracking-wider">{user?.name}</span>
               <span className="text-[10px] text-gray-400">{user?.email}</span>
             </div>
            <button className="p-2 rounded-lg bg-[#f0f4f0] dark:bg-[#2a302a] text-[#111811] dark:text-white hover:bg-[#dbe6db] dark:hover:bg-[#353b35] transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#13ec13] rounded-full"></span>
            </button>
          </div>
        </div>

        {!image && !isLoading && !result && (
          <div className="p-4 md:p-8 space-y-10">
            <div className="flex flex-col gap-6 bg-recipe-hero bg-cover bg-center bg-no-repeat rounded-3xl items-center justify-center p-8 text-white text-center min-h-[450px] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#111811]/20 group-hover:bg-[#111811]/10 transition-colors" />
              <h1 className="relative z-10 text-4xl md:text-6xl font-black leading-tight tracking-tighter">
                What's in your <span className="text-[#13ec13]">fridge?</span>
              </h1>
              <p className="relative z-10 max-w-[600px] text-base md:text-lg font-medium opacity-90 leading-relaxed">
                Take a photo of your ingredients and watch RecipeGenius craft the perfect gourmet meal for you in seconds.
              </p>
              <div className="relative z-10 flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center max-w-lg">
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="flex-1 flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-16 px-6 bg-[#13ec13] text-[#111811] text-lg font-black tracking-tight hover:scale-[1.02] active:scale-95 transition-all shadow-xl gap-3"
                >
                  <Camera size={24} />
                  <span>Snap Photo</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-16 px-6 bg-white/10 backdrop-blur-md border border-white/20 text-white text-lg font-black tracking-tight hover:bg-white/20 active:scale-95 transition-all shadow-xl gap-3"
                >
                  <Plus size={24} />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {(image || isLoading || result) && (
          <div className="flex flex-col lg:flex-row gap-8 p-4 md:p-6 animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex-1 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-[#111811] dark:text-white text-3xl font-black tracking-tighter">
                  {isLoading ? "Cooking up ideas..." : result ? "Your Gourmet Menu" : "Perfect Shot!"}
                </h2>
                {result && (
                  <button onClick={reset} className="text-sm font-bold text-gray-400 hover:text-[#111811] dark:hover:text-white flex items-center gap-1 transition-colors">
                    <Trash2 size={16} /> New Hunt
                  </button>
                )}
              </div>

              <div className="w-full bg-gray-50 dark:bg-[#1c211c] rounded-3xl border border-gray-100 dark:border-[#2a302a] overflow-hidden aspect-[16/9] relative group shadow-sm">
                {image ? (
                  <>
                    <img src={image} className="w-full h-full object-cover" alt="Ingredients" />
                    {isLoading && (
                      <div className="absolute inset-0 bg-[#111811]/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-6">
                        <div className="relative">
                           <Loader2 className="animate-spin text-[#13ec13]" size={64} />
                           <CookingPot size={24} className="absolute inset-0 m-auto text-white/50" />
                        </div>
                        <div className="text-center space-y-2">
                           <p className="text-xl font-black tracking-tight">{loadingStatus}</p>
                           <p className="text-sm opacity-60">Scanning ingredients with advanced computer vision...</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-gray-200 dark:text-[#2a302a]" size={64} />
                  </div>
                )}
              </div>
              
              {!result && !isLoading && (
                <div className="p-6 bg-gray-50 dark:bg-[#1c211c] rounded-3xl border border-gray-100 dark:border-[#2a302a] flex flex-col items-center gap-6 text-center">
                  <div className="space-y-1">
                    <p className="font-black text-[#111811] dark:text-white text-lg">Looks good!</p>
                    <p className="text-sm text-gray-500">We'll identify everything and create your meal plan.</p>
                  </div>
                  <button 
                    onClick={handleProcess} 
                    className="w-full h-14 bg-[#111811] dark:bg-[#13ec13] text-white dark:text-[#111811] rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-[#11e011] active:scale-[0.98] transition-all group shadow-xl shadow-black/10"
                  >
                    Analyze Ingredients
                  </button>
                </div>
              )}

              {result && !isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                  {result.recipes.map((recipe) => (
                    <div 
                      key={recipe.id}
                      onClick={() => setSelectedRecipe(recipe)}
                      className="cursor-pointer group bg-white dark:bg-[#1c211c] rounded-2xl border border-gray-100 dark:border-[#2a302a] p-1 shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          {getDifficultyBadge(recipe.difficulty)}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSaveRecipe(recipe); }}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-rose-500 transition-colors"
                          >
                            <Bookmark size={18} className={savedRecipes.some(r => r.id === recipe.id) ? "fill-rose-500 text-rose-500" : ""} />
                          </button>
                        </div>
                        <h3 className="text-xl font-black text-[#111811] dark:text-white group-hover:text-[#13ec13] transition-colors line-clamp-2">{recipe.name}</h3>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                          <div className="flex items-center gap-1"><Clock size={14} /> {recipe.cookTime}</div>
                          <div className="flex items-center gap-1"><Flame size={14} /> {recipe.calories}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSaved = () => (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-[#111811] dark:text-white tracking-tight">Saved Recipes</h2>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{savedRecipes.length} Items</span>
      </div>
      {savedRecipes.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 dark:bg-[#1c211c] rounded-full flex items-center justify-center text-gray-300">
            <Bookmark size={32} />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-gray-500 dark:text-gray-400">No favorites yet</p>
            <p className="text-sm text-gray-400">Recipes you save will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedRecipes.map(recipe => (
            <div key={recipe.id} onClick={() => setSelectedRecipe(recipe)} className="cursor-pointer bg-white dark:bg-[#1c211c] rounded-2xl border border-gray-100 dark:border-[#2a302a] p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                 {getDifficultyBadge(recipe.difficulty)}
                 <button onClick={(e) => { e.stopPropagation(); removeSavedRecipe(recipe.id); }} className="text-gray-300 hover:text-red-500 transition-colors">
                   <Trash2 size={18} />
                 </button>
              </div>
              <h3 className="text-lg font-black dark:text-white mb-2">{recipe.name}</h3>
              <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                <span>{recipe.cuisine}</span>
                <span>{recipe.calories}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderExplore = () => (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 min-h-full">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-[#111811] dark:text-white tracking-tight">Discover Genius</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Search anything you crave and let AI craft the recipe.</p>
      </div>

      <form onSubmit={handleExploreSearch} className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <SearchIcon className="text-gray-400 group-focus-within:text-[#13ec13] transition-colors" size={20} />
        </div>
        <input 
          type="text"
          value={exploreSearchQuery}
          onChange={(e) => setExploreSearchQuery(e.target.value)}
          placeholder="Try 'Spicy keto salmon' or 'Easy vegan pasta'..."
          className="w-full h-16 pl-14 pr-32 rounded-2xl bg-gray-50 dark:bg-[#1c211c] border-2 border-transparent focus:border-[#13ec13] focus:bg-white dark:focus:bg-[#111811] outline-none transition-all dark:text-white font-medium"
        />
        <button 
          type="submit"
          disabled={isExploring}
          className="absolute right-2 top-2 bottom-2 px-6 bg-[#111811] dark:bg-[#13ec13] text-white dark:text-[#111811] rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-[0.98] active:scale-95 transition-all disabled:opacity-50"
        >
          {isExploring ? <Loader2 className="animate-spin" size={16} /> : <><Sparkles size={16} /> Search</>}
        </button>
      </form>

      {isExploring && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="animate-spin text-[#13ec13]" size={40} />
          <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-widest">Genius is thinking...</p>
        </div>
      )}

      {!isExploring && exploreResult && (
        <div className="space-y-6 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {exploreSearchQuery ? `Custom results for "${exploreSearchQuery}"` : 'Trending Now'}
            </h3>
            <button onClick={fetchExploreData} className="p-2 text-gray-400 hover:text-[#13ec13] transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exploreResult.recipes.map(recipe => (
              <div key={recipe.id} onClick={() => setSelectedRecipe(recipe)} className="cursor-pointer group bg-white dark:bg-[#1c211c] rounded-2xl border border-gray-100 dark:border-[#2a302a] p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  {getDifficultyBadge(recipe.difficulty)}
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{recipe.cuisine}</div>
                </div>
                <h3 className="text-lg font-black dark:text-white mb-2 group-hover:text-[#13ec13] transition-colors">{recipe.name}</h3>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={14} /> {recipe.cookTime}</span>
                    <span className="flex items-center gap-1"><Flame size={14} /> {recipe.calories}</span>
                  </div>
                  <ChevronRight size={18} className="text-[#13ec13] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isExploring && !exploreResult && renderSkeleton()}
    </div>
  );

  const renderShopping = () => (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-[#111811] dark:text-white tracking-tight">Shopping List</h2>
        <button onClick={clearShoppingList} className="text-xs font-bold text-red-500 uppercase tracking-widest hover:underline">Clear All</button>
      </div>

      <div className="space-y-4">
        {shoppingList.length === 0 ? (
          <div className="py-12 text-center text-gray-400 font-medium">Your list is empty. Add ingredients from any recipe!</div>
        ) : (
          <div className="bg-white dark:bg-[#1c211c] rounded-3xl border border-gray-100 dark:border-[#2a302a] overflow-hidden">
            {shoppingList.map((item) => (
              <div key={item.id} className={`flex items-center justify-between p-4 border-b border-gray-50 dark:border-[#2a302a] last:border-0 ${item.completed ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleShoppingItem(item.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-[#13ec13] border-[#13ec13]' : 'border-gray-200 dark:border-[#353b35]'}`}>
                    {item.completed && <CheckCircle2 size={14} className="text-white" />}
                  </button>
                  <div>
                    <p className={`text-sm font-bold dark:text-white ${item.completed ? 'line-through' : ''}`}>{item.name}</p>
                    {item.recipeName && <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.recipeName}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black dark:text-white">Order Delivery</h3>
        <div className="grid grid-cols-3 gap-3">
          {['zepto', 'blinkit', 'instamart'].map(app => (
            <button key={app} onClick={() => openDeliveryApp(app as any)} className="py-3 bg-gray-50 dark:bg-[#1c211c] rounded-xl border border-gray-100 dark:border-[#2a302a] text-[10px] font-black uppercase tracking-widest dark:text-white hover:bg-[#13ec13] hover:text-[#111811] hover:border-[#13ec13] transition-all capitalize">
              {app}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black dark:text-white">Nearby Stores</h3>
          <button onClick={handleGetNearbyStores} className="p-2 text-[#13ec13]"><RefreshCw size={18} className={isLocating ? 'animate-spin' : ''} /></button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {nearbyStores.map((store, i) => (
            <a key={i} href={store.uri} target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 dark:bg-[#1c211c] rounded-xl border border-gray-100 dark:border-[#2a302a] flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-[#13ec13]" />
                <span className="text-sm font-bold dark:text-white">{store.name}</span>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#13ec13]" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-[#111811] dark:text-white tracking-tight">Feedback</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium">We'd love to hear how we can make RecipeGenius better for you.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={handleFeedbackSubmit} className="space-y-6 bg-gray-50 dark:bg-[#1c211c] p-8 rounded-3xl border border-gray-100 dark:border-gray-800">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Your Message</label>
              <textarea 
                value={feedbackMsg}
                onChange={(e) => setFeedbackMsg(e.target.value)}
                placeholder="Share your thoughts, report a bug, or suggest a new feature..."
                className="w-full h-40 bg-white dark:bg-[#111811] border-2 border-transparent focus:border-[#13ec13] rounded-2xl p-4 text-sm font-medium outline-none transition-all dark:text-white"
              />
            </div>
            <button 
              type="submit"
              disabled={isSendingFeedback || !feedbackMsg.trim()}
              className="w-full h-14 bg-[#111811] dark:bg-[#13ec13] text-white dark:text-[#111811] rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-[#11e011] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl"
            >
              {isSendingFeedback ? <Loader2 className="animate-spin" size={24} /> : (
                <>
                  <span>Send Feedback</span>
                  <Send size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/40">
            <h3 className="font-black text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
              <Mail size={18} /> Direct Support
            </h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-500/80 font-medium mb-4">Have specific issues or business inquiries? Use the feedback form to reach our dev team directly.</p>
            <div className="text-xs font-bold text-emerald-900/60 dark:text-emerald-300/60 uppercase tracking-widest">
               Response time: ~24 hours
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-[#1c211c] p-6 rounded-3xl border border-gray-100 dark:border-[#2a302a]">
            <h3 className="font-black dark:text-white mb-2">Our Mission</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">To empower everyone to cook healthy, gourmet meals using the power of AI vision and personalized nutrition.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-6 space-y-10 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-[#111811] dark:text-white tracking-tight">Settings</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Dietary Profile</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(DietaryPreference).map(pref => (
              <button 
                key={pref}
                onClick={() => setPreference(pref)}
                className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${preference === pref ? 'bg-[#111811] border-[#111811] text-[#13ec13]' : 'bg-gray-50 dark:bg-[#1c211c] border-transparent text-gray-400 dark:text-gray-500 hover:border-gray-200 dark:hover:border-[#353b35]'}`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Appearance</label>
          <button onClick={toggleDarkMode} className="w-full h-14 bg-gray-50 dark:bg-[#1c211c] rounded-2xl flex items-center justify-between px-6 border border-gray-100 dark:border-[#2a302a]">
            <span className="text-sm font-bold dark:text-white">Dark Mode</span>
            {isDarkMode ? <Moon size={20} className="text-[#13ec13]" /> : <Sun size={20} className="text-amber-500" />}
          </button>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-[#2a302a]">
          <button onClick={handleLogout} className="w-full h-14 border-2 border-rose-100 dark:border-rose-900/20 text-rose-500 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all">
            Log Out Account
          </button>
        </div>
      </div>
    </div>
  );

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onUploadClick={() => { setActiveTab('home'); reset(); }}
    >
      <div className="flex-1 min-h-screen">
        {selectedRecipe ? (
          renderDetail()
        ) : (
          <>
            {activeTab === 'home' && renderHome()}
            {activeTab === 'saved' && renderSaved()}
            {activeTab === 'explore' && renderExplore()}
            {activeTab === 'shopping' && renderShopping()}
            {activeTab === 'feedback' && renderFeedback()}
            {activeTab === 'settings' && renderSettings()}
          </>
        )}
      </div>

      {isCameraOpen && <CameraCapture onCapture={handleImageSelection} onClose={() => setIsCameraOpen(false)} />}
      
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-[#111811] text-[#13ec13] px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 size={16} />
          {showToast}
        </div>
      )}

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-rose-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-2 hover:opacity-50"><X size={14} /></button>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageChange} 
        accept="image/*" 
        className="hidden" 
      />
    </Layout>
  );
};

export default App;