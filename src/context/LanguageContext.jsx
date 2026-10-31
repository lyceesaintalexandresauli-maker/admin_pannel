import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const translations = {
  en: {
    home: "Home",
    events: "Events",
    announcements: "Announcements",
    trainers: "Trainers",
    contact: "Contact",
    about: "About",
    academic: "Academic",
    gallery: "Gallery",
    login: "Login",
    timetables: "Timetables",
    language: "Language",
    english: "English",
    french: "Français",
    kinyarwanda: "Kinyarwanda",
  },
  fr: {
    home: "Accueil",
    events: "Événements",
    announcements: "Annonces",
    trainers: "Formateurs",
    contact: "Contact",
    about: "À propos",
    academic: "Académique",
    gallery: "Galerie",
    login: "Connexion",
    timetables: "Horaires",
    language: "Langue",
    english: "English",
    french: "Français",
    kinyarwanda: "Kinyarwanda",
  },
  rw: {
    home: "Inzira",
    events: "Ibiganiro",
    announcements: "Imbatangazo",
    trainers: "Abigisha",
    contact: "Kurikirana",
    about: "Ibyerekeye",
    academic: "Akademike",
    gallery: "Galeri",
    login: "Injira",
    timetables: "Iragutse ry'igihe",
    language: "Ururimi",
    english: "English",
    french: "Français",
    kinyarwanda: "Kinyarwanda",
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem("language");
    return savedLanguage || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
