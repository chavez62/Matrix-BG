// Matrix rain effect using canvas
document.addEventListener('DOMContentLoaded', () => {
  // Get the canvas element and its context
  const canvas = document.getElementById('matrix-canvas');
  const ctx = canvas.getContext('2d', { alpha: false }); // Optimization: alpha: false for better performance

  // Color themes
  const themes = {
    classic: {
      name: 'Classic Matrix',
      background: 'rgba(0, 0, 0, 0.05)',
      leadColor: [0, 255, 0],      // Bright green
      trailColor: [0, 180, 0],     // Darker green
      fadeOpacity: 0.05,
    },
    blue: {
      name: 'Blue Tech',
      background: 'rgba(0, 0, 10, 0.05)',
      leadColor: [0, 180, 255],    // Bright cyan/blue
      trailColor: [0, 80, 180],    // Darker blue
      fadeOpacity: 0.05,
    },
    amber: {
      name: 'Amber Terminal',
      background: 'rgba(0, 0, 0, 0.05)',
      leadColor: [255, 180, 0],    // Bright amber
      trailColor: [180, 100, 0],   // Darker amber
      fadeOpacity: 0.05,
    },
    pink: {
      name: 'Cyberpunk',
      background: 'rgba(10, 0, 10, 0.05)',
      leadColor: [255, 50, 255],   // Bright pink
      trailColor: [180, 0, 180],   // Darker pink/purple
      fadeOpacity: 0.05,
    },
    rainbow: {
      name: 'Rainbow',
      background: 'rgba(0, 0, 0, 0.05)',
      leadColor: [255, 255, 255],  // White (will be colorized)
      trailColor: [180, 180, 180], // Gray (will be colorized)
      fadeOpacity: 0.05,
      isRainbow: true,
    },
    monochrome: {
      name: 'Monochrome',
      background: 'rgba(0, 0, 0, 0.05)',
      leadColor: [220, 220, 220],  // Light gray
      trailColor: [150, 150, 150], // Dark gray
      fadeOpacity: 0.05,
    }
  };

  // Default theme
  let currentTheme = themes.classic;

  // Text overlay options
  let overlayText = '';
  let showOverlay = false;
  let overlaySize = 'medium';
  let overlayPosition = 'center';

  // Set canvas to full window size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Reset the matrix when resizing
    initMatrix();
  }

  // Characters to be displayed (mixture of katakana, latin, and digits)
  // Properly encoded Japanese katakana characters for the matrix effect
  const katakana = '\u30A2\u30A4\u30A6\u30A8\u30AA\u30AB\u30AD\u30AF\u30B1\u30B3\u30B5\u30B7\u30B9\u30BB\u30BD\u30BF\u30C1\u30C4\u30C6\u30C8\u30CA\u30CB\u30CC\u30CD\u30CE\u30CF\u30D2\u30D5\u30D8\u30DB\u30DE\u30DF\u30E0\u30E1\u30E2\u30E4\u30E6\u30E8\u30E9\u30EA\u30EB\u30EC\u30ED\u30EF\u30F2\u30F3';
  const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,./<>?';
  const chars = katakana + latin + digits + specialChars;

  // Matrix variables
  let drops = []; // Array of drops
  const fontSize = 16;
  let columns; // Number of columns
  let lastWaveTime = 0; // Track when the last wave was generated
  const waveCooldown = 5000; // Milliseconds between major waves
  const minActiveDensity = 0.7; // Minimum ratio of active columns
  
  // Performance optimization: Precomputed values
  const charPatterns = new Array(100).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]);
  function getRandomChar() {
    // Use precomputed patterns most of the time, but occasionally get a new random char
    return Math.random() > 0.2 ? 
      charPatterns[Math.floor(Math.random() * charPatterns.length)] : 
      chars[Math.floor(Math.random() * chars.length)];
  }

  // Initialize the matrix
  function initMatrix() {
    // Calculate number of columns based on canvas width and font size
    columns = Math.floor(canvas.width / fontSize);
    
    // Reset drops array
    drops = [];
    
    // Initialize with a good distribution for a fuller initial effect
    for (let i = 0; i < columns; i++) {
      drops[i] = createDrop(i);
      
      // Distribute initial drops across the entire canvas height
      // This creates a more full effect from the start
      if (i % 4 === 0) {
        // 25% of drops start in the top quarter
        drops[i].y = Math.random() * -canvas.height * 0.25;
      } else if (i % 4 === 1) {
        // 25% of drops start in the second quarter
        drops[i].y = canvas.height * 0.25 + Math.random() * canvas.height * 0.25;
      } else if (i % 4 === 2) {
        // 25% of drops start in the third quarter
        drops[i].y = canvas.height * 0.5 + Math.random() * canvas.height * 0.25;
      } else {
        // 25% of drops start in the bottom quarter
        drops[i].y = canvas.height * 0.75 + Math.random() * canvas.height * 0.25;
      }
      
      // Preload some characters for drops that start visible on screen
      if (drops[i].y >= 0 && drops[i].y < canvas.height) {
        const numChars = Math.floor(Math.random() * 20) + 5;
        for (let j = 0; j < numChars; j++) {
          if (drops[i].y - j * fontSize >= 0) {
            drops[i].chars.unshift({
              value: getRandomChar(),
              age: Math.random() * 10, // Slightly aged to create variation
              hue: Math.random() * 360  // For rainbow theme
            });
          }
        }
      }
    }
    
    // Reset wave timer
    lastWaveTime = Date.now();
  }
  
  // Create a new drop with randomized properties
  function createDrop(columnIndex, yPos = null) {
    return {
      y: yPos !== null ? yPos : Math.random() * -100 - 50, // Default to above screen
      speed: Math.random() * 0.7 + 0.3 + (Math.random() > 0.9 ? 0.5 : 0), // Occasional fast drops
      lastUpdate: 0,
      updateFrequency: Math.random() * 10 + 5,
      chars: [], // Array of characters in this column
      respawnRate: Math.random() * 0.03 + 0.01, // Further increased respawn rate for better continuous flow
      columnIndex: columnIndex, // Store column index for reference
      // Add variation in drop length
      maxLength: Math.floor(Math.random() * 30) + 10,
      // Active status - some drops can be inactive but ready to be reactivated
      active: true,
      // Column-specific hue for rainbow effect
      baseHue: Math.random() * 360
    };
  }

  // Check and maintain the density of active drops
  function maintainDropDensity() {
    let activeCount = 0;
    
    // Count active drops in the top portion of the screen
    for (let i = 0; i < drops.length; i++) {
      if (drops[i].y < fontSize * 2 && drops[i].active) {
        activeCount++;
      }
    }
    
    // Calculate current density
    const currentDensity = activeCount / columns;
    
    // If density is too low, activate more drops
    // Always ensure there are at least some active columns to prevent animation from stopping
    if (currentDensity < minActiveDensity || activeCount < 5) {
      // Find inactive drops or create new ones at the top
      for (let i = 0; i < drops.length && activeCount < minActiveDensity * columns; i++) {
        if (!drops[i].active || drops[i].y > canvas.height) {
          // Reset this drop to the top
          drops[i] = createDrop(i);
          activeCount++;
        }
      }
    }
  }
  
  // Generate a new wave of drops from the top
  function generateWave() {
    const now = Date.now();
    
    // Check if it's time for a new wave
    if (now - lastWaveTime > waveCooldown) {
      // Reset 30-40% of drops to create a wave effect
      const waveSize = Math.floor(columns * (0.3 + Math.random() * 0.1));
      const startCol = Math.floor(Math.random() * (columns - waveSize));
      
      for (let i = 0; i < waveSize; i++) {
        const colIndex = (startCol + i) % columns;
        // Only reset if drop is in lower half of screen or off screen
        if (drops[colIndex].y > canvas.height / 2 || drops[colIndex].y > canvas.height) {
          drops[colIndex] = createDrop(colIndex);
          // Stagger the starting positions slightly
          drops[colIndex].y = -fontSize * (Math.random() * 10);
        }
      }
      
      lastWaveTime = now;
    }
  }
  
  // Performance variables
  let lastRenderTime = 0;
  const targetFPS = 60;
  const frameInterval = 1000 / targetFPS;
  
  // Get character color based on the current theme
  function getCharColor(j, age, hue = 0) {
    const theme = currentTheme;
    
    // Calculate opacity based on position and age
    const opacity = j === 0 ? 1 : Math.max(0, 1 - (j / 20) - (age / 100));
    
    // For rainbow theme, use HSL color
    if (theme.isRainbow) {
      const h = (hue + j * 8) % 360;
      const s = j === 0 ? 100 : Math.max(60, 100 - (j * 3));
      const l = j === 0 ? 70 : Math.max(20, 60 - (j * 2));
      return `hsla(${h}, ${s}%, ${l}%, ${opacity})`;
    } 
    
    // For other themes, use RGB
    const [r, g, b] = j === 0 ? theme.leadColor : theme.trailColor;
    
    // Adjust brightness based on position
    const brightness = 1 - (j / 15);
    
    return `rgba(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)}, ${opacity})`;
  }
  
  // Draw function for matrix effect
  function draw(timestamp) {
    // Performance optimization: Limit rendering to target FPS
    if (timestamp - lastRenderTime < frameInterval) {
      requestAnimationFrame(draw);
      return;
    }
    
    lastRenderTime = timestamp;
    
    // Semi-transparent black background to create trail effect
    ctx.fillStyle = currentTheme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Maintain drop density and generate waves periodically
    // Optimization: Don't run these checks every frame
    if (timestamp % 5 === 0) {
      maintainDropDensity();
      generateWave();
    }
    
    // Performance optimization: Fast check for active drops
    let totalActiveDrops = 0;
    for (let i = 0; i < drops.length; i++) {
      if (drops[i].active && drops[i].chars.length > 0) {
        totalActiveDrops++;
        if (totalActiveDrops >= 10) break;
      }
    }
    
    // Failsafe: If not enough drops are active, force creation of new ones
    if (totalActiveDrops < 10) {
      for (let i = 0; i < columns; i += 3) {
        drops[i] = createDrop(i);
      }
    }
    
    // Performance optimization: Prepare font once
    ctx.font = `${fontSize}px monospace`;
    
    // For each column
    for (let i = 0; i < drops.length; i++) {
      const drop = drops[i];
      const x = i * fontSize;
      
      // Only process visible drops or those about to be visible
      if (drop.y > -fontSize && drop.y < canvas.height + fontSize) {
        
        // Process characters in this column
        for (let j = 0; j < drop.chars.length; j++) {
          const charY = drop.y - j * fontSize;
          
          // Only draw visible characters
          if (charY > -fontSize && charY < canvas.height) {
            const char = drop.chars[j].value;
            const age = drop.chars[j].age;
            const hue = currentTheme.isRainbow ? (drop.baseHue + age) % 360 : 0;
            
            // Set color based on theme and character position
            ctx.fillStyle = getCharColor(j, age, hue);
            
            // Draw the character
            ctx.fillText(char, x, charY);
            
            // Age the character
            drop.chars[j].age += 0.2;
            
            // Randomly change characters as they fall (excluding the head)
            // Optimization: reduced frequency of character changes
            if (j > 0 && Math.random() > 0.99) {
              drop.chars[j].value = getRandomChar();
            }
          }
        }
      }
      
      // Update drop position
      drop.y += drop.speed;
      
      // Add a new character at the head of the column with some probability
      if (drop.y >= 0 && (drop.chars.length === 0 || drop.y - (drop.chars.length - 1) * fontSize >= fontSize)) {
        drop.chars.unshift({
          value: getRandomChar(),
          age: 0,
          hue: Math.random() * 360 // For rainbow theme
        });
      }
      
      // Limit max length of a column to prevent overly long trails
      if (drop.chars.length > drop.maxLength) {
        drop.chars.pop();
      }
      
      // Remove characters that have moved off-screen and faded out
      // Optimization: Only check removal every few frames
      if (i % 3 === 0) {
        while (drop.chars.length > 0 && 
               (drop.y - (drop.chars.length - 1) * fontSize > canvas.height || 
                drop.chars[drop.chars.length - 1].age > 50)) {
          drop.chars.pop();
        }
      }
      
      // Reset column in any of these conditions with optimized checks
      if ((drop.y > canvas.height + 100 && drop.chars.length === 0) || 
          (drop.y > canvas.height + 300) || 
          (Math.random() < drop.respawnRate && drop.y > canvas.height / 3) ||
          (Math.random() < 0.003 && drop.y > canvas.height / 2)) {
        
        // Create a fresh drop
        const newDrop = createDrop(i);
        newDrop.columnIndex = drop.columnIndex;
        drops[i] = newDrop;
      }
      
      // Optimization: Reduce frequency of drop creation checks
      if (i % 2 === 0) {
        // Continually supply new drops from the top
        if (Math.random() < 0.02 && drop.y > canvas.height / 3) {
          // Create a completely new drop for this column
          drops[i] = createDrop(i);
          
          // Give it a head start with a few characters
          const headStart = Math.floor(Math.random() * 3) + 1;
          for (let j = 0; j < headStart; j++) {
            drops[i].chars.unshift({
              value: getRandomChar(),
              age: 0,
              hue: Math.random() * 360 // For rainbow theme
            });
          }
        }
        
        // Occasionally add a new "raindrop"
        if (drop.chars.length > 0 && 
            drop.y > fontSize * 20 && 
            Math.random() < 0.003) {
            
          // Create new drop while preserving column index
          const newDrop = createDrop(i, -fontSize * (Math.random() * 5));
          newDrop.columnIndex = i;
          drops[i] = newDrop;
        }
      }
    }
    
    // Request next animation frame directly for better performance
    requestAnimationFrame(draw);
  }

  // Create UI controls for theme and text overlay
  function createControls() {
    // Create container for controls
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'matrix-controls';
    controlsContainer.innerHTML = `
      <div class="controls-header main-header">
        <div class="drag-icon" title="Drag to move panel">≡</div>
        <span>Matrix Settings</span>
        <button id="toggle-controls" class="toggle-button">−</button>
      </div>
      
      <div class="controls-content">
        <div class="controls-section">
          <div class="controls-header">Theme</div>
          <div class="theme-buttons"></div>
        </div>
        
        <div class="controls-section">
          <div class="controls-header">Text Overlay</div>
          <div class="overlay-controls">
            <div class="control-group">
              <input type="text" id="overlay-text" placeholder="Enter text to display..." maxlength="50">
              <button id="toggle-overlay" class="control-button">Show Text</button>
            </div>
            
            <div class="control-group">
              <label>Size:</label>
              <select id="overlay-size">
                <option value="small">Small</option>
                <option value="medium" selected>Medium</option>
                <option value="large">Large</option>
                <option value="xlarge">X-Large</option>
              </select>
            </div>
            
            <div class="control-group">
              <label>Position:</label>
              <select id="overlay-position">
                <option value="top">Top</option>
                <option value="center" selected>Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(controlsContainer);
    
    // Setup theme buttons
    setupThemeButtons(controlsContainer);
    
    // Setup text overlay controls
    setupOverlayControls(controlsContainer);
    
    // Setup panel toggle and drag functionality
    setupPanelBehavior(controlsContainer);
  }
  
  // Setup panel behavior (collapsible and draggable)
  function setupPanelBehavior(container) {
    const toggleButton = container.querySelector('#toggle-controls');
    const controlsContent = container.querySelector('.controls-content');
    const dragIcon = container.querySelector('.drag-icon');
    const mainHeader = container.querySelector('.main-header');
    
    // Load saved panel state
    const isPanelCollapsed = localStorage.getItem('matrixPanelCollapsed') === 'true';
    const panelPosition = JSON.parse(localStorage.getItem('matrixPanelPosition') || '{"top":"20px","right":"20px","left":"auto","bottom":"auto"}');
    
    // Apply saved position
    Object.keys(panelPosition).forEach(prop => {
      container.style[prop] = panelPosition[prop];
    });
    
    // Apply saved collapsed state
    if (isPanelCollapsed) {
      controlsContent.style.display = 'none';
      toggleButton.textContent = '+';
    }
    
    // Toggle panel visibility
    toggleButton.addEventListener('click', () => {
      const isVisible = controlsContent.style.display !== 'none';
      controlsContent.style.display = isVisible ? 'none' : 'block';
      toggleButton.textContent = isVisible ? '+' : '−';
      localStorage.setItem('matrixPanelCollapsed', isVisible.toString());
    });
    
    // Make panel draggable
    let isDragging = false;
    let offsetX, offsetY;
    
    // Detect if device supports touch events
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Start drag when clicking on header or drag icon (mouse)
    const startDragMouse = (e) => {
      isDragging = true;
      offsetX = e.clientX - container.getBoundingClientRect().left;
      offsetY = e.clientY - container.getBoundingClientRect().top;
      container.classList.add('dragging');
      
      // Prevent text selection during drag
      e.preventDefault();
    };
    
    // Start drag for touch devices
    const startDragTouch = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        const touch = e.touches[0];
        offsetX = touch.clientX - container.getBoundingClientRect().left;
        offsetY = touch.clientY - container.getBoundingClientRect().top;
        container.classList.add('dragging');
        
        // Prevent scrolling while dragging
        e.preventDefault();
      }
    };
    
    // Add drag start listeners based on device type
    if (isTouchDevice) {
      mainHeader.addEventListener('touchstart', startDragTouch, { passive: false });
    } else {
      mainHeader.addEventListener('mousedown', startDragMouse);
    }
    
    // Mouse drag
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      handleDragMove(e.clientX, e.clientY);
    });
    
    // Touch drag
    document.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
      
      // Prevent scrolling while dragging
      e.preventDefault();
    }, { passive: false });
    
    // Common drag move handler
    function handleDragMove(clientX, clientY) {
      // Calculate new position
      const x = clientX - offsetX;
      const y = clientY - offsetY;
      
      // Check boundaries
      const maxX = window.innerWidth - container.offsetWidth;
      const maxY = window.innerHeight - container.offsetHeight;
      
      const boundedX = Math.max(0, Math.min(x, maxX));
      const boundedY = Math.max(0, Math.min(y, maxY));
      
      // Position using absolute coordinates instead of right/bottom
      container.style.left = `${boundedX}px`;
      container.style.top = `${boundedY}px`;
      container.style.right = 'auto';
      container.style.bottom = 'auto';
    }
    
    // End drag (mouse)
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        finishDrag();
      }
    });
    
    // End drag (touch)
    document.addEventListener('touchend', () => {
      if (isDragging) {
        finishDrag();
      }
    });
    
    // Common function to finish drag
    function finishDrag() {
      isDragging = false;
      container.classList.remove('dragging');
      
      // Save position
      const position = {
        top: container.style.top,
        right: container.style.right,
        bottom: container.style.bottom,
        left: container.style.left
      };
      localStorage.setItem('matrixPanelPosition', JSON.stringify(position));
    }
    
    // Double-click/double-tap on header to toggle
    if (isTouchDevice) {
      // Use tap detection for touch devices
      let lastTap = 0;
      mainHeader.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 500 && tapLength > 0) {
          // Don't toggle when tapping the toggle button itself
          if (e.target !== toggleButton) {
            toggleButton.click();
          }
        }
        lastTap = currentTime;
      });
    } else {
      // Use double-click for mouse devices
      mainHeader.addEventListener('dblclick', (e) => {
        // Don't toggle when double-clicking the toggle button itself
        if (e.target !== toggleButton) {
          toggleButton.click();
        }
      });
    }
    
    // Add keyboard shortcut (Esc to toggle)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleButton.click();
      }
    });
  }
  
  // Setup theme selection buttons
  function setupThemeButtons(container) {
    const themeButtons = container.querySelector('.theme-buttons');
    
    // Add button for each theme
    Object.keys(themes).forEach(themeKey => {
      const theme = themes[themeKey];
      const button = document.createElement('button');
      button.className = 'theme-button';
      button.dataset.theme = themeKey;
      button.textContent = theme.name;
      
      // Style button to show theme color
      const [r, g, b] = theme.leadColor;
      button.style.color = `rgb(${r}, ${g}, ${b})`;
      button.style.borderColor = `rgb(${r}, ${g}, ${b})`;
      
      // Apply active class to current theme
      if (theme === currentTheme) {
        button.classList.add('active');
      }
      
      // Add click event
      button.addEventListener('click', () => {
        // Update theme
        currentTheme = themes[themeKey];
        
        // Update active button
        document.querySelectorAll('.theme-button').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Store preference
        localStorage.setItem('matrixTheme', themeKey);
        
        // Update overlay color if visible
        updateOverlayElement();
      });
      
      themeButtons.appendChild(button);
    });
  }
  
  // Setup text overlay controls
  function setupOverlayControls(container) {
    const textInput = container.querySelector('#overlay-text');
    const toggleButton = container.querySelector('#toggle-overlay');
    const sizeSelect = container.querySelector('#overlay-size');
    const positionSelect = container.querySelector('#overlay-position');
    
    // Load saved overlay settings
    const savedOverlayText = localStorage.getItem('matrixOverlayText') || '';
    const savedShowOverlay = localStorage.getItem('matrixShowOverlay') === 'true';
    const savedOverlaySize = localStorage.getItem('matrixOverlaySize') || 'medium';
    const savedOverlayPosition = localStorage.getItem('matrixOverlayPosition') || 'center';
    
    // Apply saved settings
    textInput.value = savedOverlayText;
    overlayText = savedOverlayText;
    showOverlay = savedShowOverlay;
    overlaySize = savedOverlaySize;
    overlayPosition = savedOverlayPosition;
    
    sizeSelect.value = overlaySize;
    positionSelect.value = overlayPosition;
    toggleButton.textContent = showOverlay ? 'Hide Text' : 'Show Text';
    toggleButton.classList.toggle('active', showOverlay);
    
    // Create or update overlay element
    updateOverlayElement();
    
    // Text input handler
    textInput.addEventListener('input', (e) => {
      overlayText = e.target.value;
      localStorage.setItem('matrixOverlayText', overlayText);
      updateOverlayElement();
    });
    
    // Toggle button handler
    toggleButton.addEventListener('click', () => {
      showOverlay = !showOverlay;
      toggleButton.textContent = showOverlay ? 'Hide Text' : 'Show Text';
      toggleButton.classList.toggle('active', showOverlay);
      localStorage.setItem('matrixShowOverlay', showOverlay);
      updateOverlayElement();
    });
    
    // Size select handler
    sizeSelect.addEventListener('change', (e) => {
      overlaySize = e.target.value;
      localStorage.setItem('matrixOverlaySize', overlaySize);
      updateOverlayElement();
    });
    
    // Position select handler
    positionSelect.addEventListener('change', (e) => {
      overlayPosition = e.target.value;
      localStorage.setItem('matrixOverlayPosition', overlayPosition);
      updateOverlayElement();
    });
  }
  
  // Update or create text overlay element
  function updateOverlayElement() {
    let overlayElement = document.querySelector('.matrix-text-overlay');
    
    // Create overlay if it doesn't exist
    if (!overlayElement) {
      overlayElement = document.createElement('div');
      overlayElement.className = 'matrix-text-overlay';
      document.body.appendChild(overlayElement);
    }
    
    // Update text content
    overlayElement.textContent = overlayText;
    
    // Update visibility
    overlayElement.style.display = showOverlay && overlayText ? 'flex' : 'none';
    
    // Update size
    overlayElement.classList.remove('size-small', 'size-medium', 'size-large', 'size-xlarge');
    overlayElement.classList.add(`size-${overlaySize}`);
    
    // Update position
    overlayElement.classList.remove('position-top', 'position-center', 'position-bottom');
    overlayElement.classList.add(`position-${overlayPosition}`);
    
    // Apply theme colors
    const [r, g, b] = currentTheme.leadColor;
    overlayElement.style.color = `rgba(${r}, ${g}, ${b}, 0.9)`;
    overlayElement.style.textShadow = `0 0 10px rgba(${r}, ${g}, ${b}, 0.7), 0 0 20px rgba(${r}, ${g}, ${b}, 0.5)`;
  }

  // Load saved theme preference
  function loadThemePreference() {
    const savedTheme = localStorage.getItem('matrixTheme');
    if (savedTheme && themes[savedTheme]) {
      currentTheme = themes[savedTheme];
    }
  }

  // Initialize the matrix and start animation
  window.addEventListener('resize', resizeCanvas);
  loadThemePreference();
  createControls();
  resizeCanvas();
  requestAnimationFrame(draw);
});