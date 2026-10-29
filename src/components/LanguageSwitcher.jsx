import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, changeLanguage, t } = useLanguage();

  return (
    <div className="language-switcher">
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="language-select"
        aria-label="Select language"
      >
        <option value="en">{t("english")}</option>
        <option value="fr">{t("french")}</option>
        <option value="rw">{t("kinyarwanda")}</option>
      </select>
    </div>
  );
}
