'use client';

import React, { createContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';

export interface TimerState {
  timerMode: 'pomodoro' | 'deep' | 'shortBreak' | 'longBreak' | 'custom';
  totalSeconds: number;
  secondsLeft: number;
  timerRunning: boolean;
  customMinutes: number;
  soundEnabled: boolean;
  stopwatchRunning: boolean;
  stopwatchSeconds: number;
}

export interface TimerContextProps extends TimerState {
  setTimerMode: (mode: TimerState['timerMode']) => void;
  setTotalSeconds: (sec: number) => void;
  setSecondsLeft: (sec: number) => void;
  setTimerRunning: (running: boolean) => void;
  setCustomMinutes: (mins: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setStopwatchRunning: (running: boolean) => void;
  setStopwatchSeconds: (sec: number) => void;
  toggleTimer: () => void;
  selectMode: (mode: TimerState['timerMode']) => void;
  changeCustom: (mins: number) => void;
  toggleSound: () => void;
  toggleStopwatch: () => void;
  resetStopwatch: () => void;
  resetTimer: () => void;
  playAlertSound: () => void;
}

const defaultState: TimerContextProps = {
  timerMode: 'pomodoro',
  totalSeconds: 25 * 60,
  secondsLeft: 25 * 60,
  timerRunning: false,
  customMinutes: 45,
  soundEnabled: true,
  stopwatchRunning: false,
  stopwatchSeconds: 0,
  setTimerMode: () => {},
  setTotalSeconds: () => {},
  setSecondsLeft: () => {},
  setTimerRunning: () => {},
  setCustomMinutes: () => {},
  setSoundEnabled: () => {},
  setStopwatchRunning: () => {},
  setStopwatchSeconds: () => {},
  toggleTimer: () => {},
  selectMode: () => {},
  changeCustom: () => {},
  toggleSound: () => {},
  toggleStopwatch: () => {},
  resetStopwatch: () => {},
  resetTimer: () => {},
  playAlertSound: () => {},
};

export const TimerContext = createContext<TimerContextProps>(defaultState);

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timerMode, setTimerMode] = useState<TimerState['timerMode']>('pomodoro');
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<number>(45);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [stopwatchRunning, setStopwatchRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize sound safely
  useEffect(() => {
    try {
      audioRef.current = new Audio('/alert.mp3');
    } catch {}
  }, []);

  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          triggerBeep();
        });
      } else {
        triggerBeep();
      }
    } catch {
      triggerBeep();
    }
  }, [soundEnabled]);

  const triggerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  };

  // 1. Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('timer_state_v2');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.timerMode) setTimerMode(data.timerMode);
        if (typeof data.totalSeconds === 'number') setTotalSeconds(data.totalSeconds);
        if (typeof data.secondsLeft === 'number') setSecondsLeft(data.secondsLeft);
        if (typeof data.timerRunning === 'boolean') setTimerRunning(data.timerRunning);
        if (typeof data.customMinutes === 'number') setCustomMinutes(data.customMinutes);
        if (typeof data.soundEnabled === 'boolean') setSoundEnabled(data.soundEnabled);
        if (typeof data.stopwatchRunning === 'boolean') setStopwatchRunning(data.stopwatchRunning);
        if (typeof data.stopwatchSeconds === 'number') setStopwatchSeconds(data.stopwatchSeconds);
      }
    } catch {}
    setIsLoaded(true);
  }, []);

  // 2. Persist state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const payload = {
        timerMode,
        totalSeconds,
        secondsLeft,
        timerRunning,
        customMinutes,
        soundEnabled,
        stopwatchRunning,
        stopwatchSeconds,
      };
      localStorage.setItem('timer_state_v2', JSON.stringify(payload));
    } catch {}
  }, [
    isLoaded,
    timerMode,
    totalSeconds,
    secondsLeft,
    timerRunning,
    customMinutes,
    soundEnabled,
    stopwatchRunning,
    stopwatchSeconds,
  ]);

  // 3. GLOBAL BACKGROUND INTERVAL: Timer countdown (Runs anywhere in the app)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            playAlertSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, playAlertSound]);

  // 4. GLOBAL BACKGROUND INTERVAL: Stopwatch (Runs anywhere in the app)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (stopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stopwatchRunning]);

  // Helper Actions
  const toggleTimer = useCallback(() => {
    setTimerRunning(prev => !prev);
  }, []);

  const selectMode = useCallback((mode: TimerState['timerMode']) => {
    setTimerRunning(false);
    setTimerMode(mode);
    let sec = 25 * 60;
    if (mode === 'pomodoro') sec = 25 * 60;
    else if (mode === 'deep') sec = 50 * 60;
    else if (mode === 'shortBreak') sec = 5 * 60;
    else if (mode === 'longBreak') sec = 15 * 60;
    else if (mode === 'custom') sec = (customMinutes || 45) * 60;
    setTotalSeconds(sec);
    setSecondsLeft(sec);
  }, [customMinutes]);

  const changeCustom = useCallback((mins: number) => {
    setCustomMinutes(mins);
    if (timerMode === 'custom') {
      setTotalSeconds(mins * 60);
      setSecondsLeft(mins * 60);
    }
  }, [timerMode]);

  const resetTimer = useCallback(() => {
    setTimerRunning(false);
    selectMode(timerMode);
  }, [selectMode, timerMode]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  const toggleStopwatch = useCallback(() => {
    setStopwatchRunning(prev => !prev);
  }, []);

  const resetStopwatch = useCallback(() => {
    setStopwatchRunning(false);
    setStopwatchSeconds(0);
  }, []);

  const value: TimerContextProps = {
    timerMode,
    totalSeconds,
    secondsLeft,
    timerRunning,
    customMinutes,
    soundEnabled,
    stopwatchRunning,
    stopwatchSeconds,
    setTimerMode,
    setTotalSeconds,
    setSecondsLeft,
    setTimerRunning,
    setCustomMinutes,
    setSoundEnabled,
    setStopwatchRunning,
    setStopwatchSeconds,
    toggleTimer,
    selectMode,
    changeCustom,
    toggleSound,
    toggleStopwatch,
    resetStopwatch,
    resetTimer,
    playAlertSound,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};
