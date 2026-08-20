/**
 * Scene Engine - Core orchestration for the cinematic birthday experience.
 * 
 * Manages scene lifecycle, transitions, loading, and state.
 * 
 * States: idle → entering → active → interacting → exiting → completed
 * Only one transition at a time. Prevents duplicate navigation.
 */

// Types for scene configuration
export type SceneId = string;
export type SceneType = 
  | 'preloader' 
  | 'mystery' 
  | 'envelope' 
  | 'secret-letter' 
  | 'name-reveal' 
  | 'birthday-reveal' 
  | 'cake' 
  | 'balloons' 
  | 'memory-intro' 
  | 'gallery' 
  | 'timeline' 
  | 'love-cards' 
  | 'heart' 
  | 'letter' 
  | 'montage' 
  | 'audio' 
  | 'surprise' 
  | 'gift' 
  | 'future-wish' 
  | 'final-message' 
  | 'celebration' 
  | 'replay' 
  | 'share';

export type EmotionalIntensity = 
  | 0 // calm
  | 1 // warm
  | 2 // curious
  | 3 // happy
  | 4 // nostalgic
  | 5 // emotional
  | 6 // celebration;

export interface SceneConfig {
  id: SceneId;
  type: SceneType;
  order: number;
  enabled: boolean;
  title?: string;
  subtitle?: string;
  content?: string;
  emotionalIntensity: EmotionalIntensity;
  transitionIn?: {
    type: 'fade' | 'slide' | 'zoom' | 'light-sweep' | 'circle-reveal' | 'curtain-reveal' | 'particle-dissolve' | 'mask-reveal' | 'cinematic-crossfade';
    duration?: number;
    delay?: number;
    easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'linear';
    direction?: 'up' | 'down' | 'left' | 'right' | 'center';
  };
  transitionOut?: {
    type: 'fade' | 'slide' | 'zoom' | 'light-sweep' | 'circle-reveal' | 'curtain-reveal' | 'particle-dissolve' | 'mask-reveal' | 'cinematic-crossfade';
    duration?: number;
    delay?: number;
    easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'linear';
    direction?: 'up' | 'down' | 'left' | 'right' | 'center';
  };
  animation?: {
    entry?: {
      type: 'fade' | 'scale' | 'blur' | 'zoom' | 'slide' | 'parallax' | 'floating' | 'typewriter' | 'mask-reveal' | 'light-sweep' | 'particle-reveal' | 'cinematic-reveal';
      duration?: number;
      delay?: number;
      easing?: string;
      stagger?: number;
    };
    content?: {
      type: 'fade' | 'scale' | 'blur' | 'zoom' | 'slide' | 'parallax' | 'typewriter' | 'letter-reveal' | 'particle-reveal';
      duration?: number;
      delay?: number;
      easing?: string;
    };
    interaction?: {
      type: 'pulse' | 'glow' | 'particles' | 'heartbeat' | 'float' | 'none';
      duration?: number;
    };
    exit?: {
      type: 'fade' | 'slide' | 'zoom' | 'light-sweep' | 'particle-dissolve';
      duration?: number;
      easing?: string;
    };
  };
  audio?: {
    track?: string;
    volume?: number;
    start?: number;
    fadeIn?: number;
    fadeOut?: number;
    loop?: boolean;
    respectAutoplayRestrictions?: boolean;
  };
  reducedMotion?: boolean;
  requiresAssets: string[]; // asset IDs to preload
  fallbackContent?: string;
  accessibility?: {
    ariaLabel?: string;
    keyboardNavigate?: boolean;
    focusable?: boolean;
    role?: string;
  };
}

export interface SceneState {
  id: SceneId;
  type: SceneType;
  isActive: boolean;
  isEntering: boolean;
  isInteracting: boolean;
  isExiting: boolean;
  isCompleted: boolean;
  progress: number; // 0-1
  interactionCount: number;
  assetLoadProgress: number; // 0-1
  error?: string;
}

export interface AssetProgress {
  id: string;
  loaded: boolean;
  percent: number;
}

