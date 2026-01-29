import { useCallback, useEffect, useState } from 'react';
import { soundManager } from '../lib/soundManager';
import type { SoundType } from '../lib/soundManager';

export function useSoundManager() {
  const [muted, setMuted] = useState(soundManager.muted);
  const [volume, setVolumeState] = useState(soundManager.volume);

  useEffect(() => {
    return soundManager.subscribe(() => {
      setMuted(soundManager.muted);
      setVolumeState(soundManager.volume);
    });
  }, []);

  const playSound = useCallback((type: SoundType) => {
    soundManager.play(type);
  }, []);

  const toggleMute = useCallback(() => {
    soundManager.toggleMute();
  }, []);

  const setVolume = useCallback((v: number) => {
    soundManager.setVolume(v);
  }, []);

  return { playSound, toggleMute, setVolume, muted, volume };
}
