/* ==========================================================================
   Voice UI — Session (assets/js/voice-ui.js) — M8
   --------------------------------------------------------------------------
   State machine + demo conversation layer. States follow docs §8.1:

     connecting → listening → speaking → listening …        (voice)
     listening → chat (toggle, same session)                 (chat)
     any → ended → closed → reset

   Orb states map 1:1 from the docs §8.2 table (via modal.orb.setState).
   Status is announced through an sr-only live region; mic denial falls back
   to chat with guidance + retry. Without a real API this runs a scripted
   demo (greeting, prompts, replies) — swap `config.mode` for production.

   Load order: utils → motion → orb-engine → modal → audio → voice-ui.
   Namespace: window.VUI.voice.
   ========================================================================== */

(function (VUI) {
  'use strict';

  var utils = VUI.utils;

  var CONNECT_MS = 1200;
  var TYPING_MS = 900;
  var SPEAK_MS = 1600;
  var PROMPT_MS = 6000;

  var STATE_MAP = {
    connecting: { orb: 'connecting',   label: 'Connecting',      tone: 'busy',  say: 'Connecting' },
    listening:  { orb: 'listening',    label: 'Listening…',      tone: 'live',  say: 'Listening' },
    speaking:   { orb: 'speaking',     label: 'Speaking',        tone: 'live',  say: '' },
    thinking:   { orb: 'thinking',     label: 'Thinking…',       tone: 'busy',  say: 'Thinking' },
    'chat-idle':{ orb: 'idle',         label: 'Ready — chat',    tone: 'busy',  say: '' },
    error:      { orb: 'error',        label: 'Mic unavailable', tone: 'error', say: 'Microphone unavailable' },
    ended:      { orb: 'disconnected', label: 'Call ended',      tone: 'busy',  say: 'Call ended' }
  };

  function Session(opts) {
    this.opts = opts || {};
    this.modal = this.opts.modal || null;
    this.root = this.opts.root || document;
    this.scenario = null;
    this.mode = 'voice';
    this.state = 'idle';
    this.timers = [];
    this.replyIdx = 0;
    this.promptIdx = 0;
    this.promptTimer = null;
    this.audio = null;
    this.live = null;
    this._buildLiveRegion();
  }

  Session.prototype._buildLiveRegion = function () {
    this.live = document.createElement('div');
    this.live.className = 'vui-sr-only';
    this.live.setAttribute('role', 'status');
    this.live.setAttribute('aria-live', 'polite');
    this.root.appendChild(this.live);
  };

  Session.prototype._say = function (text) {
    if (!this.live) return;
    this.live.textContent = '';
    /* Retrigger so repeated identical announcements are spoken. */
    setTimeout(function (el, t) { el.textContent = t; }, 40, this.live, text);
  };

  Session.prototype.orb = function () {
    return this.modal ? this.modal.orb : null;
  };

  /* ---- Timers ----------------------------------------------------------- */

  Session.prototype._later = function (ms, fn) {
    var self = this;
    var id = setTimeout(function () {
      var idx = self.timers.indexOf(id);
      if (idx > -1) self.timers.splice(idx, 1);
      fn();
    }, ms);
    this.timers.push(id);
    return id;
  };

  Session.prototype._clearTimers = function () {
    for (var i = 0; i < this.timers.length; i++) clearTimeout(this.timers[i]);
    this.timers = [];
    if (this.promptTimer) { clearTimeout(this.promptTimer); this.promptTimer = null; }
  };

  /* ---- Lifecycle -------------------------------------------------------- */

  Session.prototype.openScenario = function (scenario, fromEl) {
    if (!this.modal) return;
    this.scenario = scenario;
    this.replyIdx = 0;
    this.promptIdx = 0;
    this.mode = 'voice';
    this._clearTimers();
    this.modal.open(scenario, fromEl);
    this._setState('connecting');
    this._tryMic();
    var self = this;
    this._later(CONNECT_MS, function () {
      self._agentSpeaks(scenario.greeting, function () {
        self._setState('listening');
        self._schedulePrompts();
      });
    });
  };

  Session.prototype.reset = function () {
    this._clearTimers();
    this.mode = 'voice';
    this.state = 'idle';
    if (this.orb()) this.orb().setState('idle');
    if (this.modal) {
      this.modal.hideTyping();
      this.modal.setVoiceMode();
    }
  };

  Session.prototype._end = function () {
    this._clearTimers();
    if (this.audio) this.audio.stop();
    this._setState('ended');
    var self = this;
    this._later(750, function () {
      if (self.modal) self.modal.close();
    });
  };

  /* ---- Mic -------------------------------------------------------------- */

  Session.prototype._tryMic = function () {
    var self = this;
    if (!VUI.audio) {
      this._setState('error');
      return;
    }
    if (!this.audio) {
      this.audio = new VUI.audio.AudioInput({
        onDenied: function () { self._micDenied(); },
        onLevel: function (l) {
          if (self.mode !== 'voice') return;
          if (self.state === 'listening' || self.state === 'speaking') {
            var orb = self.orb();
            if (orb) orb.setLevel(l);
          }
        }
      });
    }
    this.audio.start().catch(function () { /* onDenied handles it */ });
  };

  Session.prototype._micDenied = function () {
    if (this.mode !== 'voice' || this.state === 'ended') return;
    this._setState('error');
    if (this.modal) {
      this.modal.appendMessage('system', 'Microphone unavailable — you can type instead.');
      this.modal.showRetry();
    }
  };

  /* ---- Scripted voice flow ---------------------------------------------- */

  Session.prototype._agentSpeaks = function (text, done) {
    var self = this;
    this._setState('speaking');
    this.modal.showTyping();
    this._later(TYPING_MS, function () {
      self.modal.hideTyping();
      self.modal.appendMessage('agent', text);
      self._later(SPEAK_MS, function () {
        if (done) done();
      });
    });
  };

  Session.prototype._schedulePrompts = function () {
    var self = this;
    this.promptTimer = this._later(PROMPT_MS, function () {
      if (self.state !== 'listening' && self.state !== 'chat-idle') return;
      var prompts = self.scenario.prompts || [];
      if (!prompts.length) { self._schedulePrompts(); return; }
      var text = prompts[self.promptIdx++ % prompts.length];
      self._agentSpeaks(text, function () {
        self._setState('listening');
        self._schedulePrompts();
      });
    });
  };

  /* ---- Chat ------------------------------------------------------------- */

  Session.prototype._handleUserText = function (text) {
    if (!this.scenario) return;
    var self = this;
    this._setChatMode();
    this.modal.appendMessage('user', text);
    this._setState('thinking');
    this.modal.showTyping();
    this._later(TYPING_MS, function () {
      self.modal.hideTyping();
      var replies = self.scenario.replies || [];
      var reply = replies[self.replyIdx % replies.length] || 'Got it.';
      self.replyIdx += 1;
      self._setState('speaking');
      self.modal.appendMessage('agent', reply);
      self._later(SPEAK_MS, function () {
        self._setState('chat-idle');
      });
    });
  };

  Session.prototype._toggleType = function () {
    if (this.mode === 'voice') this._setChatMode();
    else this._setVoiceMode();
  };

  Session.prototype._setChatMode = function () {
    this.mode = 'chat';
    if (this.modal) this.modal.setChatMode();
    if (this.state !== 'thinking' && this.state !== 'speaking') {
      this._setState('chat-idle');
    }
  };

  Session.prototype._setVoiceMode = function () {
    this.mode = 'voice';
    if (this.modal) this.modal.setVoiceMode();
    if (this.audio && this.audio.active) {
      this._setState('listening');
      this._schedulePrompts();
    } else {
      this._setState('error');
      if (this.modal) this.modal.showRetry();
    }
  };

  /* ---- State ------------------------------------------------------------ */

  Session.prototype._setState = function (state) {
    this.state = state;
    var m = STATE_MAP[state] || STATE_MAP['chat-idle'];
    if (this.modal) this.modal.setStatus(m.label, m.tone);
    var orb = this.orb();
    if (orb) orb.setState(m.orb);
    if (m.say) this._say((this.scenario ? this.scenario.title + ': ' : '') + m.say);
  };

  Session.prototype.destroy = function () {
    this._clearTimers();
    if (this.audio) this.audio.stop();
    if (this.live && this.live.parentNode) this.live.parentNode.removeChild(this.live);
  };

  VUI.voice = { Session: Session };
})(window.VUI = window.VUI || {});