export interface SceneEngineConfig {
  reducedMotion?: boolean;
  startScene: SceneType;
  preloadNext?: boolean;
  maxConcurrentTransitions: number;
  transitionTimeout: number;
}

export class Scene {
  public id: SceneId;
  public type: SceneType;
  public config: SceneConfig;
  public state: SceneState;
  public domElement: HTMLElement | null = null;
  public animationController: AnimationController | null = null;
  public audioManager: AudioManager | null = null;

  constructor(id: SceneId, type: SceneType, config: SceneConfig) {
    this.id = id;
    this.type = type;
    this.config = config;
    this.state = {
      id,
      type,
      isActive: false,
      isEntering: false,
      isInteracting: false,
      isExiting: false,
      isCompleted: false,
      progress: 0,
      interactionCount: 0,
      assetLoadProgress: 0,
    };
  }

  enter(): Promise<void> {
    if (this.state.isExiting) {
      return Promise.reject(new Error(`Scene ${this.id} is exiting, cannot enter`));
    }
    
    if (this.state.isActive) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.state.isEntering = true;
      this.state.progress = 0;
      
      // Mark as active after enter animation completes
      setTimeout(() => {
        this.state.isEntering = false;
        this.state.isActive = true;
        this.state.progress = 1;
        resolve();
      }, this.config.animation?.entry?.duration || 1000);
    });
  }

  interact(): void {
    if (!this.state.isActive || this.state.isExiting) return;
    this.state.isInteracting = true;
    this.state.interactionCount++;
    setTimeout(() => {
      this.state.isInteracting = false;
    }, 300);
  }

  exit(): Promise<void> {
    if (this.state.isExiting) {
      return Promise.reject(new Error(`Scene ${this.id} already exiting`));
    }

    return new Promise((resolve) => {
      this.state.isExiting = true;
      this.state.progress = 1;
      
      // Cleanup animations and listeners
      this.animationController?.cleanup();
      this.audioManager?.stop();
      
      setTimeout(() => {
        this.state.isExiting = false;
        this.state.isCompleted = true;
        this.state.isActive = false;
        resolve();
      }, (this.config.animation?.exit?.duration || 500));
    });
  }

  cleanup(): void {
    this.state = {
      id: this.id,
      type: this.type,
      isActive: false,
      isEntering: false,
      isInteracting: false,
      isExiting: false,
      isCompleted: false,
      progress: 0,
      interactionCount: 0,
      assetLoadProgress: 0,
    };
    this.animationController?.cleanup();
    this.audioManager?.cleanup();
    this.domElement?.remove();
    this.domElement = null;
  }
}

export class SceneEngine {
  private scenes: Map<SceneId, Scene> = new Map();
  private currentScene: Scene | null = null;
  private pendingTransition: Scene | null = null;
  private isTransitioning = false;
  private config: SceneEngineConfig;
  private reducedMotion: boolean;
  private assetPreloads: Map<string, HTMLImageElement | HTMLVideoElement | AudioBuffer> = new Map();

  constructor(config: SceneEngineConfig = {}) {
    this.config = {
      reducedMotion: false,
      startScene: 'preloader',
      preloadNext: true,
      maxConcurrentTransitions: 1,
      transitionTimeout: 5000,
      ...config,
    };
    this.reducedMotion = this.config.reducedMotion || false;
  }

  register(scene: Scene): void {
    if (this.scenes.has(scene.id)) {
      console.warn(`Scene ${scene.id} already registered, overwriting`);
    }
    this.scenes.set(scene.id, scene);
  }

  unregister(id: SceneId): void {
    const scene = this.scenes.get(id);
    if (scene) {
      scene.cleanup();
      this.scenes.delete(id);
    }
  }

