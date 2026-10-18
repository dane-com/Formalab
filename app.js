'use strict';
const rates = Object.freeze({PLA:5,PETG:8,TPU:8,'PLA FLEXI':8,ABS:10,ASA:10});
function selectedPrinter(){return document.getElementById('printer-model')?.value||saved?.fields?.['printer-model']||'p1s';}
function printerConfig(){return window.FORMALAB_PRICING?.[selectedPrinter()]||{name:selectedPrinter()==='a1mini'?'Bambu Lab A1 mini':'Bambu Lab P1S',rates};}
const money = value => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(value);
const number = value => new Intl.NumberFormat('en-PH',{maximumFractionDigits:2}).format(value);
function calculate(material,weight,quantity,student=false){
 if(typeof student!=="boolean") throw new Error("Student selection must be true or false.");
 if(!Object.hasOwn(rates,material)) throw new Error('Choose a listed material.');
 if(!Number.isFinite(weight)||weight<0.01||Math.abs(weight*100-Math.round(weight*100))>0.000001) throw new Error('Enter a weight of at least 0.01 g, with up to two decimal places.');
 if(!Number.isInteger(quantity)||quantity<1||quantity>10000) throw new Error('Enter a whole quantity between 1 and 10,000.');
 const activeRates=printerConfig().rates;if(!Number.isFinite(activeRates[material])||activeRates[material]<=0)throw new Error('Pricing is unavailable for this printer and material.');const grams=Math.round(weight*100);const perPieceCents=Math.round(grams*activeRates[material]);const totalCents=perPieceCents*quantity;
 if(!Number.isSafeInteger(totalCents)) throw new Error('This weight is too large. Enter a smaller weight.');
 const discountCents=student?Math.round(totalCents*0.2):0;
 return {printer:selectedPrinter(),printerName:printerConfig().name,material,weight,quantity,student,rate:activeRates[material],totalWeight:weight*quantity,perPiece:perPieceCents/100,subtotal:totalCents/100,discount:discountCents/100,total:(totalCents-discountCents)/100};
}
window.modelQuote={mode:'upload',ready:false,details:'',filename:''};
const $=id=>document.getElementById(id);let quote;

const storageKey='formalab-work-v36';
let saved={};try{saved=JSON.parse(sessionStorage.getItem(storageKey)||'{}');}catch{}
for(const key of ['time-supports','print-hours','print-minutes'])if(saved.fields)delete saved.fields[key];
if(saved.model)delete saved.model.autoTime;
for(const key of ['printMinutes','timeSource','timeProfile'])if(saved.quote)delete saved.quote[key];
const draftIds=['customer-name','customer-email','customer-phone','project-name','model-filename','preferred-color','dimensions','layer-height','infill','school','request-notes'];
const settingIds=['printer-model','pricing-mode','weight','quantity','student','model-unit','model-scale','model-infill','model-support'];
function saveWork(){
 const fields={...saved.fields};for(const id of [...draftIds,...settingIds]){const el=$(id);if(el)fields[id]=el.type==='checkbox'?el.checked:el.value;}
 const material=document.querySelector('input[name="material"]:checked');
 saved={...saved,fields,material:material?.value||saved.material,quote,model:window.modelQuote};
 try{sessionStorage.setItem(storageKey,JSON.stringify(saved));}catch{}
}
window.modelQuote={...window.modelQuote,...saved.model};
quote=saved.quote||null;
if(quote){quote.printerName=quote.printerName||printerConfig().name;quote.printer=quote.printer||selectedPrinter();}
for(const [id,value] of Object.entries(saved.fields||{})){const el=$(id);if(el){if(el.type==='checkbox')el.checked=!!value;else el.value=value;}}
if(saved.material){const el=document.querySelector('input[name="material"][value="'+saved.material+'"]');if(el)el.checked=true;}
window.addEventListener('pagehide',saveWork);
document.addEventListener('input',()=>queueMicrotask(saveWork));
document.addEventListener('change',()=>queueMicrotask(saveWork));
window.offerReview=()=>{};

