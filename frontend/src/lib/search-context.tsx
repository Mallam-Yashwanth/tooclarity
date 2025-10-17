"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchInPage: (query: string) => void;
  clearSearch: () => void;
  isSearchActive: boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const pathname = usePathname();
  const lastRunRef = useRef<number>(0);
  const pendingRef = useRef<number | null>(null);

  // Debounced, animation-frame scheduled search to avoid jank
  const runSearch = useCallback((q: string) => {
    if (!q.trim()) {
      clearSearch();
      return;
    }

    setSearchQuery(q);
    setIsSearchActive(true);

    // Get all text nodes from the current page (avoid inputs, scripts, styles)
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
          if (['input','textarea','select','option','button'].includes(tagName)) return NodeFilter.FILTER_REJECT;
          
          // Only include nodes with meaningful text
          return node.textContent && node.textContent.trim().length > 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    // Clear previous highlights
    clearHighlights();

    // Search and highlight matches
    const searchTerm = q.toLowerCase();
    let matchCount = 0;

    textNodes.forEach((textNode) => {
      const text = textNode.textContent || '';
      const lowerText = text.toLowerCase();
      let from = 0;
      while (true) {
        const idx = lowerText.indexOf(searchTerm, from);
        if (idx === -1) break;
        // Split the text node into [before][match][after] using Range to preserve layout
        const range = document.createRange();
        range.setStart(textNode, idx);
        range.setEnd(textNode, idx + searchTerm.length);
        const span = document.createElement('span');
        span.className = 'search-highlight bg-yellow-200 dark:bg-yellow-600 px-1 rounded';
        try {
          range.surroundContents(span);
          matchCount++;
        } catch {}
        from = idx + searchTerm.length;
      }
    });

    // Scroll to first match
    const firstMatch = document.querySelector('.search-highlight');
    if (firstMatch) {
      firstMatch.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Add a temporary focus effect
      firstMatch.classList.add('search-highlight-focus');
      setTimeout(() => {
        firstMatch.classList.remove('search-highlight-focus');
      }, 2000);
    }

    // Show search results info
    if (matchCount > 0) {
      showSearchResults(matchCount);
    } else {
      showNoResults();
    }
  }, []);

  const searchInPage = useCallback((query: string) => {
    const now = performance.now();
    // 120ms debounce window
    if (pendingRef.current) cancelAnimationFrame(pendingRef.current);
    pendingRef.current = requestAnimationFrame(() => {
      if (performance.now() - lastRunRef.current < 120) return;
      lastRunRef.current = performance.now();
      runSearch(query);
    });
  }, [runSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearchActive(false);
    clearHighlights();
    hideSearchResults();
  }, []);

  return (
    <SearchContext.Provider value={{
      searchQuery,
      setSearchQuery,
      searchInPage,
      clearSearch,
      isSearchActive
    }}>
      {children}
    </SearchContext.Provider>
  );
};

// Helper functions
// Deprecated helper retained for backward compat (unused by new flow)
function highlightText(_element: Element, _searchTerm: string) {}

function clearHighlights() {
  const highlights = document.querySelectorAll('.search-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode as Node | null;
    if (!parent) return;
    while (highlight.firstChild) parent.insertBefore(highlight.firstChild, highlight);
    parent.removeChild(highlight);
  });
}

function showSearchResults(count: number) {
  // Remove existing results info
  hideSearchResults();
  
  const resultsInfo = document.createElement('div');
  resultsInfo.id = 'search-results-info';
  resultsInfo.className = 'fixed top-20 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 flex items-center gap-2';

  const label = document.createElement('span');
  label.textContent = `${count} result${count !== 1 ? 's' : ''} found`;

  const nav = document.createElement('div');
  nav.className = 'flex items-center gap-1';
  const prevBtn = document.createElement('button');
  prevBtn.className = 'w-7 h-7 grid place-items-center rounded bg-white/20 hover:bg-white/30';
  // Up arrow
  prevBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'w-7 h-7 grid place-items-center rounded bg-white/20 hover:bg-white/30';
  // Down arrow
  nextBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

  let currentIndex = 0;
  const matches = Array.from(document.querySelectorAll('.search-highlight')) as HTMLElement[];
  const scrollTo = (i: number) => {
    if (!matches.length) return;
    const el = matches[i];
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    matches.forEach(m => m.classList.remove('search-highlight-focus'));
    el.classList.add('search-highlight-focus');
    setTimeout(()=> el.classList.remove('search-highlight-focus'), 1200);
    counter.textContent = `${i+1}/${matches.length}`;
  };
  prevBtn.onclick = () => { if (currentIndex <= 0) return; currentIndex = currentIndex - 1; scrollTo(currentIndex); };
  nextBtn.onclick = () => { if (currentIndex >= matches.length - 1) return; currentIndex = currentIndex + 1; scrollTo(currentIndex); };

  const counter = document.createElement('span');
  counter.className = 'text-xs opacity-90';
  counter.textContent = matches.length ? `1/${matches.length}` : '0/0';

  nav.appendChild(prevBtn);
  nav.appendChild(nextBtn);
  resultsInfo.appendChild(label);
  resultsInfo.appendChild(counter);
  resultsInfo.appendChild(nav);
  
  document.body.appendChild(resultsInfo);
  
  // Do not auto-hide; cleared only by clearSearch()
}

function showNoResults() {
  hideSearchResults();
  
  const noResults = document.createElement('div');
  noResults.id = 'search-results-info';
  noResults.className = 'fixed top-20 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
  noResults.textContent = 'No results found';
  
  document.body.appendChild(noResults);
  
  setTimeout(() => {
    hideSearchResults();
  }, 3000);
}

function hideSearchResults() {
  const existing = document.getElementById('search-results-info');
  if (existing) {
    existing.remove();
  }
}