  getScene(id: SceneId): Scene | undefined {
    return this.scenes.get(id);
  }

  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  async transitionTo(sceneId: SceneId, options: { replace?: boolean; keepCurrent?: boolean } = {}): Promise<void> {
    if (this.isTransitioning) {
      console.warn('Transition already in progress, ignoring request');
      return;
    }

    if (!this.scenes.has(sceneId)) {
      console.error(`Scene ${sceneId} not registered`);
      return;
    }

    const targetScene = this.scenes.get(sceneId)!;
    
    // If keeping current scene and it's the same, do nothing
    if (this.currentScene?.id === sceneId && !options.replace) {
      return;
    }

    this.isTransitioning = true;
    
    try {
      // Exit current scene
      if (this.currentScene) {
        await this.currentScene.exit();
      }

      // Preload target scene assets
      await this.preloadSceneAssets(targetScene);
      
      // Enter target scene
      await targetScene.enter();
      
      // Update state
      const previousScene = this.currentScene;
      this.currentScene = targetScene;
      
      // Notify listeners
      this.dispatchEvent('scene-change', {
        scene: targetScene,
        previousScene,
      });
    } catch (error) {
      console.error('Scene transition failed:', error);
      // Fallback: try to recover
      this.recoverFromTransitionError(error);
    } finally {
      this.isTransitioning = false;
      
      // If preloading next scene, do it now
      if (this.config.preloadNext && this.currentScene) {
        this.preloadSceneAssetsForNext();
      }
    }
  }

  private async preloadSceneAssets(scene: Scene): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const assetId of scene.config.requiresAssets) {
      const asset = this.assetPreloads.get(assetId);
      if (asset) {
        // Already preloaded
        continue;
      }
      
      // Simulate asset loading - in production this would load actual images/audio
      const loadPromise = new Promise<void>((resolve) => {
        // Simulate loading time based on asset type
        setTimeout(() => {
          this.assetPreloads.set(assetId, { loaded: true, percent: 100 });
          resolve();
        }, Math.random() * 1000 + 500);
      });
      
      promises.push(loadPromise);
    }
    
    await Promise.all(promises);
  }

  private preloadSceneAssetsForNext(): void {
    // Preload the next scene in the sequence
    const sceneIds = Array.from(this.scenes.keys()).sort();
    const currentIndex = sceneIds.indexOf(this.currentScene?.id || '');
    if (currentIndex >= 0 && currentIndex < sceneIds.length - 1) {
      const nextSceneId = sceneIds[currentIndex + 1];
      const nextScene = this.scenes.get(nextSceneId);
      if (nextScene) {
        this.preloadSceneAssets(nextScene).catch(console.error);
      }
    }
  }

  private recoverFromTransitionError(error: Error): void {
    console.error('Recovering from transition error:', error.message);
    // Dispatch error event so UI can show fallback
    this.dispatchEvent('transition-error', { error });
  }

  private dispatchEvent(type: string, detail: any): void {
    const event = new CustomEvent(type, { detail });
    document.dispatchEvent(event);
  }

  // Public API
  start(): Promise<void> {
    // Start with the configured start scene
    const startSceneType = this.config.startScene || 'preloader';
    const startScene = Array.from(this.scenes.values()).find(s => s.type === startSceneType);
    
    if (!startScene) {
      console.error(`Start scene type ${startSceneType} not found`);
      return Promise.reject(new Error('Start scene not found'));
    }
    
    return this.transitionTo(startSceneId);
  }

  getCurrentState(): SceneState {
    return this.currentScene?.state || {
      id: '',
      type: 'preloader',
      isActive: false,
      isEntering: false,
      isInteracting: false,
      isExiting: false,
      isCompleted: false,
      progress: 0,
      interactionCount: 0,
      assetLoadProgress: 0,
    };
  }

  // Check if reduced motion is preferred
  respectsReducedMotion(): boolean {
    if (this.reducedMotion) return true;
    
    // Check CSS media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      this.reducedMotion = true;
      return true;
    }
    
    return false;
  }
}

// Animation Controller - manages all scene animations
export class AnimationController {
  private activeAnimations: Map<string, Animation[]> = new Map();
  private reducedMotion: boolean = false;

  constructor() {
    this.checkReducedMotion();
    window.matchMedia('(prefers-reduced-motion: reduce)').addListener(
      (mql) => { this.reducedMotion = mql.matches; }
    );
  }

