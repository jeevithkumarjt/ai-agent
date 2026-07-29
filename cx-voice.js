document.addEventListener('DOMContentLoaded',function(){
var contentRoot=document.getElementById('voice');
var voiceBtn=document.querySelector('.voice');
if(!voiceBtn)return;
var toolbar=document.createElement('div');
toolbar.className='cx-voice-toolbar';
toolbar.innerHTML='<button class="cx-vt-btn" id="cxPlay" title="Play">&#9654;</button><button class="cx-vt-btn" id="cxPause" title="Pause">&#10074;&#10074;</button><button class="cx-vt-btn" id="cxResume" title="Resume">&#9654;</button><button class="cx-vt-btn" id="cxStop" title="Stop">&#9632;</button><div class="cx-vt-divider"></div><span class="cx-vt-label">Voice</span><select class="cx-vt-select" id="cxVoiceSelect"><option value="Jenny">Jenny</option><option value="Aria">Aria</option><option value="Sonia">Sonia</option><option value="David">David</option><option value="Guy">Guy</option></select>';
document.body.appendChild(toolbar);
voiceBtn.addEventListener('click',function(e){e.stopPropagation();toolbar.classList.toggle('active')});
document.addEventListener('click',function(e){if(!toolbar.contains(e.target)&&e.target!==voiceBtn&&!voiceBtn.contains(e.target)){toolbar.classList.remove('active')}});
var selectedVoice='Jenny';
toolbar.querySelector('#cxVoiceSelect').addEventListener('change',function(){selectedVoice=this.value});
function getVoice(){var v=speechSynthesis.getVoices();return v.find(function(x){return x.name.indexOf(selectedVoice)!==-1})||v[0]}
var queue=[],currentIndex=0,speaking=false,paused=false;
function buildQueue(){queue=[];if(!contentRoot)return;contentRoot.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li').forEach(function(el){var t=el.innerText.trim();if(t.length>2)queue.push({element:el,text:t})})}
function speakNext(){if(!speaking)return;if(currentIndex>=queue.length){stopReading();return}var item=queue[currentIndex];document.querySelectorAll('.tts-active').forEach(function(el){el.classList.remove('tts-active')});item.element.classList.add('tts-active');item.element.scrollIntoView({behavior:'smooth',block:'center'});var u=new SpeechSynthesisUtterance(item.text);u.voice=getVoice();u.rate=1;u.pitch=1;u.onend=function(){currentIndex++;speakNext()};speechSynthesis.speak(u)}
function startReading(){speechSynthesis.cancel();buildQueue();currentIndex=0;speaking=true;paused=false;voiceBtn.classList.add('is-playing');toolbar.querySelector('#cxPlay').classList.add('playing');speakNext()}
function pauseReading(){if(speaking){speechSynthesis.pause();paused=true}}
function resumeReading(){if(paused){speechSynthesis.resume();paused=false}}
function stopReading(){speechSynthesis.cancel();speaking=false;paused=false;currentIndex=0;voiceBtn.classList.remove('is-playing');toolbar.querySelector('#cxPlay').classList.remove('playing');document.querySelectorAll('.tts-active').forEach(function(el){el.classList.remove('tts-active')})}
toolbar.querySelector('#cxPlay').addEventListener('click',startReading);
toolbar.querySelector('#cxPause').addEventListener('click',pauseReading);
toolbar.querySelector('#cxResume').addEventListener('click',resumeReading);
toolbar.querySelector('#cxStop').addEventListener('click',stopReading);
document.addEventListener('keydown',function(e){if(e.key==='Escape'){stopReading();toolbar.classList.remove('active')}});
});
function openModal(html){var o=document.createElement('div');o.className='cx-modal-overlay';o.innerHTML='<div class="cx-modal"><button class="cx-modal-close" aria-label="Close">&times;</button>'+html+'</div>';document.body.appendChild(o);o.addEventListener('click',function(e){if(e.target===o)close()});o.querySelector('.cx-modal-close').addEventListener('click',close);function escHandler(e){if(e.key==='Escape')close()}document.addEventListener('keydown',escHandler);function close(){o.remove();document.removeEventListener('keydown',escHandler)}return o}
document.addEventListener('DOMContentLoaded',function(){
var shareBtn=document.querySelector('.share');
if(shareBtn){shareBtn.addEventListener('click',function(){var url=window.location.href;var h='<h3 class="cx-modal-title">Share this page</h3><div class="cx-share-row"><a class="cx-share-icon" target="_blank" href="https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(url)+'">in</a><a class="cx-share-icon" target="_blank" href="https://twitter.com/intent/tweet?url='+encodeURIComponent(url)+'">X</a><a class="cx-share-icon" target="_blank" href="https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)+'">f</a></div><div class="cx-copy-row"><input type="text" readonly class="cx-copy-input" id="cxCopyInput"><button class="cx-copy-btn" id="cxCopyBtn">Copy</button></div>';var overlay=openModal(h);var input=overlay.querySelector('#cxCopyInput');input.value=url;overlay.querySelector('#cxCopyBtn').addEventListener('click',function(){input.select();var btn=this;navigator.clipboard.writeText(input.value).then(function(){btn.textContent='Copied!';setTimeout(function(){btn.textContent='Copy'},1500)})})})}
var summaryBtn=document.querySelector('.summary');
if(summaryBtn){summaryBtn.addEventListener('click',function(e){e.preventDefault();var contentRoot=document.getElementById('voice');var providedSummary=document.getElementById('page-summary');var bodyHTML;if(providedSummary){bodyHTML=providedSummary.innerHTML}else{var heads=contentRoot?contentRoot.querySelectorAll('h2'):[];var items='';for(var i=0;i<heads.length;i++){items+='<li>'+heads[i].textContent.trim()+'</li>'}bodyHTML='<ul class="cx-summary-list">'+items+'</ul>'}openModal('<h3 class="cx-modal-title">Quick summary</h3><div class="cx-summary-body">'+bodyHTML+'</div>')})}
