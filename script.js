
// Board variables
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;
let containerWidth;
let containerHeight;
let scaleX;
let scaleY;

// Bird variables
// Larger size for better visibility with `messi.png`
let birdWidth = 60; // increased for visibility
let birdHeight = 42;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
};

// Pipes
let pipeArray = [];
let pipeWidth = 64; // width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

// Physics
let velocityX = -2; // pipes moving left speed
let velocityY = 0; // bird jump speed
let gravity = 0.4;

let gameOver = false;
let score = 0;
let gameStarted = false;
let touchHintElement;
let bgm;
let cameraSound;
let gameOverHandled = false;
let highScore = 0;

window.addEventListener('load', function() {
    initializeGame();
    handleResize();
    window.addEventListener('resize', handleResize);
});

function handleResize() {
    const gameContainer = document.getElementById('gameContainer');
    const rect = gameContainer.getBoundingClientRect();
    containerWidth = rect.width;
    containerHeight = rect.height;
    
    board.width = containerWidth;
    board.height = containerHeight;
    
    scaleX = containerWidth / boardWidth;
    scaleY = containerHeight / boardHeight;
    
    redraw();
}

function initializeGame() {
    board = document.getElementById('board');
    touchHintElement = document.getElementById('touchHint');
    bgm = document.getElementById('bgm');
    if (bgm) bgm.volume = 0.5; // Set volume to 50%
    cameraSound = document.getElementById('camera');
    if (cameraSound) cameraSound.volume = 0.9; // Camera sound a bit louder
    // Load stored high score (if available)
    try {
        const stored = localStorage.getItem('flappy_highscore');
        if (stored !== null) highScore = parseInt(stored, 10) || 0;
    } catch (e) {
        highScore = 0;
    }
    
    // Set initial canvas size
    const gameContainer = document.getElementById('gameContainer');
    const rect = gameContainer.getBoundingClientRect();
    containerWidth = rect.width;
    containerHeight = rect.height;
    
    board.width = containerWidth;
    board.height = containerHeight;
    
    scaleX = containerWidth / boardWidth;
    scaleY = containerHeight / boardHeight;
    
    context = board.getContext('2d'); // used for drawing on the board
    context.imageSmoothingEnabled = false;

    // Load images
    birdImg = new Image();
    birdImg.src = './messi.png';
    
    topPipeImg = new Image();
    topPipeImg.src = './toppipe.png';

    bottomPipeImg = new Image();
    bottomPipeImg.src = './bottompipe.png';

    // Add event listeners for touch and keyboard
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchend', handleTouchEnd, false);
    document.addEventListener('mousedown', handleMouseDown, false);
    document.addEventListener('keydown', moveBird, false);
    
    requestAnimationFrame(update);
    setInterval(placePipes, 1500); // every 1.5 seconds
}

function handleTouchStart(e) {
    e.preventDefault();
    if (!gameStarted) {
        gameStarted = true;
        touchHintElement.classList.add('hidden');
        if (bgm) bgm.play(); // Play music when game starts
    }
    velocityY = -6;
    if (gameOver) {
        resetGame();
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
}

function handleMouseDown(e) {
    if (e.button === 0) { // Left mouse button
        if (!gameStarted) {
            gameStarted = true;
            touchHintElement.classList.add('hidden');
            if (bgm) bgm.play(); // Play music when game starts
        }
        velocityY = -6;
        if (gameOver) {
            resetGame();
        }
    }
}

function redraw() {
    if (!birdImg.complete) return;
    context.clearRect(0, 0, board.width, board.height);
    context.save();
    context.shadowColor = 'rgba(0,0,0,0.6)';
    context.shadowBlur = 10 * Math.max(scaleX, scaleY);
    context.drawImage(birdImg, bird.x * scaleX, bird.y * scaleY, birdWidth * scaleX, birdHeight * scaleY);
    context.restore();
    
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        context.drawImage(pipe.img, pipe.x * scaleX, pipe.y * scaleY, pipe.width * scaleX, pipe.height * scaleY);
    }
}

