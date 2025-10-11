"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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

  const searchInPage = useCallback((query: string) => {
    if (!query.trim()) {
      clearSearch();
      return;
    }

    setSearchQuery(query);
    setIsSearchActive(true);

    // Get all text content from the current page
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
    const searchTerm = query.toLowerCase();
    let matchCount = 0;

    textNodes.forEach((textNode) => {
      const text = textNode.textContent || '';
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes(searchTerm)) {
        const parent = textNode.parentElement;
        if (parent && !parent.classList.contains('search-highlight')) {
          highlightText(parent, searchTerm);
          matchCount++;
        }
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
function highlightText(element: Element, searchTerm: string) {
  const text = element.textContent || '';
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(searchTerm.toLowerCase());
  
  if (index === -1) return;

  const beforeText = text.substring(0, index);
  const matchText = text.substring(index, index + searchTerm.length);
  const afterText = text.substring(index + searchTerm.length);

  const highlightSpan = document.createElement('span');
  highlightSpan.className = 'search-highlight bg-yellow-200 dark:bg-yellow-600 px-1 rounded';
  highlightSpan.textContent = matchText;

  const fragment = document.createDocumentFragment();
  if (beforeText) fragment.appendChild(document.createTextNode(beforeText));
  fragment.appendChild(highlightSpan);
  if (afterText) fragment.appendChild(document.createTextNode(afterText));

  element.parentNode?.replaceChild(fragment, element);
}

function clearHighlights() {
  const highlights = document.querySelectorAll('.search-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
      parent.normalize();
    }
  });
}

function showSearchResults(count: number) {
  // Remove existing results info
  hideSearchResults();
  
  const resultsInfo = document.createElement('div');
  resultsInfo.id = 'search-results-info';
  resultsInfo.className = 'fixed top-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
  resultsInfo.textContent = `${count} result${count !== 1 ? 's' : ''} found`;
  
  document.body.appendChild(resultsInfo);
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    hideSearchResults();
  }, 3000);
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
