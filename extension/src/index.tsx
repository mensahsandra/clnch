/**
 * Extension entry point
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Panel } from './popup/Panel';
import './index.css';

const root = createRoot(document.getElementById('clnch-root')!);
root.render(<Panel />);
