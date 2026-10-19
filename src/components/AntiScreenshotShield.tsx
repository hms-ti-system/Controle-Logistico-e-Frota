import React, { useEffect, useState } from 'react';

interface AntiScreenshotShieldProps {
  children: React.ReactNode;
  enabled: boolean;
}

export const AntiScreenshotShield: React.FC<AntiScreenshotShieldProps> = ({ children, enabled }) => {
  const [shieldActive, setShieldActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const clearClipboardSilently = () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('');
        }
      } catch {
        // silently ignore
      }
    };

    const triggerTemporaryShield = () => {
      setShieldActive(true);
      clearClipboardSilently();
      setTimeout(() => {
        setShieldActive(false);
      }, 500);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        triggerTemporaryShield();
        return false;
      }

      // Ctrl+P / Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        triggerTemporaryShield();
        return false;
      }

      // Ctrl+Shift+S / Cmd+Shift+S (Snipping tool)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerTemporaryShield();
        return false;
      }

      // Mac Cmd+Shift+3 or 4
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) {
        e.preventDefault();
        triggerTemporaryShield();
        return false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        clearClipboardSilently();
      }
    };

    // Prevent context menu (right click save/inspect)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [enabled]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative select-none print:hidden">
      {/* Temporary blackout curtain if screenshot key was pressed */}
      {shieldActive && (
        <div className="fixed inset-0 z-[200] bg-black" aria-hidden="true" />
      )}

      {/* Main child content - always remains clickable */}
      <div>{children}</div>
    </div>
  );
};

