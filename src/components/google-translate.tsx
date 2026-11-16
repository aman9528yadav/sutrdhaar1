"use client";

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export function GoogleTranslate() {
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { 
            pageLanguage: 'en', 
            autoDisplay: false,
        },
        'google_translate_element'
      );
    };
  }, []);

  return (
    <>
      <div id="google_translate_element" style={{ display: 'none', visibility: 'hidden', height: 0, overflow: 'hidden' }}></div>
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