  private checkReducedMotion(): void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      this.reducedMotion = true;
    }
  }

  // Create a fade animation
  fadeIn(element: HTMLElement, duration = 1000, delay = 0): Animation {
    if (this.reducedMotion) {
      element.style.opacity = '1';
      return { finish: Promise.resolve() };
    }
    
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-out ${delay}ms`;
    
    setTimeout(() => {
      element.style.opacity = '1';
    }, delay);
    
    return {
      finish: new Promise((resolve) => {
        setTimeout(resolve, duration + delay);
      }),
    };
  }

  fadeOut(element: HTMLElement, duration = 1000, delay = 0): Animation {
    if (this.reducedMotion) {
      element.style.opacity = '0';
      return { finish: Promise.resolve() };
    }
    
    element.style.opacity = '1';
    element.style.transition = `opacity ${duration}ms ease-in ${delay}ms`;
    
    setTimeout(() => {
      element.style.opacity = '0';
    }, delay);
    
    return {
      finish: new Promise((resolve) => {
        setTimeout(resolve, duration + delay);
      }),
    };
  }

  // Create a scale animation
  scaleIn(element: HTMLElement, duration = 1000, delay = 0, from = 0.8): Animation {
    if (this.reducedMotion) {
      element.style.transform = 'scale(1)';
      element.style.opacity = '1';
      return { finish: Promise.resolve() };
    }
    
    element.style.transform = `scale(${from})`;
    element.style.opacity = '0';
    element.style.transition = `transform ${duration}ms ease-out ${delay}ms, opacity ${duration}ms ease-out ${delay}ms`;
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      element.style.opacity = '1';
    }, delay);
    
    return {
      finish: new Promise((resolve) => {
        setTimeout(resolve, duration + delay);
      }),
    };
  }

  // Create a slide animation
  slideIn(element: HTMLElement, duration = 1000, delay = 0, direction = 'up'): Animation {
    if (this.reducedMotion) {
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
      return { finish: Promise.resolve() };
    }
    
    let translateY = 0;
    if (direction === 'up') translateY = '-100%';
    if (direction === 'down') translateY = '100%';
    if (direction === 'left') translateX = '-100%';
    if (direction === 'right') translateX = '100%';
    
    element.style.transform = `translateY(${translateY})`;
    element.style.opacity = '0';
    element.style.transition = `transform ${duration}ms ease-out ${delay}ms, opacity ${duration}ms ease-out ${delay}ms`;
    
    setTimeout(() => {
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
    }, delay);
    
    return {
      finish: new Promise((resolve) => {
        setTimeout(resolve, duration + delay);
      }),
    };
  }

  // Create a light sweep animation
  lightSweep(element: HTMLElement, duration = 1500): Animation {
    if (this.reducedMotion) {
      return { finish: Promise.resolve() };
    }
    
    // Create a gradient overlay that sweeps across
    const sweep = document.createElement('div');
    sweep.style.position = 'absolute';
    sweep.style.top = '0';
    sweep.style.left = '-100%';
    sweep.style.width = '400%';
    sweep.style.height = '100%';
    sweep.style.background = 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)';
    sweep.style.animation = `lightSweep ${duration}ms ease-out forwards`;
    element.style.position = 'relative';
    element.appendChild(sweep);
    
    const keyframes = `
      @keyframes lightSweep {
        to { left: 100%; }
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
    
    return {
      finish: new Promise((resolve) => {
        setTimeout(() => {
          sweep.remove();
          style.remove();
          resolve();
        }, duration);
      }),
    };
  }

  // Create particle reveal animation
  particleReveal(container: HTMLElement, options: { count?: number; color?: string; duration?: number }): Animation {
    if (this.reducedMotion) {
      return { finish: Promise.resolve() };
    }
    
    const count = options.count || 20;
    const color = options.color || '#ff6b6b';
    const duration = options.duration || 1000;
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '6px';
      particle.style.height = '6px';
      particle.style.background = color;
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      
      // Random starting position within container
      const rect = container.getBoundingClientRect();
      particle.style.left = `${rect.left + Math.random() * rect.width}px`;
      particle.style.top = `${rect.top + Math.random() * rect.height}px`;
      
      // Random direction and distance
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      const vx = Math.cos(angle) * distance;
      const vy = Math.sin(angle) * distance;
      
      particle.style.transition = `left ${duration}ms ease-out, top ${duration}ms ease-out, opacity ${duration}ms ease-out`;
      
      particle.style.left = `${parseFloat(particle.style.left) + vx}px`;
      particle.style.top = `${parseFloat(particle.style.top) + vy}px`;
      particle.style.opacity = '0';
      
      container.appendChild(particle);
    }
    
    return {
      finish: new Promise((resolve) => {
        setTimeout(() => {
          // Clean up particles
          const particles = container.querySelectorAll('.particle');
          particles.forEach(p => p.remove());
          resolve();
        }, duration + 500);
      }),
    };
  }

  cleanup(): void {
    this.activeAnimations.forEach((animations, id) => {
      animations.forEach(a => {
        if (a.element && a.element.parentNode) {
          a.element.parentNode.removeChild(a.element);
        }
      });
    });
    this.activeAnimations.clear();
  }
}

