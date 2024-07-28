"use strict";
window.onload = () => {
  class SlidePuzzle {
    constructor() {
      this.moves = [];
      this.particles = [];
      this.seenSeconds = [];
      this.finalTile;
    }

    _drawTiles() {
      for (let idx = 0; idx < cols * rows; idx++) {
        const tile = board[idx];
        const i = (idx % cols) * tileWidth;
        const j = ((idx / rows) | 0) * tileHeight;
        if (tile === -1) {
          drawTile(ctx, i, j, tileWidth, tileHeight, true);
          continue;
        }
        bCtx.drawImage(canvas, i, j, tileWidth, tileHeight,
          tiles[tile].get("x"), tiles[tile].get("y"), tileWidth, tileHeight);
        ctx.drawImage(buffer, tiles[tile].get("x"), tiles[tile].get("y"),
          tileWidth, tileHeight, i, j, tileWidth, tileHeight);
        drawTile(ctx, i, j, tileWidth, tileHeight);
      }
    }

    // checks if the move is valid: then returns an array of move
    // coordinates, otherwise returns an empty array.
    _move(i, j, arr) {
      const blank = board.indexOf(-1);
      const blankCol = blank % cols;
      const blankRow = (blank / rows) | 0;
      if (
        (Math.abs(i - blankCol) === 1 || Math.abs(j - blankRow) === 1) &&
        (blankCol === i || blankRow === j)
      ) {
        [arr[blank], arr[i+j*cols]] = [arr[i+j*cols], arr[blank]];
        return [blank, i + j * cols];
      }
      return [];
    }

    // shuffles the grid of tiles by making a random move.
    _shuffle(arr) {
      const shuffleSequence = [];
      for (let i = 0; i < (diffValue + 1) * 1000; i++) {
        const r1 = (Math.random() * cols) | 0;
        const r2 = (Math.random() * rows) | 0;
        const randomMove = this._move(r1, r2, arr);
        if (randomMove.length) shuffleSequence.push(randomMove);
      }
      return shuffleSequence;
    }

    // makes the move if it's valid.
    makeMove(i, j) {
      const m = this._move(i, j, board);
      if (m.length) {
        this.moves.push(m);
        return 1;
      }
      return 0;
    }

    setup() {
      this.moves = [];
      this.particles = [];
      this.seenSeconds = [];
      for (let idx = 0; idx < cols * rows; idx++) {
        const tile = new Map([
          ["index", idx],
          ["x", (idx % cols) * tileWidth],
          ["y", ((idx / rows) | 0) * tileHeight],
        ]);
        board.push(idx);
        tiles[idx] = tile;
      }
      this.finalTile = tiles.pop();
      board.pop();
      board.push(-1);
      const v = ((2 * Math.PI * Math.random()) | 0 + 5 / 8) | 0;
      const a = (32 * Math.cos(8 * v) + 33) | 0;
      const b = (9 * Math.sin(3 * v) + 10) | 0;
      drawCurve(bCtx, getCurve(0, 0, W, H, a, b, b / a), v, 4);
      this.moves = this._shuffle(board);
      this._drawTiles();
    }

    end() {
      // at the end of the game make sure that the board is sorted
      // to display the solution in case the player gives up.
      while (this.moves.length) {
        const m = this.moves.pop();
        [board[m[1]], board[m[0]]] = [board[m[0]], board[m[1]]];
      }
      tiles.push(this.finalTile);
      board[board.indexOf(-1)] = board.length - 1;
      return true;
    }

    isPlaying() {
      const ks = [...Array(board.length).keys()];
      for (let i = 0; i < board.length - 1; i++)
        if (board[i] !== ks[i]) return true;
      return false;
    }

    draw() {
      ctx.clearRect(0, 0, W, H);
      this._drawTiles();
    }
  }

  class PairsPuzzle {
    constructor() {
      this.flipped = [];
      this.seenSeconds = [];
      this.pairs = new Map();
    }

    _drawPairs() {
      ctx.clearRect(0, 0, W, H);
      for (let idx = 0; idx < cols * rows; idx++) {
        const i = (idx % cols) * tileWidth;
        const j = ((idx / rows) | 0) * tileHeight;
        drawTile(ctx, i, j, tileWidth, tileHeight);
        // if a tile is flipped, copy from buffer to canvas.
        if (this.flipped[idx]) {
          ctx.drawImage(buffer, i, j, tileWidth, tileHeight,
            i, j, tileWidth, tileHeight);
        }
        // if a tile is flipped and its pair is not flipped,
        // reset both tiles to unflipped on the count of three.
        // maybe not the best idea, but eh
        const gameTime = frameIdx | 0;
        if (!this.seenSeconds.includes(gameTime) && gameTime % 2 === 0) {
          for (let [k, v] of this.pairs) {
            if (this.flipped[v[0]] !== this.flipped[v[1]]) {
              this.flipped[v[0]] = 0;
              this.flipped[v[1]] = 0;
            }
          }
          this.seenSeconds.push(gameTime);
        }
      }
    }

    // flips the tile at the given index.
    _move(i, j) {
      const idx = i + j * cols;
      if (!this.flipped[idx]) {
        this.flipped[idx] = 1;
        return true;
      }
      return false;
    }

    makeMove(i, j) {
      return Number(this._move(i, j));
    }

    setup() {
      this.flipped = [];
      this.seenSeconds = [];
      this.pairs = new Map();
      // clear the canvas buffer at reset.
      bCtx.clearRect(0, 0, W, H);
      // populate the board array with pairs then shuffle it.
      for (let idx = 0; idx < cols * rows; idx++) {
        board.push((idx / 2) | 0);
      }
      shuffleArray(board);
      // iterate over the shuffled board array and populate the buffer canvas
      // with the drawings of pairs.
      for (let idx = 0; idx < cols * rows; idx++) {
        const v = board[idx] + 1;
        if (!this.pairs.get(v)) this.pairs.set(v, []);
        const pair = this.pairs.get(v);
        pair.push(idx);
        const i = (idx % cols) * tileWidth;
        const j = ((idx / rows) | 0) * tileHeight;
        const a = (32 * Math.cos(8 * v) + 33) | 0;
        const b = (9 * Math.sin(3 * v) + 10) | 0;
        drawCurve(bCtx, getCurve(i, j, tileWidth, tileHeight, a, b, b / a), v);
        this.flipped.push(0);
      }
      this._drawPairs();
    }

    end() {
      for (let i = 0; i < cols * rows; i++) this.flipped[i] = 1;
      return true;
    }

    isPlaying() {
      return this.flipped.includes(0);
    }

    draw() {
      this._drawPairs();
    }
  }

  class ThatTilePuzzle {
    constructor() {
      this.playing = true;
      this.seenSeconds = [];
      this.thatTile = 0;
    }

    makeMove(i, j) {
      return Number((((this.thatTile % cols) === i) && (((this.thatTile / rows) | 0) === j)));
    }

    setup() {
      this.playing = true;
      this.seenSeconds = [];
      this.thatTile = (Math.random() * (cols * rows)) | 0;
    }

    end() {
      this.playing = false;
      return true;
    }

    isPlaying() {
      return this.playing;
    }

    draw() {
      if (!this.playing) return;
      const gameTime = frameIdx | 0;
      const v = (2 * Math.PI * Math.random()) | 0 + 1 / 4;
      const a = (32 * Math.sin(8 * v) + 33) | 0;
      const b = (Math.sin(3 * v) * 9 + 10) | 0;
      if (!this.seenSeconds.includes(gameTime) && gameTime % 2 === 0) {
        const ii = (this.thatTile % cols) * tileWidth;
        const jj = ((this.thatTile / rows) | 0) * tileHeight;
        for (let idx = 0; idx < cols * rows; idx++) {
          const i = (idx % cols) * tileWidth;
          const j = ((idx / rows) | 0) * tileHeight;
          if (ii === i && jj === j) continue;
          drawCurve(ctx, getCurve(i, j, tileWidth, tileHeight, a, b, b / a), v);
        }
        drawCurve(ctx, getCurve(ii, jj, tileWidth, tileHeight, a - 2, b - 3, b / a), v - 1, 2);
        this.seenSeconds.push(gameTime);
      } else if (!this.seenSeconds.includes(gameTime) && gameTime % 2 !== 0) {
        ctx.clearRect(0, 0, W, H);
        this.thatTile = (Math.random() * (cols * rows)) | 0;
        this.seenSeconds.push(gameTime);
      }
    }
  }

  const fps = 30;

  const counter = document.getElementById("counter");
  const diffSlider = document.getElementById("level");
  const newGameButton = document.getElementById("puzzle-start");
  const endGameButton = document.getElementById("puzzle-end");
  const canvas = document.getElementById("puzzle-canvas");
  const pageTitle = document.getElementById("page-title");

  const ctx = canvas.getContext("2d", { alpha: "false" });
  const buffer = document.createElement("canvas");
  const bCtx = buffer.getContext("2d", { alpha: "false" });

  const games = [new SlidePuzzle(), new PairsPuzzle(), new ThatTilePuzzle()];

  let W;
  let H;
  let game;
  let timer;
  let tileWidth;
  let board = [];
  let tiles = [];
  let tileHeight;
  let frameIdx = 0;
  let gameMoves = 0;
  let diffValue = 0;
  let timeController = true;
  let cols = (diffValue + 1) * 2;
  let rows = (diffValue + 1) * 2;

  function setSize() {
    // scale canvas dimensions.
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    buffer.width = canvas.width;
    buffer.height = canvas.height;
    W = canvas.width;
    H = canvas.height;
  }

  function mousePress(event) {
    // do not register move if the game is not on.
    if (!canvas || !game || !game.isPlaying()) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const i = (((event.clientX - rect.left) * scaleX) / tileWidth) | 0;
    const j = (((event.clientY - rect.top) * scaleY) / tileHeight) | 0;
    gameMoves += game.makeMove(i, j);
    counter.textContent = `${gameMoves}`;
  }

  function startGame() {
    if (pageTitle.style.visibility != 'hidden') pageTitle.style.visibility = 'hidden';
    if (game && game.isPlaying()) stopGame();
    ctx.clearRect(0, 0, W, H);
    bCtx.clearRect(0, 0, W, H);
    // these are essentially global variables
    // so there is no need to update the game itself.
    diffValue = diffSlider.valueAsNumber;
    rows = (diffValue + 1) * 2;
    cols = (diffValue + 1) * 2;
    if (rows > 8) rows = 8;
    if (cols > 8) cols = 8;
    tileWidth = W / cols;
    tileHeight = H / rows;
    // reset game variables.
    board = [];
    tiles = [];
    frameIdx = 0;
    gameMoves = 0;
    counter.textContent = `${gameMoves}`;
    const gameIdx = document.querySelector("input[name='puzzle-title']:checked");
    game = games[Number(gameIdx.value)];
    game.setup();

    timeController = true;
    animationInterval(1000 / fps, timeController, () => {
      drawGame();
    });
  }

  function stopGame() {
    if (!timeController) return;
    if (game && game.end()) {
      game.draw();
      timeController = false;
      window.clearTimeout(timer);
    }
  }

  function drawGame() {
    if (game.isPlaying()) {
      game.draw();
      frameIdx += 1 / 60; 
    } else {
      stopGame(); 
    }
  }
  
  function shuffleArray(arr) {
    const n = arr.length;
    for (let i = n - 1; i >= 1; i--) {
      let j = (Math.random() * (i + 1)) | 0;
      j = j > i ? i : j;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function animationInterval(ms, signal, callback) {
    const start = document.timeline
      ? document.timeline.currentTime
      : performance.now();
    function frame(time) {
      if (!signal) return;
      callback(time);
      scheduleFrame(time);
    }
    function scheduleFrame(time) {
      const elapsed = time - start;
      const roundedElapsed = Math.round(elapsed / ms) * ms;
      const targetNext = start + roundedElapsed + ms;
      const delay = targetNext - performance.now();
      timer = window.setTimeout(() => {
        window.requestAnimationFrame(frame);
      }, delay);
    }
    scheduleFrame(start);
  }

  function drawTile(c, x, y, w, h, fill = false, stroke = true, fillColor = "rgb(74,74,74)", strokeColor = "rgb(74,74,74)") {
    c.lineWidth = 1;
    c.fillStyle = fillColor;
    c.strokeStyle = strokeColor;
    c.beginPath();
    fill ? c.fillRect(x, y, w, h) : c.rect(x, y, w, h);
    if (stroke) c.stroke();
    c.closePath();
  }

  function getCurve(x, y, w, h, a, b, c) {
    const xs = [];
    const ys = [];
    const points = [];    
    const xMin = x + w - 4;
    const xMax = x + 4;
    const yMin = y + h - 4;
    const yMax = y + 4;
    let xMin1 = xMin;
    let xMax1 = xMax;
    let yMin1 = yMin;
    let yMax1 = yMax;

    for (let t = 0; t < 6 * Math.PI; t += 1 / 20) {
      xs.push(x);
      ys.push(y);

      // starr rose: https://www.reddit.com/r/desmos/comments/k822h1/comment/gevif4i/
      let r = w * (2 + Math.sin(a * t) / 2);
      let rad = t + Math.sin(b * t) / c;      
      x += r * Math.cos(rad);
      y += -r * Math.sin(rad);

      if (x > xMax1) xMax1 = x;
      if (x < xMin1) xMin1 = x;
      if (y > yMax1) yMax1 = y;
      if (y < yMin1) yMin1 = y;
    }

    for (let i = 0; i < xs.length; i++) {
      points.push([ 
        ((xs[i] - xMin1) * (xMax - xMin)) / (xMax1 - xMin1) + xMin, 
        ((ys[i] - yMin1) * (yMax - yMin)) / (yMax1 - yMin1) + yMin
      ]);
    }

    return points;
  }

  function drawCurve(c, points, v, lw = 1) {
    c.lineWidth = lw;
    c.fillStyle = c.strokeStyle = `rgba(${Math.cos(v / 2) * 75 + 150}, 
      ${Math.sin(v / 4) * 75 + 150}, ${Math.sin(v / 6) * 75 + 150}, 0.8)`;
    const p = new Path2D();
    const s = (Math.sin(v) + 1) / 2 * points.length;
    points.forEach((xy, _) => {
      p.moveTo(points[s | 0][0], points[s | 0][1]);
      p.lineTo(xy[0], xy[1]);
    });
    p.closePath();
    c.stroke(p);  
  }

  setSize();

  window.addEventListener('resize', setSize);
  newGameButton.addEventListener('pointerdown', () => {
    newGameButton.classList.add('clickback');
    startGame();
  });
  newGameButton.addEventListener('animationend', () => {
    newGameButton.classList.remove('clickback');  
  });
  endGameButton.addEventListener('pointerdown', () => {
    endGameButton.classList.add('clickback');
    stopGame();
  });
  endGameButton.addEventListener('animationend', () => {
    endGameButton.classList.remove('clickback');  
  });
  diffSlider.addEventListener('change', startGame);
  canvas.addEventListener('pointerdown', mousePress);
};
