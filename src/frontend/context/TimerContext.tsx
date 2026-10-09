'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

/**
 * TimerContext provides a global state for the Deep Focus timer and stopwatch.
 * The state is persisted to localStorage so that the timer continues running
 * across page navigation and browser reloads.
 */
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
  // No‑op setters – will be overwritten by the provider
  setTimerMode: () => {},
  setTotalSeconds: () => {},
  setSecondsLeft: () => {},
  setTimerRunning: () => {},
  setCustomMinutes: () => {},
  setSoundEnabled: () => {},
  setStopwatchRunning: () => {},
  setStopwatchSeconds: () => {},
};

export const TimerContext = createContext<TimerContextProps>(defaultState);

interface ProviderProps {
  children: ReactNode;
}

export const TimerProvider: React.FC<ProviderProps> = ({ children }) => {
  const [timerMode, setTimerMode] = useState<TimerState['timerMode']>('pomodoro');
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(45);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  // Load persisted state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('timer_state');
      if (saved) {
        const data = JSON.parse(saved) as Partial<TimerState>;
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
  }, []);

  // Persist on any change
  useEffect(() => {
    const payload: TimerState = {
      timerMode,
      totalSeconds,
      secondsLeft,
      timerRunning,
      customMinutes,
      soundEnabled,
      stopwatchRunning,
      stopwatchSeconds,
    };
    try {
      localStorage.setItem('timer_state', JSON.stringify(payload));
    } catch {}
  }, [
    timerMode,
    totalSeconds,
    secondsLeft,
    timerRunning,
    customMinutes,
    soundEnabled,
    stopwatchRunning,
    stopwatchSeconds,
  ]);

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
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};