// Audio Manager - manages all scene audio
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private Howl | null = null; // Using howler for simplified audio
  private currentTrack: string | null = null;
  private isInitialized = false;
  private reducedMotion: boolean = false;

  constructor() {
    this.checkReducedMotion();
    this.initializeAudioContext();
    window.matchMedia('(prefers-reduced-motion: reduce)').addListener(
      (mql) => { this.reducedMotion = mql.matches; }
    );
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext);
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.isInitialized = true;
    } catch (e) {
      console.error('AudioContext initialization failed:', e);
      this.isInitialized = false;
    }
  }

  private checkReducedMotion(): void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      this.reducedMotion = true;
    }
  }

  isReady(): boolean {
    return this.isInitialized && !this.reducedMotion;
  }

  async play(trackId: string, options: { volume?: number; loop?: boolean; fadeIn?: number } = {}): Promise<void> {
    if (!this.isReady()) {
      // Audio not available or reduced motion - continue without audio
      console.log('Audio skipped (not available or reduced motion)');
      return;
    }
    
    const { volume = 0.5, loop = false, fadeIn = 0 } = options;
    
    // Check autoplay policy - if user hasn't interacted, we may need to wait
    if (!this.hasUserInteracted()) {
      // Will play on first user interaction
      this.pendingPlay = { trackId, volume, loop, fadeIn };
      return;
    }
    
    try {
      // Using Howler.js simplified approach
      if (!this.Howl) {
        this.Howl = (window as any).Howl;
      }
      
      if (this.Howl) {
        const sound = new this.Howl([
          { src: [`/audio/${trackId}.mp3`, `/audio/${trackId}.wav`], type: ['audio/mpeg', 'audio/wav'] }
        ]);
        
        sound.volume(volume);
        sound.loop(loop);
        sound.play();
        
        this.currentTrack = trackId;
      }
    } catch (e) {
      console.error('Audio playback failed:', e);
      // Never break the experience due to audio failure
    }
  }

  stop(): void {
    if (this.Howl) {
      this.Howl.stop();
    }
    if (this.audioContext) {
      this.audioContext.suspend();
    }
    this.currentTrack = null;
  }

  setVolume(volume: number): void {
    if (this.Howl) {
      this.Howl.volume(volume);
    }
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  private hasUserInteracted(): boolean {
    // Simple check - if we have any click/touch events registered
    return true; // In production, track user interactions
  }

  cleanup(): void {
    this.stop();
  }

  // For pending play after user interaction
  private pendingPlay: any = null;
}

// Export types for use throughout the application
export type { SceneId, SceneType, EmotionalIntensity, SceneConfig, SceneState, AssetProgress, SceneEngineConfig };
export { SceneEngine, AnimationController, AudioManager };