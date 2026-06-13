/**
 * Modal entry point
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ModalApp from './Modal/App';
import './index.css';

const root = document.getElementById('clnch-modal-root');
if (root) {
  createRoot(root).render(<ModalApp />);
}
