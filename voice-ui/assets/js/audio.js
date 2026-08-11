/* ==========================================================================
   Voice UI — Audio input (assets/js/audio.js) — M8
   --------------------------------------------------------------------------
   getUserMedia + AnalyserNode. Exposes a smoothed 0..1 `level` (spring-audio
   90/14) delivered per animation frame via `onLevel`. Mic denial surfaces
   through `onDenied` so voice-ui.js can fall back to chat with guidance.

   Load order: utils.js → motion-engine.js → audio.js.
   Namespace: window.VUI.audio.
   ========================================================================== */

(function (VUI) {
  'use strict';

  var utils = VUI.utils;

  function AudioInput(opts) {
    this.opts = opts || {};
    this.onDenied = this.opts.onDenied || null;
    this.onLevel = this.opts.onLevel || null;
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.data = null;
    this.smoothing = null;
    this.level = 0;
    this.active = false;
    this.rafId = null;
    this._last = 0;
    if (VUI.motion) this.smoothing = new VUI.motion.Spring(90, 14, 0);
  }

  AudioInput.prototype.start = function () {
    var self = this;
    if (this.active) return Promise.resolve(true);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this._deny('getUserMedia is not available in this browser');
      return Promise.reject(new Error('no-media'));
    }
    return navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        self.stream = stream;
        self.ctx = new (window.AudioContext || window.webkitAudioContext)();
        self.source = self.ctx.createMediaStreamSource(stream);
        self.analyser = self.ctx.createAnalyser();
        self.analyser.fftSize = 512;
        self.analyser.smoothingTimeConstant = 0.6;
        self.source.connect(self.analyser);
        self.data = new Uint8Array(self.analyser.frequencyBinCount);
        self.active = true;
        self._last = utils.now();
        self._loop();
        return true;
      })
      .catch(function () {
        self._deny('microphone permission denied');
        return Promise.reject(new Error('denied'));
      });
  };

  AudioInput.prototype._loop = function () {
    var self = this;
    this.rafId = requestAnimationFrame(function tick() {
      if (!self.active) return;
      self.analyser.getByteFrequencyData(self.data);
      var sum = 0;
      var n = 26;
      for (var i = 2; i < n; i++) sum += self.data[i];
      var raw = Math.min(1, (sum / (n * 255)) * 2.6);
      var dt = Math.min(0.05, (utils.now() - self._last) / 1000);
      self._last = utils.now();
      self.level = self.smoothing
        ? self.smoothing.update(raw, dt)
        : raw;
      if (self.onLevel) self.onLevel(self.level);
      self.rafId = requestAnimationFrame(tick);
    });
  };

  AudioInput.prototype.stop = function () {
    this.active = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.stream) {
      this.stream.getTracks().forEach(function (t) { t.stop(); });
      this.stream = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      var ctx = this.ctx;
      this.ctx = null;
      if (ctx.close) ctx.close().catch(function () { /* ignore */ });
    }
    this.analyser = null;
    this.source = null;
  };

  AudioInput.prototype._deny = function (reason) {
    if (this.onDenied) this.onDenied(reason);
  };

  VUI.audio = { AudioInput: AudioInput };
})(window.VUI = window.VUI || {});
