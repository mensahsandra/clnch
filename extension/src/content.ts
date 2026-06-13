/**
 * Content Script - Injects floating button and modal into every webpage
 */

import { logger } from './utils/logger';

// Inject floating button
function injectFloatingButton() {
  if (document.getElementById('clnch-floating-button')) {
    return;
  }

  logger.info('Injecting floating button...');

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'clnch-floating-button';
  buttonContainer.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
    border-radius: 50%;
    cursor: pointer;
    z-index: 999998;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    transition: all 0.3s ease;
    border: none;
    user-select: none;
  `;

  buttonContainer.innerHTML = '🎙️';

  // Hover effect
  buttonContainer.addEventListener('mouseenter', () => {
    buttonContainer.style.transform = 'scale(1.1)';
    buttonContainer.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.6)';
  });

  buttonContainer.addEventListener('mouseleave', () => {
    buttonContainer.style.transform = 'scale(1)';
    buttonContainer.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
  });

  // Click to open modal
  buttonContainer.addEventListener('click', () => {
    logger.info('Opening CLNCH modal...');
    injectModal();
  });

  document.body.appendChild(buttonContainer);
  logger.info('Floating button injected');
}

// Inject modal overlay
function injectModal() {
  if (document.getElementById('clnch-modal')) {
    return;
  }

  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'clnch-modal-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 999999;
  `;

  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'clnch-modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    background: #1f2937;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    z-index: 1000000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid #374151;
  `;

  // Create iframe for React component
  const iframe = document.createElement('iframe');
  iframe.id = 'clnch-modal-frame';
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: #1f2937;
  `;
  iframe.src = chrome.runtime.getURL('modal.html');

  modal.appendChild(iframe);

  // Close on backdrop click
  backdrop.addEventListener('click', () => {
    backdrop.remove();
    modal.remove();
  });

  // Close on Escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      backdrop.remove();
      modal.remove();
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  logger.info('Modal injected');
}

// Inject on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectFloatingButton);
} else {
  injectFloatingButton();
}

logger.info('Content script loaded');
