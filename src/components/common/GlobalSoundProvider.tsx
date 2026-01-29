import { useEffect } from 'react';
import { soundManager } from '../../lib/soundManager';

export default function GlobalSoundProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleMouseEnter = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-sound]');
      if (!target) return;
      const sound = target.getAttribute('data-sound');
      if (sound === 'hover') {
        soundManager.play('hover');
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-sound]');
      if (!target) return;
      const sound = target.getAttribute('data-sound');
      if (sound === 'click') {
        soundManager.play('click');
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return <>{children}</>;
}
