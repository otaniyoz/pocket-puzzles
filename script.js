'use strict';
window.onload = () => {
  class SlidePuzzle {
    constructor() {
      this.finalTile;
      this.moves = [];
    }

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
        settings.gameData.moves = JSON.stringify(this.moves);
        localStorage.setItem(localStorageName, JSON.stringify(settings));
        return 1;
      }
      return 0;
    }

    setup() {
      let pattern;
      if (event && ['resize', 'load'].includes(event.type) && Object.keys(settings.gameData).length !== 0) {
        board = settings.gameData.board;
        for (let idx = 0; idx < cols * rows; idx++) {
          tiles[idx] = {index: idx, x: (idx % cols) * tileWidth, y: ((idx / rows) | 0) * tileHeight};
        }
        this.finalTile = settings.gameData.finalTile;
        this.moves = JSON.parse(settings.gameData.moves);
        pattern = patterns.filter((pattern) => pattern.src.split('/').pop() === settings.gameData.pattern)[0];
      }
      else {
        this.moves = [];
        for (let idx = 0; idx < cols * rows; idx++) {
          board.push(idx);
          tiles[idx] = {index: idx, x: (idx % cols) * tileWidth, y: ((idx / rows) | 0) * tileHeight};
        }
        this.finalTile = tiles.pop();
        board.pop();
        board.push(-1);
        this.moves = this._shuffle();
        pattern = patterns[Math.random() * patterns.length | 0];
        settings.gameData = {pattern: pattern.src.split('/').pop(), board: board, finalTile: this.finalTile, moves: JSON.stringify(this.moves)};
      }
      localStorage.setItem(localStorageName, JSON.stringify(settings));
      bufferContext.drawImage(pattern, 0, 0, pattern.width, pattern.height, 0, 0, canvas.width, canvas.height);
      if (settings.state) this.draw();
    }

    end() {
      while (this.moves.length) {
        const m = this.moves.pop();
        [board[m[1]], board[m[0]]] = [board[m[0]], board[m[1]]];
      }
      tiles.push(this.finalTile);
      board[board.indexOf(-1)] = board.length - 1;
      return true;
    }

    isPlaying() {
      const n = board.length - 1;
      const ks = [...Array(n + 1).keys()];
      for (let i = 0; i < n; i++) {
        if (board[i] !== ks[i]) return true;
      }
      return false;
    }

    draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);

      const m = cols * rows;
      for (let idx = 0; idx < m; idx++) {
        const tile = board[idx];
        const i = (idx % cols) * tileWidth;
        const j = ((idx / rows) | 0) * tileHeight;

        if (tile === -1) {
          drawTile(context, i, j, tileWidth, tileHeight, {fill: true, stroke: false, fillColor: '#111'});
          continue;
        }

        context.drawImage(buffer, tiles[tile].x, tiles[tile].y, tileWidth, tileHeight, i, j, tileWidth, tileHeight);
      }
    }
  }

  class PairsPuzzle {
    constructor() {
      this.flipped = [];
      this.seenSeconds = [];
      this.pairs = {};
    }

    makeMove(i, j) {
      const idx = i + j * cols;
      if (!this.flipped[idx]) {
        this.flipped[idx] = 1;
        settings.gameData.moves = JSON.stringify(this.flipped);
        localStorage.setItem(localStorageName, JSON.stringify(settings));
        return 1;
      }
      return 0;
    }

    setup() {
      this.seenSeconds = [];
      if (event && ['resize', 'load'].includes(event.type) && Object.keys(settings.gameData).length !== 0) {
        this.flipped = settings.gameData.flipped;
        this.pairs = settings.gameData.pairs;
        board = settings.gameData.board;
        for (let idx = 0; idx < cols * rows; idx++) {
          const i = (idx % cols) * tileWidth;
          const j = ((idx / rows) | 0) * tileHeight;
          const pattern = patterns[board[idx]];
          bufferContext.drawImage(pattern, 0, 0, pattern.width, pattern.height, i, j, tileWidth, tileHeight);
        }
      }
      else {
        this.flipped = [];
        this.pairs = {};

        const m = cols * rows;
        for (let idx = 0; idx < m; idx++) {
          board.push((idx / 2) | 0);
        }
        shuffleArray(board);

        for (let idx = 0; idx < m; idx++) {
          if (!(board[idx] in this.pairs)) this.pairs[board[idx]] = [];
          
          const pair = this.pairs[board[idx]];
          pair.push(idx);

          const i = (idx % cols) * tileWidth;
          const j = ((idx / rows) | 0) * tileHeight;

          const pattern = patterns[board[idx]];
          bufferContext.drawImage(pattern, 0, 0, pattern.width, pattern.height, i, j, tileWidth, tileHeight);

          this.flipped.push(0);
        }

        settings.gameData = {board: board, pairs: this.pairs, flipped: this.flipped};
      }
      localStorage.setItem(localStorageName, JSON.stringify(settings));
      if (settings.state) this.draw();
    }

    end() {
      const m = cols * rows;
      for (let i = 0; i < m; i++) {
        this.flipped[i] = 1;
      }
      return true;
    }

    isPlaying() {
      return this.flipped.includes(0);
    }

    draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);

      const m = cols * rows;
      for (let idx = 0; idx < m; idx++) {
        const i = (idx % cols) * tileWidth;
        const j = ((idx / rows) | 0) * tileHeight;
        drawTile(context, i, j, tileWidth, tileHeight, {fill:false, stroke:false});
        if (this.flipped[idx]) context.drawImage(buffer, i, j, tileWidth, tileHeight, i, j, tileWidth, tileHeight);
        const gameTime = frameIdx | 0;
        if (!this.seenSeconds.includes(gameTime) && gameTime % 2 === 0) {
          for (let [k, v] of Object.entries(this.pairs)) {
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
      this.seenSeconds = [];
      this.thatTile = 0;
    }

    makeMove(i, j) {
      return Number((((this.thatTile % cols) === i) && (((this.thatTile / rows) | 0) === j)));
    }

    setup() {
      this.seenSeconds = [];
      this.thatTile = (Math.random() * (cols * rows)) | 0;
      localStorage.setItem(localStorageName, JSON.stringify(settings));
    }

    end() {
      settings.state = 0;
      localStorage.setItem(localStorageName, JSON.stringify(settings));
      return true;
    }

    isPlaying() {
      return settings.state;
    }

    draw() {
      if (!settings.state) return;

      const m = cols * rows;
      const gameTime = frameIdx | 0;
      const v = (Math.random() * (patterns.length - 1)) | 0 + 1;

      if (!this.seenSeconds.includes(gameTime) && gameTime % 2 === 0) {
        const pattern1 = patterns[v];
        const pattern2 = patterns[v - 1];
        const ii = (this.thatTile % cols) * tileWidth;
        const jj = ((this.thatTile / rows) | 0) * tileHeight;
        for (let idx = 0; idx < m; idx++) {
          const i = (idx % cols) * tileWidth;
          const j = ((idx / rows) | 0) * tileHeight;
          if (ii === i && jj === j) continue;
          drawTile(context, i, j, tileWidth, tileHeight, {fill:false, stroke:false});
          context.drawImage(pattern1, 0, 0, pattern1.width, pattern1.height, i, j, tileWidth, tileHeight);
        }
        context.drawImage(pattern2, 0, 0, pattern2.width, pattern2.height, ii, jj, tileWidth, tileHeight);
      } 
      else if (!this.seenSeconds.includes(gameTime) && gameTime % 2 !== 0) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (let idx = 0; idx < m; idx++) {
          const i = (idx % cols) * tileWidth;
          const j = ((idx / rows) | 0) * tileHeight;
          drawTile(context, i, j, tileWidth, tileHeight, {fill:false, stroke:false});
        }
        this.thatTile = (Math.random() * m) | 0;
      }
      this.seenSeconds.push(gameTime);
    }
  }

  const sounds = [];
  const audioContext = new AudioContext();
  const games = [new SlidePuzzle(), new PairsPuzzle(), new ThatTilePuzzle()];
  const localStorageName = 'pocket-puzzles-settings';
  const canvas = document.getElementById('canvas');
  const buffer = document.getElementById('buffer');
  const context = canvas.getContext('2d', { alpha: 'false', willReadFrequently: 'true' });
  const bufferContext = buffer.getContext('2d', { alpha: 'false', willReadFrequently: 'true' });
  let timer;
  let board = [];
  let tiles = [];
  let patterns = [];
  let frameIdx = 0;
  let gameMoves = 0;
  let ratio = 2;
  let settings = { level: 0, title: 0, state: 1, gameData: { } };
  let cols = (settings.level + 2) * 2;
  let rows = (settings.level + 2) * 2;
  let tileWidth = canvas.width / cols;
  let tileHeight = canvas.height / rows;
  let game = games[settings.title];
  
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

  function handleCanvasInteraction(e) {
    if (!canvas || !game || !game.isPlaying() || !settings.state) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const i = ((e.clientX - rect.left) * scaleX / tileWidth) | 0;
    const j = ((e.clientY - rect.top) * scaleY / tileHeight) | 0;

    const move = game.makeMove(i, j);
    if (move) {
      gameMoves += move;
      playSound(settings.title);
    }
  }

  function addListeners() {
    const buttons = document.getElementById('buttons');

    window.addEventListener('resize', fitScreen);
    buttons.addEventListener('click', handleButtonPress);
    canvas.addEventListener('pointerdown', handleCanvasInteraction);
  }

  function handleButtonPress(event) {
    if (event.target.checked) { // prevent duplicate events
      if (event.target.id === 'stop') stopGame();
      else startGame();
    }
  }

  function init() {
    const userSettings = localStorage.getItem(localStorageName);
    if (userSettings === null || Object.keys(JSON.parse(userSettings)).length === 0 || !JSON.parse(userSettings).gameData) {
      localStorage.setItem(localStorageName, JSON.stringify(settings));
    }
    else {
      const mapState = ['stop', 'start'];
      const mapTitle = ['slide', 'pairs', 'that'];
      const mapLevel = ['easy', 'medium', 'hard'];
      
      settings = JSON.parse(userSettings);
      document.getElementById(mapTitle[settings.title]).checked = true;
      document.getElementById(mapLevel[settings.level]).checked = true;
      document.getElementById(mapState[settings.state]).checked = true;
      cols = (settings.level + 2) * 2;
      rows = (settings.level + 2) * 2;
      tileWidth = canvas.width / cols;
      tileHeight = canvas.height / rows;
      game = games[settings.title];
      if (Object.keys(settings.gameData).length !== 0) {
        if (game.title === 0) {
          board = settings.gameData.board;
          game.moves = settings.gameData.moves;
          game.finalTile = settings.gameData.finalTile;
        }
        else if (game.title === 1) {
          board = settings.gameData.board;
          game.flipped = settings.gameData.flipped;
          game.pairs = settings.gameData.pairs;
        }
      }
    }
  }

  function updateSettings() {
    if (!event) return;

    const button = event.target;
    const value = Number(button.value);

    if (button.name === 'level') {
      settings.level = value;
      cols = rows = (settings.level + 2) * 2;
      tileWidth = canvas.width / cols;
      tileHeight = canvas.height / rows;
    }
    else if (button.name === 'title') {
      settings.title = value;
      game = games[settings.title];
    }
    else if (button.name === 'state') {
      settings.state = value;
    }

    localStorage.setItem(localStorageName, JSON.stringify(settings));
  }

  function startGame() {
    board = [];
    tiles = [];
    frameIdx = 0;
    gameMoves = 0;
    context.clearRect(0, 0, canvas.width, canvas.height);
    bufferContext.clearRect(0, 0, canvas.width, canvas.height);

    if (event && event.type === 'click') {
      if (game && game.isPlaying()) stopGame();
      updateSettings();
    }

    game.setup();
    animationInterval(1000 / 30, settings.state, drawGame);
  }

  function stopGame() {
    if (!settings.state) return;
    
    if (game && game.end()) {
      game.draw();
      window.clearTimeout(timer);
    }

    updateSettings();
  }

  function drawGame() {
    if (game.isPlaying()) {      
      game.draw();
      frameIdx += 1 / 30; 
    }
    else {
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
    patterns = [...document.getElementsByClassName('pattern')];
    shuffleArray(patterns);
  }

  function playSound(index) {
    if (index < 0 || index >= sounds.length) return; 

    const source = audioContext.createBufferSource();
    source.buffer = sounds[index];
    source.connect(audioContext.destination);
    source.start();
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
    let canvasSize;
    let targetSize;
    let availableSpace;
    const canvasMargin = 8;
    const bodyPadding = 32;
    const titleContainerHeight = 40 + 8;
    const bodyDimensions = document.body.getBoundingClientRect();
    const buttonsDimensions = document.getElementById('buttons').getBoundingClientRect();

    if (window.innerHeight > window.innerWidth) {
      targetSize = bodyDimensions.width - bodyPadding;
      availableSpace = window.innerHeight - buttonsDimensions.height - bodyPadding - titleContainerHeight;
    }
    else {
      targetSize = bodyDimensions.height  - bodyPadding - titleContainerHeight;
      availableSpace = bodyDimensions.width - buttonsDimensions.width - bodyPadding;
    }

    canvasSize = Math.min(targetSize, availableSpace - canvasMargin);
    ratio = window.devicePixelRatio || 2;
    canvas.width = canvasSize * ratio;
    canvas.height = canvasSize * ratio;
    canvas.style.width = canvasSize + 'px';
    canvas.style.height = canvasSize + 'px'; 
    buffer.width = canvas.width;
    buffer.height = canvas.height;
    tileWidth = canvas.width / cols;
    tileHeight = canvas.height / rows;
    
    startGame();
  }

  init();
  initSounds();
  loadPatterns();
  addListeners();
  fitScreen();

  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/pocket-puzzles/sw.js', {
      scope: '/pocket-puzzles/'
    });
  }
};
