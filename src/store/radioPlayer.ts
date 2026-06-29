'use client';

import { create } from 'zustand';
import { RADIO_CONNECT_TIMEOUT_MS, RADIO_STREAM_URL } from '@/lib/radio';

export type RadioPlayerStatus = 'idle' | 'connecting' | 'playing' | 'error';

interface RadioPlayerState {
  status: RadioPlayerStatus;
  play: () => Promise<void>;
  stop: (next?: RadioPlayerStatus) => void;
}

let audio: HTMLAudioElement | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function clearConnectTimer(): void {
  if (!timer) return;
  clearTimeout(timer);
  timer = null;
}

function ensureAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (audio) return audio;
  audio = new Audio();
  audio.preload = 'none';
  audio.addEventListener('playing', () => {
    clearConnectTimer();
    useRadioPlayerStore.setState({ status: 'playing' });
  });
  audio.addEventListener('error', () => stopRadio('error'));
  return audio;
}

function stopRadio(next: RadioPlayerStatus = 'idle'): void {
  clearConnectTimer();
  if (audio) {
    audio.pause();
    audio.src = '';
    audio.load();
  }
  useRadioPlayerStore.setState({ status: next });
}

export const useRadioPlayerStore = create<RadioPlayerState>((set, get) => ({
  status: 'idle',

  play: async () => {
    if (get().status === 'connecting' || get().status === 'playing') return;
    const player = ensureAudio();
    if (!player) return;
    try {
      set({ status: 'connecting' });
      player.src = RADIO_STREAM_URL;
      player.load();
      clearConnectTimer();
      timer = setTimeout(() => stopRadio('error'), RADIO_CONNECT_TIMEOUT_MS);
      await player.play();
    } catch {
      stopRadio('error');
    }
  },

  stop: (next = 'idle') => stopRadio(next),
}));