function render(){
 if(!$('quote-form'))return;
 $('action-status').textContent='';
 try{if(window.modelQuote.mode==='upload'&&!window.modelQuote.ready)throw new Error('Upload a model or try the demo to see an initial estimate.');quote=calculate(document.querySelector('input[name="material"]:checked').value,Number($('weight').value),Number($('quantity').value),$('student').checked);
 $('error').hidden=true;$('weight').removeAttribute('aria-invalid');$('quantity').removeAttribute('aria-invalid');
 $('total').textContent=money(quote.total);$('summary').textContent=`${quote.material} · ${number(quote.weight)} g × ${number(quote.quantity)} ${quote.quantity===1?'piece':'pieces'}`;
 $('rate').textContent=`${money(quote.rate)} / g`;$('total-weight').textContent=`${number(quote.totalWeight)} g`;$('per-piece').textContent=money(quote.perPiece);$('breakdown-total').textContent=money(quote.total);
 $('subtotal').textContent=money(quote.subtotal);$('discount').textContent='−'+money(quote.discount);$('discount-row').hidden=!quote.student;
 $('copy').disabled=false;$('print').disabled=false;
 }catch(error){quote=null;$('error').textContent=error.message;$('error').hidden=false;$('total').textContent='—';$('summary').textContent='Enter valid print details to calculate.';for(const id of ['rate','total-weight','per-piece','breakdown-total','subtotal','discount']) $(id).textContent='—';$('discount-row').hidden=true;$('copy').disabled=true;$('print').disabled=true;}
}
if($('quote-form')){
$('quote-form').addEventListener('submit',event=>event.preventDefault());$('quote-form').addEventListener('input',render);
$('copy').addEventListener('click',async()=>{if(!quote)return;const text=`FormaLab — Initial estimated quotation\n${window.modelQuote.mode==='upload'?window.modelQuote.details+'\n':'Pricing source: entered slicer weight\n'}Printer: ${quote.printerName} (0.4 mm nozzle)\nMaterial: ${quote.material}\nRate: ${money(quote.rate)}/g\nWeight per piece: ${number(quote.weight)} g\nQuantity: ${number(quote.quantity)}\nTotal weight: ${number(quote.totalWeight)} g\nBase cost per piece: ${money(quote.perPiece)}\nSubtotal: ${money(quote.subtotal)}\n${quote.student?`Student discount (20%): −${money(quote.discount)}\n`:""}Estimated total: ${money(quote.total)}\nSubject to model review. Delivery, design work, and finishing are not included.`;try{await navigator.clipboard.writeText(text);$('action-status').textContent='Quotation copied.';}catch{$('action-status').textContent='Copy is unavailable. Use Print / save PDF to keep your quotation.';}});
$('print').addEventListener('click',()=>{if(quote)window.print();});render();
if(document.modelContext?.registerTool){const lifecycle=new AbortController();try{Promise.resolve(document.modelContext.registerTool({name:'configure_print_quotation',title:'Calculate a print quotation',description:'Select a printing material, weight in grams per piece, and quantity. Updates the visible estimate in PHP; does not place an order.',inputSchema:{type:'object',properties:{material:{type:'string',enum:Object.keys(rates)},weight:{type:'number',minimum:0.01},quantity:{type:'integer',minimum:1,maximum:10000},student:{type:'boolean',description:'Apply the 20% student printing discount.'}},required:['material','weight','quantity'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){const result=calculate(input.material,input.weight,input.quantity,input.student??false);window.modelQuote.mode='manual';window.modelQuote.ready=true;$('pricing-mode').value='manual';$('weight').readOnly=false;$('model-settings').hidden=true;document.querySelector(`input[name="material"][value="${result.material}"]`).checked=true;$('weight').value=result.weight;$('quantity').value=result.quantity;$('student').checked=result.student;render();return {...quote,currency:'PHP',status:'estimate'};}},{signal:lifecycle.signal})).catch(()=>{});window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}catch{}}
}
const menuButton=document.getElementById('menu-toggle');
const navigation=document.getElementById('site-nav');
function closeMenu(){navigation.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');menuButton.textContent='Menu';}
menuButton.addEventListener('click',()=>{const expanded=menuButton.getAttribute('aria-expanded')!=='true';navigation.classList.toggle('is-open',expanded);menuButton.setAttribute('aria-expanded',String(expanded));menuButton.textContent=expanded?'Close':'Menu';});
navigation.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuButton.getAttribute('aria-expanded')==='true'){closeMenu();menuButton.focus();}});
const requestForm=$('request-form');let preparedRequest='';
function buildRequest(){
 if(!quote)throw new Error('Open Upload & estimate first, then return here to prepare your request.');
 const value=id=>$(id).value.trim();
 const name=value('customer-name'),email=value('customer-email'),project=value('project-name');
 if(!name||!email||!project)throw new Error('Enter your name, email, and project name.');
 const optional=[['Contact number','customer-phone'],['Model filename(s)','model-filename'],['Preferred color','preferred-color'],['Dimensions (mm)','dimensions'],['Layer height (mm)','layer-height'],['Infill % / pattern','infill'],['School','school'],['Additional instructions','request-notes']];
 const details=optional.filter(([,id])=>value(id)).map(([label,id])=>`${label}: ${value(id)}`);
 return `To: diazdanejoseph@gmail.com\nSubject: FormaLab quotation request - ${project}\n\nFull name: ${name}\nEmail: ${email}\nProject / item: ${project}\n${details.join('\n')}\n\nPRINT DETAILS\n${window.modelQuote.mode==='upload'?window.modelQuote.details+'\n':'Pricing source: entered slicer weight\n'}Printer: ${quote.printerName} (0.4 mm nozzle)\nMaterial: ${quote.material}\nRate: ${money(quote.rate)} / g\nWeight per piece: ${number(quote.weight)} g\nQuantity: ${number(quote.quantity)}\nTotal weight: ${number(quote.totalWeight)} g\nSubtotal: ${money(quote.subtotal)}\nStudent discount: ${quote.student?'20% ('+money(quote.discount)+')':'Not requested'}\nEstimated total: ${money(quote.total)}\n\nInitial estimate only; please slice and review the attached model to confirm the final quotation.\nAttach the STL, 3MF, or OBJ model file separately. This estimate excludes delivery, design work, and finishing.`;
}
function prepareRequest(){
 if(!requestForm.reportValidity())return false;
 try{preparedRequest=buildRequest();$('draft-text').value=preparedRequest;$('email-draft').hidden=false;$('request-status').textContent='Draft ready. Open the email and attach your model.';return true;}catch(error){$('request-status').textContent=error.message;return false;}
}
if(requestForm){
requestForm.addEventListener('submit',event=>{event.preventDefault();prepareRequest();});
$('copy-request').addEventListener('click',async()=>{if(!prepareRequest())return;try{await navigator.clipboard.writeText(preparedRequest);$('request-status').textContent='Email draft copied. Send it to diazdanejoseph@gmail.com with your model file attached.';window.offerReview();}catch{$('draft-text').focus();$('draft-text').select();$('request-status').textContent='Select and copy the email draft below.';}});
$('print-request').addEventListener('click',()=>{if(!prepareRequest())return;const area=$('request-printout');area.replaceChildren();const title=document.createElement('h1');title.textContent='FormaLab';const subtitle=document.createElement('p');subtitle.textContent='Quotation request';const content=document.createElement('pre');content.textContent=preparedRequest;area.append(title,subtitle,content);document.body.classList.add('request-print');window.print();});
window.addEventListener('afterprint',()=>document.body.classList.remove('request-print'));

requestForm.addEventListener('input',invalidateRequestDraft);$('quote-form')?.addEventListener('input',invalidateRequestDraft);

$('email-request').addEventListener('click',()=>{if(!prepareRequest())return;const lines=preparedRequest.split('\n');const subject=lines[1].replace(/^Subject: /,'');const body=lines.slice(3).join('\n');window.location.href='mailto:diazdanejoseph@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);$('request-status').textContent='Send the draft with your model attached. If needed, use Copy email draft.';window.offerReview();});

}
function invalidateRequestDraft(){if(!requestForm)return;preparedRequest='';$('email-draft').hidden=true;$('request-status').textContent='';}

if($('review-form')){
// Public browser configuration. Database access is controlled by Supabase RLS.
const reviewConnection=Object.freeze({url:'https://ivkygosputyunbjxhbzm.supabase.co',key:'sb_publishable_-mWYN8uYSx2_BSh6tpkykw_MWrdkNRq'});
const reviewForm=$('review-form'),reviewDialog=$('review-dialog'),reviewSubmit=reviewForm.querySelector('button[type="submit"]');
const promptKey='formalab-review-prompt-v1';let prompted=false,returnFocus=null,submittingReview=false,loadingReviews=false,reviewOffset=0;
try{prompted=localStorage.getItem(promptKey)==='seen';}catch{}
function rememberReviewPrompt(){prompted=true;try{localStorage.setItem(promptKey,'seen');}catch{}}
function openReview(){if(reviewDialog.open)return;rememberReviewPrompt();returnFocus=document.activeElement;reviewDialog.showModal();$('close-review').focus();}
function offerReview(){if(!prompted)window.setTimeout(()=>{if(!prompted)openReview();},500);}
window.offerReview=offerReview;
$('write-review')?.addEventListener('click',openReview);
$('close-review').addEventListener('click',()=>reviewDialog.close());
reviewDialog.addEventListener('click',event=>{if(event.target===reviewDialog){const rect=reviewDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)reviewDialog.close();}});
reviewDialog.addEventListener('close',()=>returnFocus?.focus());
function updateReviewStars(){const value=Number(reviewForm.querySelector('input[name="review-rating"]:checked')?.value||0);for(const label of reviewForm.querySelectorAll('.review-star'))label.classList.toggle('is-filled',Number(label.querySelector('input').value)<=value);const names=['','Poor','Fair','Good','Very good','Excellent'];$('review-rating-text').textContent=value?`${value}/5 — ${names[value]}`:'Choose 1–5 stars.';}
reviewForm.addEventListener('input',()=>{if(!submittingReview)$('review-status').textContent='';updateReviewStars();});
async function reviewsApi(query='',options={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetch(reviewConnection.url+'/rest/v1/formalab_reviews'+query,{...options,signal:controller.signal,headers:{apikey:reviewConnection.key,...options.headers}});
 if(!response.ok)throw new Error('Review service unavailable.');return options.method==='POST'?null:await response.json();}finally{clearTimeout(timer);}
}
reviewForm.addEventListener('submit',async event=>{
 event.preventDefault();if(submittingReview||!reviewForm.reportValidity())return;
 const rating=reviewForm.querySelector('input[name="review-rating"]:checked'),comment=$('review-comment').value.trim();
 if(!rating&&!comment){$('review-status').textContent='Add a rating or comment, or close this form.';return;}
 const payload={reviewer_name:$('review-name').value.trim()||'Anonymous',rating:rating?Number(rating.value):null,comment};
 submittingReview=true;reviewSubmit.disabled=true;reviewSubmit.textContent='Submitting…';reviewForm.setAttribute('aria-busy','true');$('review-status').textContent='Submitting your review…';
 try{await reviewsApi('',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)});reviewForm.reset();updateReviewStars();rememberReviewPrompt();$('review-status').textContent='Thank you! Your review will appear after approval.';}
 catch{$('review-status').textContent='Couldn’t submit. Please try again shortly.';}
 finally{submittingReview=false;reviewSubmit.disabled=false;reviewSubmit.textContent='Submit review';reviewForm.removeAttribute('aria-busy');}
});
function reviewCard(review){const card=document.createElement('article');card.className='public-review';const header=document.createElement('div');header.className='public-review-head';const name=document.createElement('h3');name.textContent=review.reviewer_name||'Anonymous';header.append(name);if(review.rating!==null){const rating=document.createElement('span');rating.className='public-review-rating';rating.textContent='★ '+review.rating+'/5';rating.setAttribute('aria-label',review.rating+' out of 5 stars');header.append(rating);}card.append(header);if(review.comment){const comment=document.createElement('p');comment.textContent=review.comment;card.append(comment);}const date=new Date(review.created_at);if(!Number.isNaN(date.getTime())){const time=document.createElement('time');time.dateTime=date.toISOString();time.textContent=date.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});card.append(time);}return card;}
async function loadReviews(reset=true){
 if(loadingReviews)return;loadingReviews=true;$('refresh-reviews').disabled=true;$('more-reviews').disabled=true;$('public-reviews').setAttribute('aria-busy','true');$('reviews-load-status').textContent='Loading reviews…';
 const offset=reset?0:reviewOffset;
 try{const rows=await reviewsApi('?select=id,reviewer_name,rating,comment,created_at&status=eq.approved&order=created_at.desc,id.desc&limit=5&offset='+offset);if(!Array.isArray(rows))throw new Error('Invalid response');if(reset)$('public-reviews').replaceChildren();for(const row of rows)$('public-reviews').append(reviewCard(row));reviewOffset=offset+rows.length;$('more-reviews').hidden=rows.length<5;$('reviews-load-status').textContent=reviewOffset?'':'No reviews yet. You can be the first.';}
 catch{$('reviews-load-status').textContent='Reviews couldn’t load. Try Refresh reviews.';}
 finally{loadingReviews=false;$('refresh-reviews').disabled=false;$('more-reviews').disabled=false;$('public-reviews').removeAttribute('aria-busy');}
}
if($('public-reviews')){$('refresh-reviews').addEventListener('click',()=>loadReviews());$('more-reviews').addEventListener('click',()=>loadReviews(false));if(!document.body.hasAttribute('data-preview'))loadReviews();window.loadFormalabReviews=loadReviews;}
}

