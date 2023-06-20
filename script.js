"use strict";
window.onload = () => {
  const puzzleTitles = ["Sliding tiles", "Memory tiles"];

  const counter = document.getElementById("counter");
  const diffSlider = document.getElementById("level");
  const puzzleTitle = document.getElementById("puzzle-title");
  const newGameButton = document.getElementById("puzzle-start");
  const endGameButton = document.getElementById("puzzle-end");
  const selectGameButton = document.getElementById("puzzle-select");

  const canvas = document.getElementById("puzzle-canvas");
  const ctx = canvas.getContext("2d", { alpha: "false" });
  const buffer = document.createElement("canvas");
  const bCtx = buffer.getContext("2d", { alpha: "false" });

  let game;
  let board = [];
  let tiles = [];
  let W;
  let H;
  let tileWidth;
  let tileHeight;
  let gameIdx = 0;
  let frameIdx = 0;
  let gameMoves = 0;
  let diffValue = 0;
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
  addEventListener("resize", setSize);
  setSize();

  newGameButton.addEventListener("pointerdown", startGame);
  endGameButton.addEventListener("pointerdown", stopGame);
  diffSlider.addEventListener("change", startGame);
  selectGameButton.addEventListener("pointerdown", () => {
    gameIdx += 1;
    if (gameIdx > 1) gameIdx = 0;
    puzzleTitle.textContent = puzzleTitles[gameIdx];
    startGame();
  });

  canvas.addEventListener("pointerdown", mousePress);
  function mousePress(event) {
    // do not register move if the game is not on.
    if (!canvas || !game || !game.isPlaying()) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const i = Math.floor(((event.clientX - rect.left) * scaleX) / tileWidth);
    const j = Math.floor(((event.clientY - rect.top) * scaleY) / tileHeight);
    gameMoves += game.makeMove(i, j);
    counter.textContent = `${gameMoves}`;
  }

  function startGame() {
    if (game && game.isPlaying()) stopGame();
    ctx.clearRect(0, 0, W, H);
    bCtx.clearRect(0, 0, W, H);
    // these are essentially global variables
    // so there is no need to update the game itself.
    diffValue = diffSlider.valueAsNumber;
    rows = (diffValue + 1) * 2;
    cols = (diffValue + 1) * 2;
    tileWidth = W / cols;
    tileHeight = H / rows;
    // reset game variables.
    board = [];
    tiles = [];
    frameIdx = 0;
    gameMoves = 0;
    counter.textContent = `${gameMoves}`;
    if (gameIdx === 0) {
      game = new SlidePuzzle();
    } else if (gameIdx === 1) {
      game = new MemoryGame();
    }
    game.reset();
    game.setup();
    drawGame();
  }

  function stopGame() {
    if (game && game.end()) {
      game.draw();
    }
  }

  function drawGame() {
    game.draw();
    frameIdx += 1 / 60;
    if (!game.isPlaying()) stopGame();
    window.requestAnimationFrame(drawGame);
  }

  function swap(i, j, arr) {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  // checks if two arrays are equal. if the second array
  // is not passed, it checks against itself.
  function isArrEqual(arr1, arr2 = []) {
    if (!arr2.length) arr2 = [...Array(arr1.length).keys()];
    if (arr1.length !== arr2.length) return;
    for (let i = 0; i < arr1.length - 1; i++)
      if (arr1[i] !== arr2[i]) return false;
    return true;
  }

  // draws a tile in the provided canvas "c",
  // x-coordinate "x", y-coordinate "y", width "w", and height "h".
  // if "fill" is true: the tile is filled
  // if "stroke" is true: the tile has 0.5px border.
  function drawTile(c, x, y, w, h, fill = false, stroke = true) {
    c.lineWidth = 1 / 2;
    c.fillStyle = c.strokeStyle = "rgba(1,1,1,0.5)";
    c.beginPath();
    fill ? c.fillRect(x, y, w, h) : c.rect(x, y, w, h);
    if (stroke) c.stroke();
    c.closePath();
  }

  function getCurve(x, y, v, w, h) {
    const xMin = x + w;
    const xMax = x;
    const yMin = y + h;
    const yMax = y;
    let xMin1 = xMin;
    let xMax1 = xMax;
    let yMin1 = yMin;
    let yMax1 = yMax;
    const points = [];
    for (let i = 0; i <= 360; i += 1 / 2) {
      points.push([x, y]);
      const k = (97 * i * Math.PI / 180);
      const r = Math.sin(k * (v + 7));
      x += -5 * r * w * Math.cos(k);
      y += -5 * r * h * Math.sin(k);
      if (x > xMax1) xMax1 = x;
      if (x < xMin1) xMin1 = x;
      if (y > yMax1) yMax1 = y;
      if (y < yMin1) yMin1 = y;
    }
    for (let i = 0; i < points.length; i++) {
      points[i][0] =
        ((points[i][0] - xMin1) * (xMax - xMin)) / (xMax1 - xMin1) + xMin;
      points[i][1] =
        ((points[i][1] - yMin1) * (yMax - yMin)) / (yMax1 - yMin1) + yMin;
    }
    return points;
  }

  function drawCurve(arr, v) {
    bCtx.lineWidth = 2;
    bCtx.fillStyle = bCtx.strokeStyle = `rgb(
  ${Math.cos(v / 2) * 75 + 150},
  ${Math.sin(v / 4) * 75 + 150},
  ${Math.sin(v / 6) * 75 + 150})`;
    bCtx.beginPath();
    const len = arr.length - 1;
    const s = diffValue + 2;
    for (let i = len; i > 0; i -= s) {
      const x = arr[i][0];
      const y = arr[i][1];
      bCtx.lineTo(x, y);
      bCtx.moveTo(x, y);
    }
    bCtx.stroke();
    bCtx.closePath();
  }

  // this is largely based on shiffman's coding train video.
  class SlidePuzzle {
    constructor() {
      this.moves = [];
      this.particles = [];
      this.seenSeconds = [];
      this.finalTile;
    }

    _drawTiles() {
      for (let idx = 0; idx < cols * rows; idx++) {
        const i = idx % cols;
        const j = Math.floor(idx / rows);
        const tile = board[idx];
        if (tile === -1) {
          drawTile(
            ctx,
            i * tileWidth,
            j * tileHeight,
            tileWidth,
            tileHeight,
            true
          );
          continue;
        }
        bCtx.drawImage(
          canvas,
          i * tileWidth,
          j * tileHeight,
          tileWidth,
          tileHeight,
          tiles[tile].get("x"),
          tiles[tile].get("y"),
          tileWidth,
          tileHeight
        );
        ctx.drawImage(
          buffer,
          tiles[tile].get("x"),
          tiles[tile].get("y"),
          tileWidth,
          tileHeight,
          i * tileWidth,
          j * tileHeight,
          tileWidth,
          tileHeight
        );
        drawTile(ctx, i * tileWidth, j * tileHeight, tileWidth, tileHeight);
      }
    }

    // checks if the move is valid: then returns an array of move
    // coordinates, otherwise returns an empty array.
    _move(i, j, arr) {
      const blank = board.indexOf(-1);
      const blankCol = blank % cols;
      const blankRow = Math.floor(blank / rows);
      if (
        (Math.abs(i - blankCol) === 1 || Math.abs(j - blankRow) === 1) &&
        (blankCol === i || blankRow === j)
      ) {
        swap(blank, i + j * cols, arr);
        return [blank, i + j * cols];
      }
      return [];
    }

    // shuffles the grid of tiles by making a random move.
    _shuffle(arr) {
      const shuffleSequence = [];
      for (let i = 0; i < (diffValue + 1) * 1000; i++) {
        const r1 = Math.floor(Math.random() * cols);
        const r2 = Math.floor(Math.random() * rows);
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

    reset() {
      this.moves = [];
      this.particles = [];
      this.seenSeconds = [];
    }

    setup() {
      for (let idx = 0; idx < cols * rows; idx++) {
        const tile = new Map([
          ["index", idx],
          ["x", (idx % cols) * tileWidth],
          ["y", Math.floor(idx / rows) * tileHeight],
        ]);
        board.push(idx);
        tiles[idx] = tile;
      }
      this.finalTile = tiles.pop();
      board.pop();
      board.push(-1);
      const val = 360 * Math.random();
      drawCurve(getCurve(0, 0, val, W, H), val);
      this.moves = this._shuffle(board);
      this._drawTiles();
    }

    end() {
      // at the end of the game make sure that the board is sorted
      // this is necessary when the user gives up.
      while (this.moves.length) {
        const m = this.moves.pop();
        swap(m[1], m[0], board);
      }
      tiles.push(this.finalTile);
      board[board.indexOf(-1)] = board.length - 1;
      return true;
    }

    isPlaying() {
      return !isArrEqual(board);
    }

    draw() {
      ctx.clearRect(0, 0, W, H);
      this._drawTiles();
    }
  }

  class MemoryGame {
    constructor() {
      this.flipped = [];
      this.seenSeconds = [];
      this.pairs = new Map();
    }

    _drawPairs() {
      ctx.clearRect(0, 0, W, H);
      for (let idx = 0; idx < cols * rows; idx++) {
        const i = idx % cols;
        const j = Math.floor(idx / rows);
        drawTile(ctx, i * tileWidth, j * tileHeight, tileWidth, tileHeight);
        // if a tile is flipped, copy from buffer to canvas.
        if (this.flipped[idx]) {
          ctx.drawImage(
            buffer,
            i * tileWidth,
            j * tileHeight,
            tileWidth,
            tileHeight,
            i * tileWidth,
            j * tileHeight,
            tileWidth,
            tileHeight
          );
        }
        // if a tile is flipped and its pair is not flipped,
        // reset both tiles to unflipped at a "new" third second.
        // maybe not the best idea, but eh
        const gameTime = Math.floor(frameIdx);
        if (!this.seenSeconds.includes(gameTime) && gameTime % 4 === 0) {
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

    _shuffle(arr) {
      for (let i = 0; i < (diffValue + 1) * 1000; i++) {
        const r1 = Math.floor(Math.random() * arr.length);
        const r2 = Math.floor(Math.random() * arr.length);
        swap(r1, r2, arr);
      }
    }

    makeMove(i, j) {
      if (this._move(i, j)) {
        return 1;  
      }
      return 0;
    }

    reset() {
      this.flipped = [];
      this.seenSeconds = [];
      this.pairs = new Map();
      // clear the canvas buffer at reset.
      bCtx.clearRect(0, 0, W, H);
    }

    setup() {
      // populate the board array with pairs then shuffle it.
      for (let idx = 0; idx < cols * rows; idx++) {
        const val = Math.floor(idx / 2);
        board.push(val);
      }
      this._shuffle(board);
      // iterate over the shuffled board array and populate the buffer canvas
      // with the drawings of pairs.
      for (let idx = 0; idx < cols * rows; idx++) {
        const val = board[idx];
        if (!this.pairs.get(val)) this.pairs.set(val, []);
        const pair = this.pairs.get(val);
        pair.push(idx);
        const i = (idx % cols) * tileWidth;
        const j = Math.floor(idx / rows) * tileHeight;
        const pointsArray = getCurve(i, j, val, tileWidth, tileHeight);
        drawCurve(pointsArray, val);
        this.flipped.push(0);
      }
      this._drawPairs();
    }

    end() {
      for (let i = 0; i < cols * rows; i++) this.flipped[i] = 1;
      return true;
    }

    isPlaying() {
      return this.flipped.includes(0) ? true : false;
    }

    draw() {
      this._drawPairs();
    }
  }
};
