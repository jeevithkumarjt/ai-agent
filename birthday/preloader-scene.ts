/**
 * Scene 01: Cinematic Preloader
 * 
 * PURPOSE: Prepare the user emotionally before the experience begins.
 * EMOTIONAL GOAL: Curiosity.
 * 
 * Visual: Dark elegant background, very subtle particles, soft central glow,
 * minimal typography. No normal loading spinner.
 * 
 * Text: "Preparing something special for you..."
 * 
 * Animation: Logo/text fades in. Particles slowly appear. Glow gently breathes.
 * Loading progress subtly increases.
 * When critical assets are ready: fade into Scene 02.
 */

import { SceneEngine, Scene, SceneConfig, SceneType, EmotionalIntensity, AnimationController, AudioManager } from './scene-engine';

// ============ PRELOADER SCENE CONFIGURATION ============

const preloaderConfig: SceneConfig = {
  id: 'preloader',
  type: 'preloader' as SceneType,
  order: 1,
  enabled: true,
  emotionalIntensity: 0, // calm
  
  // Visual composition
  title: 'Preparing something special for you...',
  subtitle: undefined,
  content: undefined,
  
  // Transition IN
  transitionIn: {
    type: 'fade',
    duration: 1200,
    delay: 0,
    easing: 'ease-out',
    direction: 'center',
  },
  
  // Animation sequence
  animation: {
    entry: {
      type: 'cinematic-reveal',
      duration: 1500,
      delay: 200,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    content: {
      type: 'fade',
      duration: 800,
      delay: 500,
      easing: 'ease-out',
    },
  },
  
  // Audio
  audio: {
    track: undefined,
    volume: 0.3,
    loop: false,
    fadeIn: 0,
    respectAutoplayRestrictions: true,
  },
  
  // Reduced motion
  reducedMotion: false,
  
  // Required assets (will be preloaded)
  requiresAssets: [
    'logo-symbol',           // Symbol/icon
    'background-gradient',   // Background gradient definition
    'particle-sprite',       // Particle graphic
    'glow-effect',           // Glow visual effect
  ],
  
  // Fallback content if assets fail
  fallbackContent: undefined,
  
  // Accessibility
  accessibility: {
    ariaLabel: 'Birthday experience preloader',
    keyboardNavigate: false, // Not interactive
    focusable: false,
    role: 'status',
  },
  
  // Performance requirements
  performanceRequirements: {
    maxParticleCount: 30, // Reduced for preloader
    fpsTarget: 60,
    memoryLimit: 50, // MB
  },
  
  // Completion condition
  completionCondition: {
    type: 'asset-load',
    minLoadProgress: 0.8, // 80% of critical assets loaded
    timeThreshold: 3000, // 3 seconds max
  },
};

// ============ PRELOADER SCENE COMPONENT ============

export class PreloaderScene {
  private sceneEngine: SceneEngine;
  private animationController: AnimationController;
  private audioManager: AudioManager;
  private dom: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private glowProgress = 0;
  private textOpacity = 0;
  private lastTimestamp = 0;
  private isComplete = false;
  private assetLoadCount = 0;
  private totalAssets = 0;
  
  constructor(sceneEngine: SceneEngine) {
    this.sceneEngine = sceneEngine;
    this.animationController = new AnimationController();
    this.audioManager = new AudioManager();
    
    // Create DOM element
    this.dom = document.createElement('div');
    this.dom.id = 'preloader-scene';
    this.dom.setAttribute('role', 'status');
    this.dom.setAttribute('aria-label', 'Birthday experience preloader');
    this.dom.style.position = 'fixed';
    this.dom.style inset: '0';
    this.dom.style.zIndex = '9999';
    this.dom.style.display = 'flex';
    this.dom.style.flexDirection = 'column';
    this.dom.style.alignItems = 'center';
    this.dom.style.justifyContent = 'center';
    this.dom.style.background: 'linear-gradient(135deg, #0a0e20 0%, #1a2038 50%, #0d1425 100%)';
    this.dom.style.color = '#e8f0f8';
    this.dom.style.overflow = 'hidden';
    
    // Create canvas for particles
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'preloader-canvas';
    this.canvas.style.position = 'fixed';
    this.dom.appendChild(this.canvas);
    
    // Create text element
    const textEl = document.createElement('div');
    textEl.id = 'preloader-text';
    textEl.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", sans-serif';
    textEl.style.fontSize = '1.4rem';
    textEl.style.color = '#8ab4c8';
    textEl.style.letterSpacing = '1px';
    textEl.style.textAlign = 'center';
    textEl.style.userSelect = 'none';
    textEl.innerText = 'Preparing something special for you...';
    this.dom.appendChild(textEl);
    
    // Create glow element
    const glowEl = document.createElement('div');
    glowEl.id = 'preloader-glow';
    glowEl.style.width = '100px';
    glowEl.style.height = '100px';
    glowEl.style.borderRadius = '50%';
    glowEl.style.background: 'radial-gradient(circle, #e94a5f 0%, transparent 70%)';
    glowEl.style.pointerEvents = 'none';
    glowEl.style.marginBottom = '24px';
    this.dom.appendChild(glowEl);
    
    // Initialize canvas
    this.initCanvas();
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  private initCanvas(): void {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.redrawParticles();
    };
    
    resize();
    window.addEventListener('resize', resize);
    
    try {
      this.ctx = this.canvas.getContext('2d');
    } catch (e) {
      console.warn('Canvas context not available, particles disabled');
    }
  }
  
  private setupEventListeners(): void {
    // Preloader is not interactive - no click listeners
    // However, we listen for asset load events
    window.addEventListener('asset-load', (e: CustomEvent) => {
      this.onAssetLoad(e.detail);
    });
  }
  
  private onAssetLoad(asset: { id: string; loaded: boolean; percent: number }): void {
    this.assetLoadCount++;
    
    // Update progress visualization
    const progressPercent = (this.assetLoadCount / this.totalAssets) * 100;
    // In a full implementation, we'd show this progress
    
    if (this.assetLoadCount >= this.totalAssets && progressPercent >= 80) {
      this.attemptTransition();
    }
  }
  
  private attemptTransition(): void {
    // Check if we should transition
    // In production, this would check if all critical assets are loaded
    setTimeout(() => {
      this.sceneEngine.transitionTo('mystery').catch(console.error);
    }, 500);
  }
  
  // Start the scene
  enter(): Promise<void> {
    return new Promise((resolve) => {
      // Initialize assets
      this.totalAssets = this.config.requiresAssets.length;
      this.assetLoadCount = 0;
      
      // Simulate asset loading (in production, these would be actual image/audio loads)
      setTimeout(() => {
        this.assetLoadCount = this.totalAssets;
        
        // Start animation loop
        this.lastTimestamp = performance.now();
        this.animationLoop = requestAnimationFrame(this.animate.bind(this));
        
        resolve();
      }, 500);
    });
  }
  
  exit(): Promise<void> {
    return new Promise((resolve) => {
      if (this.animationLoop) {
        cancelAnimationFrame(this.animationLoop);
      }
      
      // Fade out elements
      if (this.dom) {
        this.dom.style.transition = 'opacity 800ms ease-out';
        this.dom.style.opacity = '0';
      }
      
      setTimeout(() => {
        resolve();
      }, 800);
    });
  }
  
  cleanup(): void {
    if (this.animationLoop) {
      cancelAnimationFrame(this.animationLoop);
    }
    
    if (this.ctx) {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    if (this.dom && this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }
  }
  
  private animate(timestamp: number): void {
    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    
    // Update glow progress
    this.glowProgress += delta * 0.001;
    if (this.glowProgress > 1) this.glowProgress -= 1;
    
    // Update particles
    this.updateParticles(delta);
    
    // Update text opacity with breathing effect
    this.textOpacity = 0.5 + 0.5 * Math.sin(this.glowProgress * Math.PI * 2);
    
    this.redraw();
    
    this.animationLoop = requestAnimationFrame(this.animate.bind(this));
  }
  
  private updateParticles(delta: number): void {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw particles
    if (this.particles.length === 0) {
      // Initialize subtle particles
      const particleCount = Math.min(20, Math.floor(window.innerWidth / 50));
      for (let i = 0; i < particleCount; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: 1 + Math.random() * 2,
          opacity: 0.3 + Math.random() * 0.3,
          hue: 200 + Math.random() * 30,
        });
      }
    }
    
    // Update and draw each particle
    this.particles.forEach((p, i) => {
      p.x += p.vx * delta * 0.016;
      p.y += p.vy * delta * 0.016;
      
      // Wrap around edges
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;
      
      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = `hsl(${p.hue}, 60%, 50%)`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }
  
  private redraw(): void {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw existing particles
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.opacity * this.textOpacity;
      this.ctx.fillStyle = `hsl(${p.hue}, 60%, 50%)`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }
}

// ============ EXPORT PRELOADER SCENE ============

export const preloaderScene: Scene = {
  id: 'preloader',
  type: 'preloader' as SceneType,
  config: preloaderConfig,
  
  // Implement required Scene methods
  enter: async () => {
    const component = new PreloaderScene(sceneEngine);
    await component.enter();
    return component;
  },
  
  exit: async () => {
    // Will be handled by the component
    return Promise.resolve();
  },
};

// Register the scene with the engine when needed
// sceneEngine.register(preloaderScene);

// ============ CSS FOR PRELOADER ============

/*
.preloader-scene {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0e20 0%, #1a2038 50%, #0d1425 100%);
  color: #e8f0f8;
  overflow: hidden;
}

#preloader-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

#preloader-text {
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 1.4rem;
  color: #8ab4c8;
  letter-spacing: 1px;
  text-align: center;
  user-select: none;
  margin-bottom: 24px;
}

#preloader-glow {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, #e94a5f 0%, transparent 70%);
  margin-bottom: 24px;
  filter: blur(10px);
}
*/

// ============ REDUCED MOTION VARIANT ============
/*
When prefers-reduced-motion is enabled:
- Reduce particle count by 70%
- Remove particle animation
- Fade text in immediately
- Skip glow breathing animation
- Transition faster
*/

// ============ ACCESSIBILITY NOTES ============
/*
- role="status" for screen readers
- aria-label describing the purpose
- No interactive elements (click/touch disabled)
- Focus management: preloader is not navigable
- Text contrast: #8ab4c8 on dark background (WCAG AA)
- Motion preference respected via CSS media query
*/