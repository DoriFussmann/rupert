"use client";
import { useEffect, useState } from 'react';
import NavigationHeader from './components/NavigationHeader';

export default function Home() {
  useEffect(() => {
    // Create a style element to forcefully hide the layout header
    const styleElement = document.createElement('style');
    styleElement.id = 'hide-layout-header';
    styleElement.textContent = `
      body > header {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      // Remove the style element when leaving the page
      const styleElement = document.getElementById('hide-layout-header');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // Typewriter state
  const words: string[] = ["create", "build", "design", "prompt", "model"];
  const colorMap: Record<string, string> = {
    create: "text-blue-600",
    build: "text-green-600",
    design: "text-purple-600",
    prompt: "text-orange-600",
    model: "text-rose-600",
  };
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    const currentWord = words[wordIndex];

    // Adjust speed
    let delay = isDeleting ? 60 : 100;

    // Hold when fully typed
    if (!isDeleting && charIndex === currentWord.length) {
      const hold = setTimeout(() => setIsDeleting(true), 900);
      return () => clearTimeout(hold);
    }

    // Move to next word after deleting
    if (isDeleting && charIndex === 0) {
      const pause = setTimeout(() => {
        setIsDeleting(false);
        setWordIndex((idx) => (idx + 1) % words.length);
      }, 400);
      return () => clearTimeout(pause);
    }

    const timer = setTimeout(() => {
      const nextIndex = isDeleting ? charIndex - 1 : charIndex + 1;
      setCharIndex(nextIndex);
      setDisplayedText(currentWord.slice(0, nextIndex));
    }, delay);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, wordIndex]);

  return (
    <>
      <NavigationHeader />
      <div style={{ paddingTop: 'calc(2.25rem + 1rem)' }}>
        <div className="pt-24 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
            {/* Left: Headline with typewriter */}
            <div className="pl-0 ml-0 md:col-span-3">
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-extralight text-gray-900 leading-tight"
                style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto' }}
              >
                What would you like the power to{' '}
                <span className={`${colorMap[words[wordIndex]]} transition-colors duration-200`}>
                  {displayedText}
                </span>
                <span className="ml-1 align-middle inline-block w-[2px] h-[1.1em] bg-gray-900 opacity-75 animate-pulse" />
              </h1>
            </div>

            {/* Right: Placeholder image */}
            <div className="md:col-span-1 flex items-center justify-end">
              <div className="w-full h-64 md:h-80 bg-gray-100 border border-gray-200 rounded-md shadow-inner flex items-center justify-center text-gray-400">
                Placeholder Image
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
