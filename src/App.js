import React, { useState } from 'react';
import Minesweeper from './Minesweeper';
import './App.css';

function App() {
  const [scale, setScale] = useState(100);

  return (
    <div className="root">
      <div className="scale-wrapper">
        <div className="app">
          <Minesweeper scale={scale} setScale={setScale} />
        </div>
      </div>
    </div>
  );
}

export default App;
