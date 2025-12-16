let fireworks = [];
let textFireworks = [];
let gravity;
let isCardActive = false;
let wishPhrase = "";
let textSequence = [];
let lastTextLaunchTime = 0;

function setup() {
    // Create canvas and attach to the specific container
    let container = document.getElementById('canvas-container');
    // Initial size might be 0 if hidden, so we default to window dimensions if needed
    // but better to resize when shown.
    let w = container.offsetWidth || windowWidth;
    let h = container.offsetHeight || windowHeight;

    let canvas = createCanvas(w, h);
    canvas.parent('canvas-container');

    colorMode(HSB);
    gravity = createVector(0, 0.2);
    stroke(255);
    strokeWeight(4);
    // No initial background to let CSS show through initially? 
    // Actually, we want to control the gradient in p5 for trails.
    drawGradient();

    setupUI();
}

function draw() {
    // Only draw if the card page is active to save resources
    if (!isCardActive) return;

    // Draw semi-transparent gradient to create trails
    // We use drawingContext to create a linear gradient
    let ctx = drawingContext;
    let gradient = ctx.createLinearGradient(0, 0, 0, height);
    // Purple at top (#6a11cb) to White at bottom (#ffffff)
    // We add opacity (alpha) to allow trails
    gradient.addColorStop(0, 'rgba(106, 17, 203, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    colorMode(RGB);

    // Randomly launch fireworks
    if (random(1) < 0.03) {
        fireworks.push(new Firework());
    }

    // Trigger text sequence randomly if not currently running
    if (wishPhrase && textSequence.length === 0 && random(1) < 0.002) {
        prepareTextSequence(wishPhrase);
    }

    // Process text sequence
    if (textSequence.length > 0 && millis() - lastTextLaunchTime > 150) {
        let item = textSequence.shift();
        // Only launch if it's not a space (spaces just add delay)
        if (item.char.trim() !== "") {
            textFireworks.push(new TextFirework(item.char, item.x));
        }
        lastTextLaunchTime = millis();
    }

    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();

        if (fireworks[i].done()) {
            fireworks.splice(i, 1);
        }
    }

    for (let i = textFireworks.length - 1; i >= 0; i--) {
        textFireworks[i].update();
        textFireworks[i].show();

        if (textFireworks[i].done()) {
            textFireworks.splice(i, 1);
        }
    }
}

function prepareTextSequence(text) {
    textSequence = [];
    // Calculate spacing to center the text
    // Estimate width per char (rough approx)
    let charWidth = width / 15;
    if (charWidth > 40) charWidth = 40;

    let totalWidth = text.length * charWidth;
    let startX = (width - totalWidth) / 2 + charWidth / 2;

    for (let i = 0; i < text.length; i++) {
        textSequence.push({
            char: text[i],
            x: startX + (i * charWidth)
        });
    }
}

function drawGradient() {
    let ctx = drawingContext;
    let gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgb(106, 17, 203)');
    gradient.addColorStop(1, 'rgb(255, 255, 255)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function windowResized() {
    let container = document.getElementById('canvas-container');
    if (container) {
        resizeCanvas(container.offsetWidth, container.offsetHeight);
        drawGradient();
    }
}

function mousePressed() {
    // Only trigger if card is active and clicking on the canvas area
    // We can check if the click is within the canvas bounds, but since the canvas covers the background,
    // we just check if isCardActive.
    if (isCardActive && mouseY < height * 0.8) { // Avoid clicking through the text area if possible
        fireworks.push(new Firework());
    }
}

// --- Firework Class ---
class Firework {
    constructor() {
        this.hu = random(255);
        this.firework = new Particle(random(width), height, this.hu, true);
        this.exploded = false;
        this.particles = [];
    }

    done() {
        return this.exploded && this.particles.length === 0;
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();

            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();

            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }

        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }
}

// --- Text Firework Class ---
class TextFirework {
    constructor(char, x) {
        this.char = char;
        this.pos = createVector(x, height);
        // Higher rise: increased velocity (more negative y)
        this.vel = createVector(0, random(-15, -12));
        this.acc = createVector(0, 0.2);
        this.exploded = false;
        this.lifespan = 255;
        this.scale = 1;
        this.hue = random(255); // Assign random hue for this character
        this.color = color(255, 215, 0);
    }

    update() {
        if (!this.exploded) {
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            if (this.vel.y >= 0) {
                this.exploded = true;
            }
        } else {
            // Explode effect: grow slower and smaller
            this.scale += 0.05; // Reduced from 0.15
            this.lifespan -= 3;
        }
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);
        textAlign(CENTER, CENTER);
        noStroke();