function update() {
    requestAnimationFrame(update);
    
    if (!gameStarted) {
        context.clearRect(0, 0, board.width, board.height);
        context.save();
        context.shadowColor = 'rgba(0,0,0,0.6)';
        context.shadowBlur = 10 * Math.max(scaleX, scaleY);
        context.drawImage(birdImg, bird.x * scaleX, bird.y * scaleY, birdWidth * scaleX, birdHeight * scaleY);
        context.restore();
        context.fillStyle = 'white';
        context.font = Math.floor(32 * scaleX) + 'px Arial';
        context.fillText('Score: 0', board.width * 0.05, board.height * 0.1);
        return;
    }
    
    if (gameOver) {
        if (!gameOverHandled) {
            if (bgm && !bgm.paused) bgm.pause();
            if (cameraSound) { try { cameraSound.currentTime = 0; cameraSound.play(); } catch(e) {} }
            // Update high score once when entering game-over
            try {
                const finalScore = Math.floor(score);
                if (finalScore > highScore) {
                    highScore = finalScore;
                    localStorage.setItem('flappy_highscore', highScore);
                }
            } catch (e) {}
            gameOverHandled = true;
        }
        // Draw game over state
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, board.width, board.height);
        context.fillStyle = 'white';
        context.font = Math.floor(48 * scaleX) + 'px Arial';
        context.textAlign = 'center';
        context.fillText('GAME OVER', board.width / 2, board.height / 2 - 40 * scaleY);
        context.font = Math.floor(32 * scaleX) + 'px Arial';
        context.fillText('Score: ' + Math.floor(score), board.width / 2, board.height / 2 + 20 * scaleY);
        context.fillText('High Score: ' + highScore, board.width / 2, board.height / 2 + 60 * scaleY);
        context.font = Math.floor(24 * scaleX) + 'px Arial';
        context.fillText('TAP TO RESTART', board.width / 2, board.height / 2 + 110 * scaleY);
        context.textAlign = 'left';
        return;
    }
    
    context.clearRect(0, 0, board.width, board.height);

    // Bird physics
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0); // apply gravity to current bird.y, limit the bird.y to top of the canvas
    context.save();
    context.shadowColor = 'rgba(0,0,0,0.6)';
    context.shadowBlur = 10 * Math.max(scaleX, scaleY);
    context.drawImage(birdImg, bird.x * scaleX, bird.y * scaleY, birdWidth * scaleX, birdHeight * scaleY);
    context.restore();

    if (bird.y > boardHeight) {
        gameOver = true;
    }

    // Pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x * scaleX, pipe.y * scaleY, pipe.width * scaleX, pipe.height * scaleY);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5; // 0.5 because there are 2 pipes! so 0.5*2 = 1, 1 for each set of pipes
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            gameOver = true;
        }
    }

    // Clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift(); // removes first element from the array
    }

    // Score
    context.fillStyle = 'white';
    context.font = Math.floor(45 * scaleX) + 'px Arial';
    context.textAlign = 'left';
    context.fillText(Math.floor(score), board.width * 0.05, board.height * 0.08);
}

function placePipes() {
    if (gameOver) {
        return;
    }

    //(0-1) * pipeHeight/2.
    // 0 -> -128 (pipeHeight/4)
    // 1 -> -128 - 256 (pipeHeight/4 - pipeHeight/2) = -3/4 pipeHeight
    let randomPipeY = pipeY - pipeHeight/4 - Math.random()*(pipeHeight/2);
    let openingSpace = board.height/4;

    let topPipe = {
        img : topPipeImg,
        x : pipeX,
        y : randomPipeY,
        width : pipeWidth,
        height : pipeHeight,
        passed : false
    }
    pipeArray.push(topPipe);

    let bottomPipe = {
        img : bottomPipeImg,
        x : pipeX,
        y : randomPipeY + pipeHeight + openingSpace,
        width : pipeWidth,
        height : pipeHeight,
        passed : false
    }
    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    if (e.code == 'Space' || e.code == 'ArrowUp' || e.code == 'KeyX') {
        e.preventDefault();
        if (!gameStarted) {
            gameStarted = true;
            touchHintElement.classList.add('hidden');
            if (bgm) bgm.play(); // Play music when game starts
        }
        velocityY = -6;
        if (gameOver) {
            resetGame();
        }
    }
}

function resetGame() {
    bird.y = birdY;
    bird.x = birdX;
    pipeArray = [];
    score = 0;
    gameOver = false;
    velocityY = 0;
    // Stop camera sound and reset its flag so it can play again on the next game-over
    if (cameraSound) { try { cameraSound.pause(); cameraSound.currentTime = 0; } catch(e) {} }
    gameOverHandled = false;
    if (bgm) { bgm.currentTime = 0; bgm.play(); } // Restart music from beginning
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}