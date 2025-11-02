import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const ThemeButton = (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-full dark:bg-white/5 bg-gray-800 transition-all duration-300 shadow-lg backdrop-blur-sm"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="text-white text-xl" />
      ) : (
        <Moon className="text-white my-auto text-xl" />
      )}
    </button>
  );
  return ThemeButton;
};

export default ThemeToggle;