// About-section typewriter. Honor reduced motion and pause off-screen.
(()=>{
 const output=document.getElementById('maker-typing');
 if(!output)return;
 const phrases=['One idea at a time.','Bringing your ideas to life.','Made with care, layer by layer.'];
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let phrase=0,letter=phrases[0].length,deleting=true,timer=null,visible=true;
 const stop=()=>{clearTimeout(timer);timer=null;};
 function tick(){
  timer=null;if(motion.matches||document.hidden||!visible)return;
  const text=phrases[phrase];let delay;
  if(deleting){letter=Math.max(0,letter-1);output.textContent=text.slice(0,letter);delay=35;
   if(letter===0){deleting=false;phrase=(phrase+1)%phrases.length;delay=350;}}
  else{letter=Math.min(text.length,letter+1);output.textContent=text.slice(0,letter);delay=75;
   if(letter===text.length){deleting=true;delay=1900;}}
  timer=setTimeout(tick,delay);
 }
 function resume(){stop();if(!motion.matches&&!document.hidden&&visible)timer=setTimeout(tick,1400);}
 function motionChanged(){stop();if(motion.matches){phrase=0;letter=phrases[0].length;deleting=true;output.textContent=phrases[0];}else resume();}
 motion.addEventListener('change',motionChanged);
 document.addEventListener('visibilitychange',resume);
 window.addEventListener('pagehide',stop);window.addEventListener('pageshow',resume);
 if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();},{threshold:.1}).observe(output.closest('.maker-typewriter'));
 }
 resume();
})();

