'use client';

import { useState, useEffect, useCallback } from 'react';

const PIN_STORAGE_KEY = 'mydreams_pin_hash';
const PIN_UNLOCKED_KEY = 'mydreams_unlocked';

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'mydreams_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getPinHash(): string | null {
  return localStorage.getItem(PIN_STORAGE_KEY);
}

function isUnlocked(): boolean {
  return sessionStorage.getItem(PIN_UNLOCKED_KEY) === 'true';
}

interface Props {
  children: React.ReactNode;
}

export default function PinLock({ children }: Props) {
  const [state, setState] = useState<'loading' | 'locked' | 'unlocked' | 'no-pin'>('loading');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = getPinHash();
    if (!stored) {
      setState('no-pin');
    } else if (isUnlocked()) {
      setState('unlocked');
    } else {
      setState('locked');
    }
  }, []);

  const handleDigit = useCallback((digit: string) => {
    setError('');
    setPin((prev) => {
      const newPin = prev + digit;
      if (newPin.length === 4) {
        // Verify
        hashPin(newPin).then((hash) => {
          if (hash === getPinHash()) {
            sessionStorage.setItem(PIN_UNLOCKED_KEY, 'true');
            setState('unlocked');
          } else {
            setError('Неверный PIN');
          }
          setPin('');
        });
      }
      return newPin.length <= 4 ? newPin : prev;
    });
  }, []);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'unlocked' || state === 'no-pin') {
    return <>{children}</>;
  }

  // Locked state - show PIN entry
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8">
      <div className="text-5xl mb-6">🔒</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">MyDreams</h2>
      <p className="text-sm text-gray-400 mb-8">Введите PIN-код</p>

      {/* PIN dots */}
      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < pin.length ? 'bg-indigo-600 scale-110' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="text-red-500 text-sm font-medium mb-4 animate-pulse">{error}</div>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
          if (key === '') return <div key="empty" />;
          if (key === 'del') {
            return (
              <button
                key="del"
                onClick={handleDelete}
                className="h-16 rounded-2xl flex items-center justify-center text-xl text-gray-500 active:bg-gray-100 transition-colors"
              >
                &#9003;
              </button>
            );
          }
          return (
            <button
              key={key}
              onClick={() => handleDigit(key)}
              className="h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl font-medium text-gray-900 active:bg-indigo-100 transition-colors"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Exported functions for settings page
export async function setAppPin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  localStorage.setItem(PIN_STORAGE_KEY, hash);
  sessionStorage.setItem(PIN_UNLOCKED_KEY, 'true');
}

export function removeAppPin(): void {
  localStorage.removeItem(PIN_STORAGE_KEY);
  sessionStorage.removeItem(PIN_UNLOCKED_KEY);
}

export function hasPin(): boolean {
  return !!localStorage.getItem(PIN_STORAGE_KEY);
}
