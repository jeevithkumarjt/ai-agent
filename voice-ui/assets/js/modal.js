/* ==========================================================================
   Voice UI — Modal (assets/js/modal.js) — M7
   --------------------------------------------------------------------------
   Card → call morph. Implementation follows docs §7:
   * FLIP-style bound morph via WAAPI transform interpolation (no layout
     reads per frame — the animation runs on the compositor).
   * Focus trap (Tab wraps), Esc closes, backdrop click closes, focus returns
     to the trigger element.
   * Reduced motion collapses the morph to a 150ms crossfade.
   All conversational logic lives in voice-ui.js; the modal only renders.

   Load order: utils.js → motion-engine.js → orb-engine.js → modal.js.
   Namespace: window.VUI.modal.
   ========================================================================== */

(function (VUI) {
  'use strict';

  var utils = VUI.utils;

  var MORPH_MS = 480;
  var FADE_MS = 150;

  function Modal(opts) {
    this.opts = opts || {};
    this.mount = this.opts.mount || document.body;
    this.reduced = utils.prefersReducedMotion();
    this.el = null;
    this.card = null;
    this.orb = null;
    this.statusChip = null;
    this.statusLabel = null;
    this.titleEl = null;
    this.tagEl = null;
    this.chatLog = null;
    this.typingEl = null;
    this.chatForm = null;
    this.chatInput = null;
    this.hangupBtn = null;
    this.closeBtn = null;
    this.typeBtn = null;
    this.retryBtn = null;
    this.voicePane = null;
    this._trigger = null;
    this._open = false;
    this._escHandler = null;
    this._tabHandler = null;
    this._build();
  }

  /* ---- Build ------------------------------------------------------------ */

  Modal.prototype._build = function () {
    var self = this;

    var modal = document.createElement('div');
    modal.className = 'vui-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'vui-modal-title');
    modal.hidden = true;

    modal.innerHTML =
      '<div class="vui-modal__backdrop" data-backdrop></div>' +
      '<div class="vui-modal__card">' +
        '<header class="vui-modal__head">' +
          '<div>' +
            '<span class="vui-overline vui-modal__tag" data-tag></span>' +
            '<h2 class="vui-modal__title" id="vui-modal-title" data-title></h2>' +
          '</div>' +
          '<div class="vui-modal__head-right">' +
            '<span class="vui-status-chip" data-status data-tone="busy">' +
              '<span class="vui-status-dot"></span><span data-status-label>Connecting</span>' +
            '</span>' +
            '<button type="button" class="vui-icon-btn" data-close aria-label="Close call">' +
              '<svg class="vui-icon" aria-hidden="true"><use href="#icon-close"></use></svg>' +
            '</button>' +
          '</div>' +
        '</header>' +
        '<div class="vui-modal__body">' +
          '<div class="vui-orb vui-orb--modal" data-orb></div>' +
          '<div class="vui-modal__voice" data-voice>' +
            '<div class="vui-chat">' +
              '<div class="vui-chat__log" data-log role="log" aria-label="Conversation"></div>' +
              '<div class="vui-chat__typing" data-typing hidden aria-hidden="true"><span></span><span></span><span></span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<footer class="vui-modal__footer">' +
          '<button type="button" class="vui-btn vui-btn--ghost" data-type>' +
            '<svg class="vui-icon vui-icon--sm" aria-hidden="true"><use href="#icon-mic-off"></use></svg>' +
            '<span data-type-label>Type instead</span>' +
          '</button>' +
          '<button type="button" class="vui-hangup" data-hangup aria-label="End call">' +
            '<svg class="vui-icon vui-icon--lg" aria-hidden="true"><use href="#icon-hangup"></use></svg>' +
          '</button>' +
          '<button type="button" class="vui-btn vui-btn--ghost" data-retry hidden>' +
            '<svg class="vui-icon vui-icon--sm" aria-hidden="true"><use href="#icon-retry"></use></svg>' +
            'Try again' +
          '</button>' +
        '</footer>' +
        '<form class="vui-chat-input" data-chat hidden>' +
          '<input type="text" autocomplete="off" aria-label="Type your message" placeholder="Type your message…">' +
          '<button type="submit" class="vui-icon-btn" aria-label="Send message">' +
            '<svg class="vui-icon" aria-hidden="true"><use href="#icon-send"></use></svg>' +
          '</button>' +
        '</form>' +
      '</div>';

    this.mount.appendChild(modal);
    this.el = modal;
    this.card = modal.querySelector('.vui-modal__card');
    this.statusChip = modal.querySelector('[data-status]');
    this.statusLabel = modal.querySelector('[data-status-label]');
    this.titleEl = modal.querySelector('[data-title]');
    this.tagEl = modal.querySelector('[data-tag]');
    this.chatLog = modal.querySelector('[data-log]');
    this.typingEl = modal.querySelector('[data-typing]');
    this.chatForm = modal.querySelector('[data-chat]');
    this.chatInput = modal.querySelector('[data-chat] input');
    this.hangupBtn = modal.querySelector('[data-hangup]');
    this.closeBtn = modal.querySelector('[data-close]');
    this.typeBtn = modal.querySelector('[data-type]');
    this.typeLabel = modal.querySelector('[data-type-label]');
    this.retryBtn = modal.querySelector('[data-retry]');
    this.voicePane = modal.querySelector('[data-voice]');
    this.orbEl = modal.querySelector('[data-orb]');

    if (window.VUI.orb) {
      this.orb = new window.VUI.orb.Orb(modal.querySelector('[data-orb]'), {
        size: 132,
        palette: 'sky',
        state: 'disconnected'
      });
    }

    modal.querySelector('[data-backdrop]').addEventListener('click', function () {
      self.close();
    });
    this.closeBtn.addEventListener('click', function () { self.close(); });
    this.hangupBtn.addEventListener('click', function () {
      if (self.opts.onHangup) self.opts.onHangup();
    });
    this.retryBtn.addEventListener('click', function () {
      if (self.opts.onRetry) self.opts.onRetry();
    });
    this.typeBtn.addEventListener('click', function () {
      if (self.opts.onToggleType) self.opts.onToggleType();
    });
    this.chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = self.chatInput.value.trim();
      if (!text) return;
      self.chatInput.value = '';
      if (self.opts.onSend) self.opts.onSend(text);
    });

    this._escHandler = function (e) {
      if (e.key === 'Escape') self.close();
    };
    this._tabHandler = function (e) {
      if (e.key !== 'Tab') return;
      var focusables = self.card.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
  };

  /* ---- Public API ------------------------------------------------------- */

  Modal.prototype.open = function (scenario, fromEl) {
    this._trigger = fromEl || null;
    this.titleEl.textContent = scenario.title;
    this.tagEl.textContent = scenario.industry || scenario.tag || '';
    if (this.orb) {
      this.orb.opts.palette = scenario.orb || 'sky';
      this.orb._resolvePalette();
      this.orb.setState('connecting');
    }
    this.setStatus('Connecting', 'busy');
    this._resetChat();

    this.el.hidden = false;
    this._open = true;

    document.addEventListener('keydown', this._escHandler);
    document.addEventListener('keydown', this._tabHandler);
    if (this.opts.onOpen) this.opts.onOpen();

    if (this.reduced || !fromEl) {
      this._fadeIn();
    } else {
      this._morphOpen(fromEl);
    }

    var self = this;
    setTimeout(function () {
      self._focusFirst();
    }, this.reduced ? FADE_MS : MORPH_MS);
  };

  Modal.prototype.close = function () {
    if (!this._open) return;
    this._open = false;
    document.removeEventListener('keydown', this._escHandler);
    document.removeEventListener('keydown', this._tabHandler);

    var self = this;
    var done = function () {
      self.el.hidden = true;
      self._restoreFocus();
      if (self.opts.onClose) self.opts.onClose();
    };

    if (this.reduced) {
      this._fadeOut(done);
    } else {
      this._morphClose(done);
    }
  };

  Modal.prototype.setStatus = function (label, tone) {
    this.statusLabel.textContent = label;
    this.statusChip.setAttribute('data-tone', tone || 'busy');
  };

  Modal.prototype.appendMessage = function (role, text) {
    var msg = document.createElement('div');
    msg.className = 'vui-msg vui-msg--' + role;
    msg.textContent = text;
    this.chatLog.appendChild(msg);
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
  };

  Modal.prototype.clearMessages = function () {
    this.chatLog.innerHTML = '';
  };

  Modal.prototype.showTyping = function () {
    this.typingEl.hidden = false;
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
  };

  Modal.prototype.hideTyping = function () {
    this.typingEl.hidden = true;
  };

  Modal.prototype.setVoiceMode = function () {
    this.chatForm.hidden = true;
    this.voicePane.hidden = false;
    if (this.orbEl) this.orbEl.hidden = false;
    this.typeLabel.textContent = 'Type instead';
    this.retryBtn.hidden = true;
  };

  Modal.prototype.setChatMode = function () {
    this.voicePane.hidden = false;
    this.chatForm.hidden = false;
    if (this.orbEl) this.orbEl.hidden = true;
    this.typeLabel.textContent = 'Back to voice';
    setTimeout(function (self) { self.chatInput.focus(); }, 60, this);
  };

  Modal.prototype.showRetry = function () {
    this.retryBtn.hidden = false;
  };

  Modal.prototype.isOpen = function () { return this._open; };

  /* ---- Morph ------------------------------------------------------------ */

  Modal.prototype._morphOpen = function (fromEl) {
    var card = this.card;
    var from = fromEl.getBoundingClientRect();
    var to = card.getBoundingClientRect();
    var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
    var dy = (from.top + from.height / 2) - (to.top + to.height / 2);
    var sx = from.width / to.width;
    var sy = from.height / to.height;
    card.animate([
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')', opacity: 0.4 },
      { transform: 'translate(0,0) scale(1,1)', opacity: 1 }
    ], { duration: MORPH_MS, easing: 'cubic-bezier(.65,0,.35,1)' });
    this.el.querySelector('[data-backdrop]').animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 300, easing: 'linear' }
    );
  };

  Modal.prototype._morphClose = function (done) {
    var card = this.card;
    var to = card.getBoundingClientRect();
    var fromEl = this._trigger;
    var from;
    if (fromEl && fromEl.isConnected) {
      from = fromEl.getBoundingClientRect();
    } else {
      from = { left: to.left + to.width / 2, top: to.top + to.height / 2, width: 0, height: 0 };
    }
    var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
    var dy = (from.top + from.height / 2) - (to.top + to.height / 2);
    var sx = from.width / to.width;
    var sy = from.height / to.height;
    var anim = card.animate([
      { transform: 'translate(0,0) scale(1,1)', opacity: 1 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')', opacity: 0.4 }
    ], { duration: MORPH_MS, easing: 'cubic-bezier(.65,0,.35,1)' });
    anim.onfinish = done;
    this.el.querySelector('[data-backdrop]').animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 300, easing: 'linear' }
    );
  };

  Modal.prototype._fadeIn = function () {
    this.card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: 'linear' });
    this.el.querySelector('[data-backdrop]').animate(
      [{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: 'linear' });
  };

  Modal.prototype._fadeOut = function (done) {
    var anim = this.card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: 'linear' });
    anim.onfinish = done;
  };

  /* ---- Focus ------------------------------------------------------------ */

  Modal.prototype._focusFirst = function () {
    var first = this.card.querySelector('button, input, [href], [tabindex]:not([tabindex="-1"])');
    if (first) first.focus();
    else this.card.setAttribute('tabindex', '-1'), this.card.focus();
  };

  Modal.prototype._restoreFocus = function () {
    if (this._trigger && this._trigger.isConnected && this._trigger.focus) {
      this._trigger.focus();
    }
  };

  Modal.prototype._resetChat = function () {
    this.clearMessages();
    this.hideTyping();
    this.setVoiceMode();
  };

  Modal.prototype.destroy = function () {
    document.removeEventListener('keydown', this._escHandler);
    document.removeEventListener('keydown', this._tabHandler);
    if (this.orb) this.orb.destroy();
    if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
  };

  VUI.modal = { Modal: Modal };
})(window.VUI = window.VUI || {});