        let alphaVal = this.lifespan;

        if (!this.exploded) {
            // Rising phase
            colorMode(HSB);
            fill(this.hue, 180, 255); // Use the assigned hue

            textSize(16);
            text(this.char, 0, 10);
        } else {
            // Exploded phase
            fill(255, 215, 0, alphaVal);
            // Smaller max size
            textSize(12 * this.scale);
            drawingContext.shadowBlur = 50;
            // drawingContext.shadowColor = 'rgba(255, 215, 0, 0.5)';
            text(this.char, 0, 0);
            drawingContext.shadowBlur = 0;
        }
        pop();
    }

    done() {
        return this.lifespan < 0;
    }
}

// --- Particle Class ---
class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        this.firework = firework;
        this.lifespan = 255;
        this.hu = hu;
        this.acc = createVector(0, 0);

        if (this.firework) {
            // Launch higher to reach the top section
            this.vel = createVector(0, random(-18, -12));
        } else {
            this.vel = p5.Vector.random2D();
            // Larger explosion spread
            this.vel.mult(random(5, 15));
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            this.vel.mult(0.9);
            this.lifespan -= 4;
        }

        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    done() {
        return this.lifespan < 0;
    }

    show() {
        colorMode(HSB);

        if (!this.firework) {
            // Larger explosion particles
            strokeWeight(4);
            stroke(this.hu, 255, 255, this.lifespan / 255);
        } else {
            // Larger rocket particle
            strokeWeight(6);
            stroke(this.hu, 255, 255);
        }

        point(this.pos.x, this.pos.y);
    }
}

// --- UI Logic ---
function setupUI() {
    const landingPage = document.getElementById('landing-page');
    const cardPage = document.getElementById('card-page');
    const createBtn = document.getElementById('createBtn');
    const backBtn = document.getElementById('backBtn');

    const nameInput = document.getElementById('nameInput');
    const msgInput = document.getElementById('messageInput');
    const displayName = document.getElementById('displayName');
    const displayWish = document.getElementById('displayWish');

    createBtn.addEventListener('click', () => {
        // Get values
        const name = nameInput.value.trim() || "Friend";
        const userPhrase = msgInput.value.trim() || "행복 가득한";

        // Store phrase for fireworks
        wishPhrase = `${userPhrase} 2026년`;

        // Construct the full message
        const fullMessage = `새로운 한 해가 찾아왔습니다.<br>바쁜 순간 속에서도 잠시 숨 돌릴 수 있는 여유가 있고,<br>${userPhrase} 한 해가 되시길 바랍니다.<br>늘 응원하는 마음으로 인사드리며,<br>올해도 건강과 행복이 함께하시길 바랍니다.<br>새해 복 많이 받으세요!`;

        // Set values
        displayName.textContent = name;
        displayWish.innerHTML = fullMessage;

        // Transition
        landingPage.classList.remove('active');
        landingPage.classList.add('hidden');

        setTimeout(() => {
            cardPage.classList.remove('hidden');
            cardPage.classList.add('active');
            isCardActive = true;

            // Resize canvas to ensure it fits correctly now that it's visible
            windowResized();

            // Launch celebration fireworks
            for (let i = 0; i < 5; i++) {
                setTimeout(() => fireworks.push(new Firework()), i * 300);
            }

            // Trigger text sequence
            setTimeout(() => prepareTextSequence(wishPhrase), 1000);
        }, 500);
    });

    backBtn.addEventListener('click', () => {
        cardPage.classList.remove('active');
        cardPage.classList.add('hidden');
        isCardActive = false;

        setTimeout(() => {
            landingPage.classList.remove('hidden');
            landingPage.classList.add('active');
        }, 500);
    });

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.addEventListener('click', () => {
        // Hide buttons for capture
        const btnGroup = document.querySelector('.button-group');
        btnGroup.style.display = 'none';

        // Capture the card page
        // We capture document.body to ensure background gradient is included if needed,
        // but since we draw gradient on canvas, capturing cardPage is better to avoid landing page artifacts if any.
        // However, cardPage has transparent background. The body has the stripes.
        // Let's capture the body but ensure we are scrolled to top.

        html2canvas(document.body, {
            backgroundColor: null, // Preserve transparency/background
            scale: 2 // Higher quality
        }).then(canvas => {
            // Restore buttons
            btnGroup.style.display = 'flex';

            // Trigger download
            let link = document.createElement('a');
            link.download = '2026_New_Year_Card.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            console.error("Capture failed:", err);
            btnGroup.style.display = 'flex';
        });
    });
}
