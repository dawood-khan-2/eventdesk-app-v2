"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Tawk_API?: {
      onLoad?: () => void;
    };
  }
}

/**
 * Controls Tawk.to chat widget visibility based on sheet state.
 * Hides the widget when sheets are open to prevent overlay conflicts.
 */
export function TawkVisibilityController() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [tawkLoaded, setTawkLoaded] = useState(false);
  const [tawkWidgetElement, setTawkWidgetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const checkTawkAPI = () => {
      if (window.Tawk_API) {
        window.Tawk_API.onLoad = function() {
          let attempts = 0;
          const maxAttempts = 20;
          
          const findWidget = () => {
            attempts++;
            
            const iframes = document.querySelectorAll('iframe');
            let tawkIframe: HTMLElement | null = null;
            
            for (const iframe of iframes) {
              const style = window.getComputedStyle(iframe);
              if (style.position === 'fixed' && style.bottom === '20px' && style.right === '20px') {
                tawkIframe = iframe as HTMLElement;
                break;
              }
            }
            
            if (tawkIframe) {
              setTawkWidgetElement(tawkIframe);
              setTawkLoaded(true);
            } else if (attempts < maxAttempts) {
              setTimeout(findWidget, 100);
            }
          };
          
          findWidget();
        };
      }
    };
    
    checkTawkAPI();
    const interval = setInterval(checkTawkAPI, 500);
    
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!tawkLoaded || !tawkWidgetElement) return;

    const toggleTawkWidget = (hide: boolean) => {
      if (tawkWidgetElement) {
        tawkWidgetElement.style.setProperty('opacity', hide ? '0' : '1', 'important');
        tawkWidgetElement.style.setProperty('pointer-events', hide ? 'none' : 'auto', 'important');
        tawkWidgetElement.style.setProperty('transition', 'opacity 200ms ease-in-out', 'important');
      }
    };
    
    const checkForOpenSheets = () => {
      const openSheet = document.querySelector('[data-state="open"][role="dialog"]');
      const newSheetState = !!openSheet;
      
      if (newSheetState !== isSheetOpen) {
        setIsSheetOpen(newSheetState);
        toggleTawkWidget(newSheetState);
      }
    };

    checkForOpenSheets();

    const observer = new MutationObserver(checkForOpenSheets);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    });

    return () => observer.disconnect();
  }, [tawkLoaded, tawkWidgetElement, isSheetOpen]);

  return null;
}
