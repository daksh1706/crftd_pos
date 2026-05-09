import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import POS from './frontend/src/pages/POS.jsx';

try {
  const html = renderToString(
    React.createElement(
      StaticRouter,
      { location: "/pos" },
      React.createElement(POS)
    )
  );
  console.log("Successfully rendered!");
} catch (error) {
  console.error("REACT RENDER ERROR:");
  console.error(error.stack);
}