if($('pricing-mode')){$('weight').readOnly=window.modelQuote.mode==='upload';$('model-settings').hidden=window.modelQuote.mode==='manual';}
if($('request-estimate'))$('request-estimate').textContent=quote?`${quote.material} · ${number(quote.weight)} g × ${quote.quantity} · ${money(quote.total)}`:'No estimate yet. Start with Upload & estimate.';
// Prefetch only small HTML pages after clear navigation intent; shared assets use browser cache.
const prefetched=new Set();
function prefetchPage(event){const a=event.target.closest('a');if(!a||navigator.connection?.saveData)return;const url=new URL(a.href,location.href);if(url.origin!==location.origin||!url.pathname.endsWith('.html')||prefetched.has(url.href)||location.protocol==='file:')return;prefetched.add(url.href);const link=document.createElement('link');link.rel='prefetch';link.href=url.href;document.head.append(link);}
navigation.addEventListener('pointerover',prefetchPage);navigation.addEventListener('focusin',prefetchPage);
// Browser Back/Forward may restore a page without rerunning its scripts.
window.addEventListener('pageshow',event=>{
 if(!event.persisted)return;
 try{saved=JSON.parse(sessionStorage.getItem(storageKey)||'{}');}catch{return;}
 for(const id of draftIds){const el=$(id);if(el&&Object.hasOwn(saved.fields||{},id))el.value=saved.fields[id];}
 if(!$('quote-form')){quote=saved.quote||null;window.modelQuote={...window.modelQuote,...saved.model};invalidateRequestDraft();}
 if($('request-estimate'))$('request-estimate').textContent=quote?`${quote.material} · ${number(quote.weight)} g × ${quote.quantity} · ${money(quote.total)}`:'No estimate yet. Start with Upload & estimate.';
});



