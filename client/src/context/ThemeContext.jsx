import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Vérifier s'il y a un thème sauvegardé
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark'; // Le thème par défaut est dark (sombre)
  });

  useEffect(() => {
    const root = document.documentElement; // Accès à la balise <html>
    
    // Mettre à jour la classe sur le root en fonction du thème
    if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
    }
    
    // Sauvegarder dans le localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme doit être utilisé à l'intérieur d'un ThemeProvider");
  }
  return context;
}
