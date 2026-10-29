import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function HeaderControls() {
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="header-controls">
      <div className="language-box">
        <label htmlFor="language-select" className="sr-only">
          {t("language")}
        </label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="language-select"
          aria-label="Select language"
        >
          <option value="rw">{t("kinyarwanda")}</option>
          <option value="en">{t("english")}</option>
          <option value="fr">{t("french")}</option>
        </select>
      </div>

      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <i className="bi bi-sun-fill" /> : <i className="bi bi-moon-fill" />}
      </button>
    </div>
  );
}
