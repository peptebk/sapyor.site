import React, { useState, useEffect, useRef } from 'react';
import cellTexture from './assets/cell.png';
import flagTexture from './assets/flag.png';
import mineTexture from './assets/mine.png';
import './Minesweeper.css';

const Minesweeper = ({ scale, setScale }) => {
  const LEVELS = { Beginner: { cols: 9, rows: 9, mines: 10 }, Intermediate: { cols: 16, rows: 16, mines: 40 }, Expert: { cols: 16, rows: 30, mines: 99 } };
  const DEFAULT_CELL_SIZE = 30; // px
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [difficulty, setDifficulty] = useState('Beginner');
  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const { cols: COLS, rows: ROWS, mines: MINES } = LEVELS[difficulty];

  const computeCellSize = () => {
    try {
      const horizontalPadding = 40;
      const available = Math.max(window.innerWidth - horizontalPadding, 120);
      const size = Math.floor(available / COLS);
      return Math.max(12, Math.min(DEFAULT_CELL_SIZE, size));
    } catch (e) {
      return DEFAULT_CELL_SIZE;
    }
  };

  useEffect(() => {
    const onResize = () => setCellSize(computeCellSize());
    setCellSize(computeCellSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [COLS]);

  useEffect(() => {
    initGame();
  }, [difficulty]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const countNearbyMines = (grid, r, c) => {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === 'M') count++;
      }
    }
    return count;
  };

  const calculateNumbers = (grid) => {
    const newGrid = grid.map(row => [...row]);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (newGrid[r][c] !== 'M') {
          newGrid[r][c] = countNearbyMines(grid, r, c);
        }
      }
    }
    return newGrid;
  };

  const isBoardSolvable = (grid) => {
    const state = Array(ROWS).fill(null).map(() => Array(COLS).fill(null)); 
    const revealed = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));
    
    const getNeighbors = (r, c) => {
      const neighbors = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            neighbors.push([nr, nc]);
          }
        }
      }
      return neighbors;
    };

    let changed = true;
    let iterations = 0;
    const maxIterations = 1000;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (revealed[r][c]) continue;

          const neighbors = getNeighbors(r, c);
          let unknownCount = 0, mineCount = 0, safeCount = 0;

          for (const [nr, nc] of neighbors) {
            if (state[nr][nc] === true) mineCount++;
            else if (state[nr][nc] === false) safeCount++;
            else unknownCount++;
          }

          const cellValue = grid[r][c];
          
          if (state[r][c] === false) {
            const minesNeeded = cellValue - mineCount;
            
            if (minesNeeded === unknownCount && unknownCount > 0) {
              for (const [nr, nc] of neighbors) {
                if (state[nr][nc] === null) {
                  state[nr][nc] = true;
                  changed = true;
                }
              }
            }
            else if (minesNeeded === 0 && unknownCount > 0) {
              for (const [nr, nc] of neighbors) {
                if (state[nr][nc] === null) {
                  state[nr][nc] = false;
                  changed = true;
                }
              }
            }
          }
        }
      }

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!revealed[r][c] && state[r][c] === false) {
            revealed[r][c] = true;
            changed = true;
          }
        }
      }
    }

    let unrevealed = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!revealed[r][c]) unrevealed++;
      }
    }

    return unrevealed <= MINES;
  };

  const generateGuessFreeBoard = () => {
    let newGrid;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      newGrid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
      let minesPlaced = 0;

      while (minesPlaced < MINES) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);
        if (newGrid[r][c] !== 'M') {
          newGrid[r][c] = 'M';
          minesPlaced++;
        }
      }

      attempts++;
    } while (!isBoardSolvable(newGrid) && attempts < maxAttempts);

    return calculateNumbers(newGrid);
  };

  const initGame = () => {
    const newGrid = generateGuessFreeBoard();

    setGrid(newGrid);
    setRevealed(Array(ROWS).fill(null).map(() => Array(COLS).fill(false)));
    setFlagged(Array(ROWS).fill(null).map(() => Array(COLS).fill(false)));
    setGameOver(false);
    setWon(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;
    setTime(0);
    setTimerRunning(false);
  };

  const reveal = (r, c) => {
    if (gameOver || won || revealed[r][c] || flagged[r][c]) return;

    if (!timerRunning) {
      startTimeRef.current = Date.now();
      setTimerRunning(true);
      setTime(0);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (elapsed >= 999) {
          setTime(999);
          clearInterval(timerRef.current);
          timerRef.current = null;
          setTimerRunning(false);
        } else {
          setTime(elapsed);
        }
      }, 250);
    }

    const newRevealed = revealed.map(row => [...row]);
    
    if (grid[r][c] === 'M') {
      setGameOver(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setTimerRunning(false);
      }
      for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
          if (grid[i][j] === 'M') newRevealed[i][j] = true;
        }
      }
      setRevealed(newRevealed);
      return;
    }

    const stack = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop();
      if (newRevealed[cr][cc]) continue;
      newRevealed[cr][cc] = true;

      if (grid[cr][cc] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !newRevealed[nr][nc]) {
              stack.push([nr, nc]);
            }
          }
        }
      }
    }

    setRevealed(newRevealed);
    
    let revealedCount = 0;
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        if (newRevealed[i][j]) revealedCount++;
      }
    }
    if (revealedCount === ROWS * COLS - MINES) {

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setTimerRunning(false);
      }
      setWon(true);
    }
  };

  const toggleFlag = (r, c, e) => {
    e.preventDefault();
    if (gameOver || won || revealed[r][c]) return;
    const newFlagged = flagged.map(row => [...row]);
    newFlagged[r][c] = !newFlagged[r][c];
    setFlagged(newFlagged);
  };

  const Cell = ({ r, c }) => {
    const isRevealed = revealed[r]?.[c];
    const isFlagged = flagged[r]?.[c];
    const value = grid[r]?.[c];
    
    let display = '';
    let bgColor = '#c0c0c0';
    let backgroundImage = 'none';
    let backgroundSize = 'cover';
    let backgroundPosition = 'center';

    if (isRevealed) {
      bgColor = '#d3d3d3';
      if (value === 'M') {
        display = '';
        backgroundImage = `url(${mineTexture})`;
      } else if (value > 0) display = value;
    } else {
      if (isFlagged) {
        backgroundImage = `url(${flagTexture})`;
      } else {
        backgroundImage = `url(${cellTexture})`;
      }
    }

    const colors = ['#000000', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#808080', '#808080'];

    return (
      <div
        onClick={() => reveal(r, c)}
        onContextMenu={(e) => toggleFlag(r, c, e)}
        style={{
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          minWidth: `${cellSize}px`,
          minHeight: `${cellSize}px`,
          border: '1px solid #6e6e6e',
          background: bgColor,
          backgroundImage: value === 'M' && isRevealed && !display ? 'none' : backgroundImage,
          backgroundSize: backgroundSize,
          backgroundPosition: backgroundPosition,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          cursor: 'pointer',
          color: colors[display] || '#000000',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        {display && display !== 'M' ? (
          <span className="ms-number" style={{ fontFamily: "'MinesweeperFont', sans-serif", color: colors[display] || '#000000', fontSize: `${Math.max(10, Math.floor(cellSize * 0.7))}px`, fontWeight: 'bold' }}>{display}</span>
        ) : value === 'M' && isRevealed ? (
          <img src={mineTexture} alt="Mine" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : ''}
      </div>
    );
  };

  const Modal = ({ title, message, onClose, color = '#000' }) => (
    <div className="ms-modal-overlay" onClick={onClose}>
      <div className="ms-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ms-modal-close" aria-label="close" onClick={onClose}>×</button>
        <div className="ms-modal-title" style={{ color }}>{title}</div>
        {message && <div className="ms-modal-body">{message}</div>}
      </div>
    </div>
  );

  if (grid.length === 0) return <div>Загрузка...</div>;

  const gameFrameWidth = COLS * cellSize + 16;
  const levelSelectorWidth = gameFrameWidth;
  const scaleFactor = (scale || 100) / 100;

  return (
    <div style={{ fontFamily: 'MS Sans Serif', margin: '0 auto', width: '100%' }}>
      <div style={{
        width: '100%',
        maxWidth: `${levelSelectorWidth}px`,
        background: '#c0c0c0',
        padding: '5px',
        marginBottom: '40px',
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '11px',
        border: '2px outset #dfdfdf',
        boxSizing: 'border-box',
        overflow: 'hidden',
        flexWrap: 'wrap'
      }}>
        {Object.keys(LEVELS).map(level => (
          <button key={level} onClick={() => setDifficulty(level)} style={{
            padding: '2px 8px',
            margin: 0,
            boxSizing: 'border-box',
            background: difficulty === level ? '#0080ff' : '#c0c0c0',
            color: difficulty === level ? 'white' : 'black',
            border: `2px ${difficulty === level ? 'inset' : 'outset'} #dfdfdf`,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '11px'
          }}>
            {level}
          </button>
        ))}

        {/* Size select moved into levels row and styled like controls */}
        {typeof setScale === 'function' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="site-size-select" style={{ fontSize: '11px', fontWeight: 'bold', marginRight: '4px' }}>Size</label>
            <select
              id="site-size-select"
              value={scale || 100}
              onChange={(e) => setScale(Number(e.target.value))}
              style={{
                padding: '2px 6px',
                fontSize: '11px',
                background: '#c0c0c0',
                border: '2px outset #dfdfdf',
                cursor: 'pointer',
                boxSizing: 'border-box',
                width: '64px'
              }}
            >
              {Array.from({ length: 100 }, (_, i) => i + 1).map((v) => (
                <option key={v} value={v}>{v}%</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <div style={{ transform: `scale(${scaleFactor})`, transformOrigin: 'center center', width: `${gameFrameWidth}px`, margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(to bottom, #000080, #1084d7)',
            color: 'white',
            padding: '2px',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            borderBottom: '2px solid #000080'
          }}>
            Сапёр
          </div>
          
          <div style={{
            background: '#c0c0c0',
            padding: '6px',
            border: '2px outset #dfdfdf'
          }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '12px'
          }}>
          <div style={{
            background: '#dfdfdf',
            padding: '2px 4px',
            border: '2px inset #808080',
            minWidth: '50px',
            textAlign: 'center'
          }}>
            <span className="ms-counter">{flagged.flat().filter(Boolean).length}</span>
          </div>
          <button onClick={initGame} style={{
            padding: '2px 8px',
            background: '#c0c0',
            border: '2px outset #dfdfdf',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '12px'
          }}>
            Новая игра
          </button>
          <div style={{
            background: '#dfdfdf',
            padding: '2px 4px',
            border: '2px inset #808080',
            minWidth: '50px',
            textAlign: 'center'
          }}>
            <span className="ms-counter">{String(time).padStart(3, '0')}</span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
          gap: '0px',
          background: '#808080',
          padding: '0px',
          border: '2px inset #808080'
        }}>
          {grid.map((row, r) => row.map((_, c) => <Cell key={`${r}-${c}`} r={r} c={c} />))}
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default Minesweeper;