function refreshPrinterPrices(){
 if(!$('printer-model'))return;
 const config=printerConfig();
 const groups=[['PLA'],['PETG','TPU','PLA FLEXI'],['ABS','ASA']];
 document.querySelectorAll('.service-price').forEach((el,i)=>{const values=groups[i].map(m=>config.rates[m]);const low=Math.min(...values),high=Math.max(...values);el.replaceChildren(document.createTextNode(low===high?'₱'+low:'₱'+low+'–'+high));const unit=document.createElement('span');unit.textContent='/ gram';el.append(unit);});
 for(const input of document.querySelectorAll('input[name="material"]')){const small=input.closest('label').querySelector('small');small.replaceChildren(document.createTextNode('₱'+config.rates[input.value]+' '));const unit=document.createElement('span');unit.textContent='/ gram';small.append(unit);}
}
if($('printer-model')){$('printer-model').addEventListener('change',()=>{refreshPrinterPrices();render();invalidateRequestDraft();saveWork();});refreshPrinterPrices();}

// Match the opening section to the viewport below the persistent navigation.
(()=>{const header=document.querySelector('header');if(!header)return;const size=()=>document.documentElement.style.setProperty('--header-height',header.getBoundingClientRect().height+'px');size();if('ResizeObserver' in window)new ResizeObserver(size).observe(header);else window.addEventListener('resize',size);})();

