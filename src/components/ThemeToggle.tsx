import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils'; // Import cn utility for merging classes
interface ThemeToggleProps {
  className?: string;
}
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className={cn(className, "text-xl hover:scale-110 hover:rotate-12 transition-all duration-200 active:scale-90 z-50")}
    >
      {isDark ? '☀️' : '🌙'}
    </Button>
  );
}