'use strict';
window.onload = () => {
  class SlidePuzzle {
    constructor() {
      this.finalTile;
      this.moves = [];
    }

    _drawTiles() {
      for (let idx = 0; idx < cols * rows; idx++) {
        const tile = board[idx];
        const i = (idx % cols) * tileWidth;
        const j = ((idx / rows) | 0) * tileHeight;

        if (tile === -1) {
          drawTile(context, i, j, tileWidth, tileHeight, {fill: true, stroke: false, fillColor: 'rgb(11,11,11)'});
          continue;
        }
        
        context.drawImage(buffer, tiles[tile].get('x'), tiles[tile].get('y'), tileWidth, tileHeight, i, j, tileWidth, tileHeight);
      }
    }

    // checks if the move is valid
    _move(i, j) {
      const blank = board.indexOf(-1);
      const blankCol = blank % cols;
      const blankRow = (blank / rows) | 0;
      if ((Math.abs(i - blankCol) === 1 || Math.abs(j - blankRow) === 1) && (blankCol === i || blankRow === j)) {
        const index = i + j * cols;
        [board[blank], board[index]] = [board[index], board[blank]];
        return [blank, index];
      }
      return [];
    }

    // shuffles the grid of tiles by making a random move
    _shuffle() {
      const shuffleSequence = [];
      for (let i = 0; i < (settings.level + 2) * 1000; i++) {
        const r1 = (Math.random() * cols) | 0;
        const r2 = (Math.random() * rows) | 0;
        const randomMove = this._move(r1, r2);
        if (randomMove.length) shuffleSequence.push(randomMove);
      }
      return shuffleSequence;
    }

    makeMove(i, j) {
      const m = this._move(i, j);
      if (m.length) {
        this.moves.push(m);
        return 1;
      }
      return 0;
    }

    setup() {
      this.moves = [];
      for (let idx = 0; idx < cols * rows; idx++) {
        board.push(idx);
        tiles[idx] = new Map([['index', idx], ['x', (idx % cols) * tileWidth], ['y', ((idx / rows) | 0) * tileHeight], ]);
      }
      this.finalTile = tiles.pop();
      board.pop();
      board.push(-1);
      this.moves = this._shuffle();

      const pattern = patterns[Math.random() * patterns.length | 0];
      bufferContext.drawImage(pattern, 0, 0, pattern.width, pattern.height, 0, 0, canvas.width, canvas.height);

      this._drawTiles();
    }

    end() {
      // at the end of the game make sure that the board is sorted to display the solution in case the player gives up
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
      for (let i = 0; i < board.length - 1; i++) {
        if (board[i] !== ks[i]) return true;
      }
      return false;
    }

    draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      this._drawTiles();
    }
  }

  class PairsPuzzle {
    constructor() {
      this.flipped = [];
      this.seenSeconds = [];
      this.pairs = new Map();
    }

    makeMove(i, j) {
      const idx = i + j * cols;
      if (!this.flipped[idx]) {
        this.flipped[idx] = 1;
        return 1;
      }
      return 0;
    }

    setup() {
      this.flipped = [];
      this.seenSeconds = [];
      this.pairs = new Map();
      // clear the canvas buffer at reset.
      bufferContext.clearRect(0, 0, canvas.width, canvas.height);
      // populate the board array with pairs then shuffle it.
      for (let idx = 0; idx < cols * rows; idx++) {
        board.push((idx / 2) | 0);
      }
      shuffleArray(board);
      // iterate over the shuffled board array and populate the buffer canvas with the drawings of pairs.
      for (let idx = 0; idx < cols * rows; idx++) {
        const v = board[idx] + 1; 
        
        if (!this.pairs.get(v)) this.pairs.set(v, []);
        
        const pair = this.pairs.get(v);
        pair.push(idx);

        const i = (idx % cols) * tileWidth;
        const j = ((idx / rows) | 0) * tileHeight;

        const pattern = patterns[v];
        bufferContext.drawImage(pattern, 0, 0, pattern.width, pattern.height, i, j, tileWidth, tileHeight);

        this.flipped.push(0);
      }
      this.draw();
    }

    end() {
      for (let i = 0; i < cols * rows; i++) {
        this.flipped[i] = 1;
      }
      return true;
    }

    isPlaying() {
      return this.flipped.includes(0);
    }

    draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (let idx = 0; idx < cols * rows; idx++) {
        const i = (idx % cols) * tileWidth;
        const j = ((idx / rows) | 0) * tileHeight;
        drawTile(context, i, j, tileWidth, tileHeight, {fill:false, stroke:false});
        // if a tile is flipped, copy from buffer to canvas.
        if (this.flipped[idx]) context.drawImage(buffer, i, j, tileWidth, tileHeight, i, j, tileWidth, tileHeight);
        // if a tile is flipped and its pair is not flipped, reset both tiles to unflipped on the count of three
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
      const v = (Math.random() * (patterns.length - 1)) | 0 + 1;

      if (!this.seenSeconds.includes(gameTime) && gameTime % 2 === 0) {
        const pattern1 = patterns[v];
        const pattern2 = patterns[v-1];

        const ii = (this.thatTile % cols) * tileWidth;
        const jj = ((this.thatTile / rows) | 0) * tileHeight;
        for (let idx = 0; idx < cols * rows; idx++) {
          const i = (idx % cols) * tileWidth;
          const j = ((idx / rows) | 0) * tileHeight;
          if (ii === i && jj === j) continue;
          drawTile(context, i, j, tileWidth, tileHeight, {fill:false, stroke:false});
          context.drawImage(pattern1, 0, 0, pattern1.width, pattern1.height, i, j, tileWidth, tileHeight);
        }
        context.drawImage(pattern2, 0, 0, pattern2.width, pattern2.height, ii, jj, tileWidth, tileHeight);
        this.seenSeconds.push(gameTime);
      } 
      else if (!this.seenSeconds.includes(gameTime) && gameTime % 2 !== 0) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (let idx = 0; idx < cols * rows; idx++) {
          const i = (idx % cols) * tileWidth;
          const j = ((idx / rows) | 0) * tileHeight;
          drawTile(context, i, j, tileWidth, tileHeight, {fill:false, stroke:false});
        }
        this.thatTile = (Math.random() * (cols * rows)) | 0;
        this.seenSeconds.push(gameTime);
      }
    }
  }

  const localStorageName = 'pocket-puzzles-settings';
  const canvas = document.getElementById('puzzle-canvas');
  const buffer = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: 'false' });
  const bufferContext = buffer.getContext('2d', { alpha: 'false' });

  let timer;
  let ratio = 2;
  let board = [];
  let tiles = [];
  const sounds = [];
  const audioContext = new AudioContext();
  const patterns = [];
  let frameIdx = 0;
  let gameMoves = 0;
  let timeController = true;
  let settings = {level: 0, gameIndex: 0, state: 1};
  let cols = (settings.level + 2) * 2;
  let rows = (settings.level + 2) * 2;
  let tileWidth = canvas.width / cols;
  let tileHeight = canvas.height / rows;
  const games = [new SlidePuzzle(), new PairsPuzzle(), new ThatTilePuzzle()];
  let game = games[settings.gameIndex];
  
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
    const start = document.timeline ? document.timeline.currentTime : performance.now();
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

  function setupCanvas() {
    ratio = window.devicePixelRatio || 2;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.style.width = canvas.offsetWidth + 'px';
    canvas.style.height = canvas.offsetHeight + 'px'; 
    buffer.width = canvas.width;
    buffer.height = canvas.height;
    tileWidth = canvas.width / cols;
    tileHeight = canvas.height / rows;
  }

  function updateDynamicTitle() {
    const title = document.getElementById('title');
    title.style.background = `url(logos/${Math.random() * 6 | 0}.svg)`;
    title.style.backgroundRepeat = 'no-repeat';
    title.style.backgroundSize = 'contain';
  }

  function handleCanvasInteraction(e) {
    // do not register move if the game is not on.
    if (!canvas || !game || !game.isPlaying()) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const i = (((e.clientX - rect.left) * scaleX) / tileWidth) | 0;
    const j = (((e.clientY - rect.top) * scaleY) / tileHeight) | 0;

    const move = game.makeMove(i, j);
    if (move) {
      gameMoves += move;
      playSound(settings.gameIndex);
    }
  }

  function initButtonListeners() {
    const buttons = document.getElementsByClassName('button');
    for (const button of buttons) {
      if (button.id === 'stop') button.addEventListener('click', stopGame); 
      else button.addEventListener('click', startGame);
    }
  }

  function setupDynamicTitle() {
    const title = document.getElementById('title');
    title.parentElement.addEventListener('mouseenter', updateDynamicTitle);
  }

  function startGame() {
    if (game && game.isPlaying()) stopGame();

    board = [];
    tiles = [];
    frameIdx = 0;
    gameMoves = 0;
    context.clearRect(0, 0, canvas.width, canvas.height);
    bufferContext.clearRect(0, 0, canvas.width, canvas.height);

    updateButtons();
    updateSettings();

    if (settings.state) {
      game.setup();
      timeController = true;
      animationInterval(1000 / 30, timeController, drawGame);
    }
  }

  function updateSettings() {
    const buttons = document.getElementsByClassName('button');
    for (const button of buttons) {
      const selected = button.dataset.selected === 'true';
      if (button.classList.contains('puzzle-level') && selected) {
        settings.level = Number(button.dataset.value);
        cols = rows = (settings.level + 2) * 2;
        tileWidth = canvas.width / cols;
        tileHeight = canvas.height / rows;
      }
      else if (button.classList.contains('puzzle-title') && selected) {
        settings.gameIndex = Number(button.dataset.value);
        game = games[settings.gameIndex];
      }
      else if (button.classList.contains('puzzle-state') && selected) {
        settings.state = Number(button.dataset.value);
      }
    }
    localStorage.setItem(localStorageName, JSON.stringify(settings));
  }

  function updateButtons() {
    if (event === undefined || event.target.type === undefined) {
      const localSettings = localStorage.getItem(localStorageName);
      if (localSettings === null || JSON.parse(localSettings).length === 0) localStorage.setItem(localStorageName, JSON.stringify(settings));
      else settings = JSON.parse(localSettings);

      const targetMap = {'puzzle-state': 'state', 'puzzle-level': 'level', 'puzzle-title': 'gameIndex'}
      for (const [key, value] of Object.entries(targetMap)) {
        const target = settings[value];
        const buttons = document.getElementsByClassName(key);
        for (const button of buttons) {
          if (Number(button.dataset.value) === target) {
            button.dataset.selected = 'true';
            button.style.background = window.getComputedStyle(button).borderColor;
          }
          else {
            button.dataset.selected = 'false';
            button.style.background = '#fbf8ef';
          }
        }
      }
    }
    else {
      const target = event.target;
      const buttons = target.parentElement.children;
      for (const button of buttons) {
        if (button.id === target.id) {
          button.dataset.selected = 'true';
          button.style.background = window.getComputedStyle(button).borderColor;
        }
        else {
          button.dataset.selected = 'false';
          button.style.background = '#fbf8ef';
        }
      }
    }
  }

  function stopGame() {
    if (!timeController) return;
    
    if (game && game.end()) {
      game.draw();
      timeController = false;
      window.clearTimeout(timer);
    }

    updateButtons();
    updateSettings();
  }

  function drawGame() {
    if (game.isPlaying()) {
      game.draw();
      frameIdx += 1 / 60; 
    } else {
      stopGame();
    }
  }
  
  function drawTile(c, x, y, w, h, params) {
    c.lineWidth = ratio;
    c.beginPath();
    if (params.fill) {
      c.fillStyle = params.fillColor;
      c.fillRect(x, y, w, h);
    }
    else {
      c.rect(x, y, w, h);
    }
    if (params.stroke) {
      c.strokeStyle = params.strokeColor;
      c.stroke();
    }
    c.closePath();
  }

  function loadPatterns() {
    for (let i = 0; i < 42; i++) {
      const image = new Image();
      image.src = `patterns/${i}.svg`;
      patterns.push(image);
    }
    shuffleArray(patterns);
  }

  function playSound(index) {
    if (index >= 0 && index < sounds.length) {
      const source = audioContext.createBufferSource();
      source.buffer = sounds[index];
      source.connect(audioContext.destination);
      source.start();
    }
    else {
      console.error('Invalid sound index');
    }
  }


  async function initSounds() {
    for (let i = 0; i < 3; i++) {
      const buffer = await loadSoundBuffer(`sounds/${i}.mp3`);
      sounds.push(buffer);
    }
  }

  async function loadSoundBuffer(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  }

  function fitScreen() {
    const deltaHeight = window.innerHeight - document.documentElement.scrollHeight;
    if (deltaHeight < 0) {
      const styles = window.getComputedStyle(document.body, null);
      document.body.style.paddingLeft = `${parseFloat(styles.paddingLeft) - deltaHeight / 2}px`;
      document.body.style.paddingRight = `${parseFloat(styles.paddingRight) - deltaHeight / 2}px`;
    }
  }

  fitScreen();
  updateDynamicTitle();
  initButtonListeners();
  loadPatterns();
  setupCanvas();
  initSounds();
  startGame();
  setupDynamicTitle();
  
  window.addEventListener('resize', setupCanvas);
  canvas.addEventListener('pointerdown', handleCanvasInteraction);

  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/pocket-puzzles/sw.js', {
      scope: '/pocket-puzzles/'
    });
  }
};