// Only the opening screen starts without navigation; other pages keep it visible.
(()=>{function updateFloatingNav(){const home=document.querySelector('[data-page-view="overview"]');const onHome=home?!home.hidden:document.body.dataset.page==='overview';document.body.classList.toggle('home-opening',onHome);const show=onHome&&window.scrollY>24;document.body.classList.toggle('nav-revealed',show);if(onHome&&!show&&typeof closeMenu==='function')closeMenu();}window.addEventListener('scroll',updateFloatingNav,{passive:true});window.addEventListener('hashchange',()=>queueMicrotask(updateFloatingNav));window.addEventListener('pageshow',updateFloatingNav);updateFloatingNav();})();

// Reveal Overview sections as they enter view; leave content visible without observer support.
(()=>{const opening=document.querySelector('.brand-opening');if(!opening||!('IntersectionObserver' in window))return;const motion=matchMedia('(prefers-reduced-motion: reduce)');if(motion.matches)return;const targets=document.querySelectorAll('#overview,.studio-facts,.print-process,.print-details,#reviews');const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{threshold:0.08});for(const el of targets){el.classList.add('scroll-reveal');observer.observe(el);}let queued=false;function fade(){queued=false;const home=document.querySelector('[data-page-view="overview"]');if(home?.hidden)return;const amount=Math.min(1,Math.max(0,window.scrollY/Math.max(1,opening.offsetHeight)));opening.style.setProperty('--opening-opacity',String(1-amount*.75));}window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(fade);}},{passive:true});motion.addEventListener?.('change',()=>{if(motion.matches){observer.disconnect();targets.forEach(el=>el.classList.add('is-visible'));opening.style.removeProperty('--opening-opacity');}});fade();})();

// Re-run scroll reveals on every page and replay the brand animation when returning to the top.
(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)');const opening=document.querySelector('.brand-opening');let previousY=window.scrollY,frame=0;function brandMotion(){const current=window.scrollY;if(opening&&!reduced.matches&&previousY>48&&current<=48){opening.classList.remove('is-replaying');void opening.offsetWidth;opening.classList.add('is-replaying');}if(current>48)opening?.classList.remove('is-replaying');previousY=current;}window.addEventListener('scroll',brandMotion,{passive:true});function revealPage(){const hidden=document.querySelector('[data-page-view][hidden]');const scope=hidden?document.querySelector('[data-page-view]:not([hidden])'):document;const items=scope?.querySelectorAll('main section,main article,.studio-facts');if(!items)return;for(const item of items){if(item.classList.contains('page-scroll-reveal'))continue;item.classList.add('page-scroll-reveal');if(reduced.matches||!('IntersectionObserver' in window)){item.classList.add('is-visible');continue;}observer.observe(item);}}const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)entry.target.classList.add('is-visible');else entry.target.classList.remove('is-visible');}},{threshold:.08}):null;window.addEventListener('hashchange',()=>requestAnimationFrame(revealPage));window.addEventListener('pageshow',revealPage);revealPage();reduced.addEventListener?.('change',()=>{if(reduced.matches){observer?.disconnect();document.querySelectorAll('.page-scroll-reveal').forEach(el=>el.classList.add('is-visible'));opening?.classList.remove('is-replaying');}});})();
