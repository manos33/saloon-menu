function vibrate() {
  if (navigator.vibrate) navigator.vibrate(50);
}

function navigateToOffers(e) {
  if (e.target.closest('.announce-dismiss')) return;
  vibrate();
  var currentMode = localStorage.getItem('saloon_mode') || 'food';
  var btn = currentMode === 'food'
    ? document.querySelector('.nav-btn-food[onclick*="s0"]')
    : document.querySelector('.nav-btn-drinks[onclick*="d0"]');
  if (btn) showCategory(currentMode === 'food' ? 's0' : 'd0', btn, currentMode);
}

function showCategory(id, btn, mode, direction = 'none') {
  vibrate();
  var modeClass = mode === 'food' ? '.nav-btn-food' : '.nav-btn-drinks';
  var container = mode === 'food' ? document.getElementById('food-sections') : document.getElementById('drinks-sections');

  if (container) container.classList.add('sec-wrapper');

  var currentActive = container.querySelector('.sec.active');
  var target = document.getElementById(id);

  if (currentActive && currentActive.id === id && direction === 'none') {
    currentActive.style.display = 'block';
  } else if ((direction === 'next' || direction === 'prev') && currentActive && currentActive.id !== id) {
    currentActive.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');
    if (target) target.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');

    void currentActive.offsetWidth;
    if (target) void target.offsetWidth;

    if (direction === 'next') {
      currentActive.classList.add('slide-out-left');
      if (target) target.classList.add('slide-in-right');
    } else if (direction === 'prev') {
      currentActive.classList.add('slide-out-right');
      if (target) target.classList.add('slide-in-left');
    }

    var oldActive = currentActive;
    setTimeout(function () {
      oldActive.classList.remove('active', 'slide-out-left', 'slide-out-right');
      oldActive.style.display = 'none';
    }, 300);

    if (target) {
      target.style.display = 'block';
      target.classList.add('active');
      setTimeout(() => target.classList.remove('slide-in-left', 'slide-in-right'), 350);
    }
  } else {
    var secs = container.querySelectorAll('.sec');
    secs.forEach(function (s) {
      s.style.display = 'none';
      s.style.animation = '';
      s.classList.remove('active', 'slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');
    });
    if (target) {
      target.style.display = 'block';
      target.classList.add('active');
      if (direction === 'swipe-done') {
        target.style.animation = 'none';
      } else if (direction === 'none') {
        // Allow stagger animation if directly tapped from top nav
        target.classList.remove('no-stagger');
      }
    }
  }

  var btns = document.querySelectorAll(modeClass);
  btns.forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');

  var foodLegend = document.getElementById('food-legend');
  if (foodLegend) {
    foodLegend.style.display = (mode === 'food' && id !== 's0') ? 'flex' : 'none';
  }

  // Removed window.scrollTo to preserve vertical scroll position per user request
  localStorage.setItem('saloon_category', id);
  localStorage.setItem('saloon_mode', mode);
}

function switchMode(mode, btn) {
  vibrate();
  clearSearch(false);

  var modeBtns = document.querySelectorAll('.mode-btn');
  modeBtns.forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');

  var navFood = document.getElementById('nav-food');
  var navDrinks = document.getElementById('nav-drinks');
  var secFood = document.getElementById('food-sections');
  var secDrinks = document.getElementById('drinks-sections');
  var foodLegend = document.getElementById('food-legend');

  if (mode === 'drinks') {
    navFood.classList.add('hidden');
    secFood.style.display = 'none';
    navDrinks.classList.remove('hidden');
    secDrinks.style.display = 'block';
    if (foodLegend) foodLegend.style.display = 'none';

    var activeDrink = document.querySelector('.nav-btn-drinks.active');
    if (activeDrink) { showCategory(activeDrink.getAttribute('onclick').match(/'([^']+)'/)[1], activeDrink, 'drinks'); }
    else { showCategory('d0', document.querySelector('.nav-btn-drinks'), 'drinks'); }

  } else {
    navDrinks.classList.add('hidden');
    secDrinks.style.display = 'none';
    navFood.classList.remove('hidden');
    secFood.style.display = 'block';

    var activeFood = document.querySelector('.nav-btn-food.active');
    if (activeFood) { showCategory(activeFood.getAttribute('onclick').match(/'([^']+)'/)[1], activeFood, 'food'); }
  }
}

function toggleLanguage() {
  vibrate();
  var body = document.body;
  var currentLang = body.getAttribute('data-lang');
  var newLang = currentLang === 'el' ? 'en' : 'el';
  body.setAttribute('data-lang', newLang);

  document.getElementById('label-el').classList.toggle('active', newLang === 'el');
  document.getElementById('label-en').classList.toggle('active', newLang === 'en');

  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.placeholder = newLang === 'el' ? 'Αναζήτηση μενού...' : 'Search menu...';
  }

  localStorage.setItem('preferred_lang', newLang);
}

// Advanced Search Logic
function handleSearch() {
  var inputSearch = document.getElementById('searchInput');
  if (!inputSearch) return;
  var input = inputSearch.value.trim().toLowerCase();
  var clearBtn = document.getElementById('searchClear');
  var currentMode = localStorage.getItem('saloon_mode') || 'food';
  var container = currentMode === 'food' ? document.getElementById('food-sections') : document.getElementById('drinks-sections');
  var resContainer = document.getElementById('search-results-container');
  var navWrap = currentMode === 'food' ? document.getElementById('nav-food') : document.getElementById('nav-drinks');
  var currentLang = document.body.getAttribute('data-lang') || 'el';

  if (input.length > 0) {
    clearBtn.style.display = 'block';
    if (navWrap) navWrap.style.display = 'none';

    container.style.display = 'none';
    resContainer.style.display = 'block';
    resContainer.innerHTML = '';

    var elements = container.querySelectorAll('.item, .ice-card, .platter-card, .sig-card, .promo-card, .happy-hour-card, .info-card');
    var matches = 0;

    elements.forEach(function (el) {
      var textContent = el.textContent || el.innerText;

      var parentSec = el.closest('.sec');
      var catLabel = '';
      var fullCatText = '';
      var labels = parentSec.querySelectorAll('.cat-label, .sec-title, .spirit-acc-title');
      var bestLabel = parentSec.querySelector('.sec-title');
      for (var i = 0; i < labels.length; i++) {
        if (labels[i].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) {
          bestLabel = labels[i];
        }
      }

      if (bestLabel) {
        fullCatText = bestLabel.innerText.toLowerCase();
        // Prefer displaying only the current language version
        var langNode = bestLabel.querySelector('[lang-' + currentLang + ']');
        if (langNode) {
          catLabel = langNode.innerText.trim();
        } else {
          catLabel = bestLabel.innerText.replace(/V =.*?$/, '').trim();
        }
      }

      // Enhanced keywords detection (e.g. Vegetarian)
      var isVegQuery = (input === 'veg' || input === 'vegetarian' || input === 'vegeterian' || input === 'χορτοφαγικό' || input === 'χορτοφαγικο');
      var isVegItem = el.querySelector('.vbadge') !== null;

      // Match against item text OR category text OR vegetarian keyword
      if (textContent.toLowerCase().includes(input) || fullCatText.includes(input) || (isVegQuery && isVegItem)) {
        matches++;

        var clone = el.cloneNode(true);

        // Highlight text nodes inside item
        var searchTargets = clone.querySelectorAll('.item-title, .item-desc, .ice-title, .ice-flavors, .ice-p, .platter-title, .platter-p, [lang-el], [lang-en]');
        if (searchTargets.length > 0) {
          searchTargets.forEach(t => highlightNode(t, input));
        } else {
          // Fallback
          highlightNode(clone, input);
        }

        var catDiv = document.createElement('div');
        catDiv.style.fontSize = '12.5px';
        catDiv.style.color = 'var(--sub)';
        catDiv.style.fontWeight = '600';
        catDiv.style.textTransform = 'uppercase';
        catDiv.style.marginTop = '4px';
        catDiv.style.letterSpacing = '1.5px';
        catDiv.innerText = "— " + catLabel + " —";

        // Also highlight category directly!
        if (catLabel.toLowerCase().includes(input)) {
          highlightNode(catDiv, input);
        }

        // Insert label dynamically based on card type
        if (clone.classList.contains('item') || clone.classList.contains('sig-card')) {
          var header = clone.querySelector('.item-header') || clone.querySelector('.sig-card-name');
          if (header) {
            if (clone.classList.contains('sig-card')) {
              header.parentNode.insertBefore(catDiv, header);
            } else {
              header.parentNode.insertBefore(catDiv, header.nextSibling);
            }
          } else {
            clone.insertBefore(catDiv, clone.firstChild);
          }
        } else {
          clone.insertBefore(catDiv, clone.firstChild);
        }

        clone.style.display = 'block';
        clone.style.opacity = '1';
        clone.style.transform = 'translateY(0)';
        clone.style.animation = 'none';

        resContainer.appendChild(clone);
      }
    });

    if (matches === 0) {
      var menuNameEl = currentMode === 'food' ? 'Μενού Φαγητού' : 'Μενού Ποτών';
      var menuNameEn = currentMode === 'food' ? 'Food Menu' : 'Drinks Menu';
      var noResText = currentLang === 'el'
        ? 'Δεν βρέθηκε "' + inputSearch.value + '" στο ' + menuNameEl
        : 'No "' + inputSearch.value + '" was found in the ' + menuNameEn;

      resContainer.innerHTML = '<div style="text-align:center; padding: 40px 20px; color:var(--muted); font-style:italic;">' + noResText + '</div>';
    }

  } else {
    clearSearch(true);
  }
}

function highlightNode(node, query) {
  if (node.nodeType === 3) {
    var val = node.nodeValue;
    if (!val.trim()) return;
    var lowerVal = val.toLowerCase();
    var index = lowerVal.indexOf(query);
    if (index >= 0) {
      var span = document.createElement('span');
      var before = val.substring(0, index);
      var match = val.substring(index, index + query.length);
      var after = val.substring(index + query.length);

      span.appendChild(document.createTextNode(before));
      var mark = document.createElement('mark');
      mark.className = 'highlight';
      mark.appendChild(document.createTextNode(match));
      span.appendChild(mark);

      var afterNode = document.createTextNode(after);
      span.appendChild(afterNode);

      node.parentNode.replaceChild(span, node);
      highlightNode(afterNode, query);
    }
  } else if (node.nodeType === 1 && node.childNodes && !/(script|style|mark)/i.test(node.tagName)) {
    // Must convert to array because we might be adding spanning nodes
    var children = Array.from(node.childNodes);
    for (var i = 0; i < children.length; i++) {
      highlightNode(children[i], query);
    }
  }
}

function clearSearch(restoreCategory = true) {
  var clearBtn = document.getElementById('searchClear');
  var inputEl = document.getElementById('searchInput');
  if (inputEl) inputEl.value = '';
  if (clearBtn) clearBtn.style.display = 'none';

  var resContainer = document.getElementById('search-results-container');
  if (resContainer) {
    resContainer.style.display = 'none';
    resContainer.innerHTML = '';
  }

  var currentMode = localStorage.getItem('saloon_mode') || 'food';
  var container = currentMode === 'food' ? document.getElementById('food-sections') : document.getElementById('drinks-sections');
  if (!container) return;

  var navWrap = currentMode === 'food' ? document.getElementById('nav-food') : document.getElementById('nav-drinks');
  if (navWrap) navWrap.style.display = '';

  container.style.display = 'block';

  if (restoreCategory) {
    var savedCat = localStorage.getItem('saloon_category') || (currentMode === 'food' ? 's0' : 'd0');
    var btnClass = currentMode === 'food' ? '.nav-btn-food' : '.nav-btn-drinks';
    var catBtn = document.querySelector(btnClass + '[onclick*="' + savedCat + '"]');
    if (catBtn) {
      showCategory(savedCat, catBtn, currentMode);
    }
  }
}

function initSplash() {
  var splash = document.getElementById('splash-screen');
  if (!splash) return;
  if (sessionStorage.getItem('saloon_splash_seen')) {
    splash.style.display = 'none';
  } else {
    splash.addEventListener('click', function () {
      vibrate();
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.style.display = 'none';
        sessionStorage.setItem('saloon_splash_seen', 'true');
      }, 600);
    });
  }
}

var foodCategories = ['s0', 's1', 's2', 's3', 's4', 's9', 's5', 's6', 's7', 's8'];
var drinksCategories = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6'];

var touchStartX = 0;
var touchStartY = 0;
var touchCurrentX = 0;
var swipeActiveSec = null;
var swipePrevSec = null;
var swipeNextSec = null;
var isHorizontalSwipe = false;
var isSwipeLocked = false;
var swipeCategories = [];
var swipeCurrentIdx = -1;
var swipeNavWrap = null;
var swipeCurrentBtnTarget = 0;
var swipeNextBtnTarget = 0;
var swipePrevBtnTarget = 0;

function cleanUpSwipeStyles(tA, tP, tN) {
  if (tA) { tA.style.transform = ''; tA.style.transition = ''; tA.style.animation = 'none'; }
  if (tP) { tP.style.transform = ''; tP.style.transition = ''; tP.style.position = ''; tP.style.top = ''; tP.style.width = ''; tP.style.display = ''; tP.style.animation = 'none'; }
  if (tN) { tN.style.transform = ''; tN.style.transition = ''; tN.style.position = ''; tN.style.top = ''; tN.style.width = ''; tN.style.display = ''; tN.style.animation = 'none'; }
}

function resetSwipeGlobals() {
  swipeActiveSec = null;
  swipePrevSec = null;
  swipeNextSec = null;
  isHorizontalSwipe = false;
  swipeNavWrap = null;
}

document.addEventListener('touchstart', function (e) {
  if (isSwipeLocked) return;
  // Only allow swipe if the interaction starts inside the menu content areas
  if (!e.target.closest('#food-sections') && !e.target.closest('#drinks-sections')) return;
  
  // Specific exclusions (like modals) just in case they overlap
  if (e.target.closest('.chef-modal-content') || e.target.closest('.vescovi-modal-content')) return;
  var inputSearch = document.getElementById('searchInput');
  if (inputSearch && inputSearch.value.length > 0) return;

  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchCurrentX = 0;
  isHorizontalSwipe = false;

  var currentMode = localStorage.getItem('saloon_mode') || 'food';
  swipeCategories = currentMode === 'food' ? foodCategories : drinksCategories;
  var currentCat = localStorage.getItem('saloon_category') || swipeCategories[0];
  swipeCurrentIdx = swipeCategories.indexOf(currentCat);
  swipeActiveSec = document.getElementById(currentCat);

  var prevCat = swipeCurrentIdx > 0 ? swipeCategories[swipeCurrentIdx - 1] : null;
  var nextCat = swipeCurrentIdx < swipeCategories.length - 1 ? swipeCategories[swipeCurrentIdx + 1] : null;

  swipePrevSec = prevCat ? document.getElementById(prevCat) : null;
  swipeNextSec = nextCat ? document.getElementById(nextCat) : null;

  swipeNavWrap = document.getElementById(currentMode === 'food' ? 'nav-food' : 'nav-drinks');
  if (swipeNavWrap) {
    var sBtnClass = currentMode === 'food' ? '.nav-btn-food' : '.nav-btn-drinks';
    var cBtn = swipeNavWrap.querySelector(sBtnClass + '[onclick*="' + currentCat + '"]');
    var pBtn = prevCat ? swipeNavWrap.querySelector(sBtnClass + '[onclick*="' + prevCat + '"]') : null;
    var nBtn = nextCat ? swipeNavWrap.querySelector(sBtnClass + '[onclick*="' + nextCat + '"]') : null;

    var w2 = window.innerWidth / 2;
    if (cBtn) swipeCurrentBtnTarget = cBtn.offsetLeft - w2 + (cBtn.offsetWidth / 2);
    swipePrevBtnTarget = pBtn ? pBtn.offsetLeft - w2 + (pBtn.offsetWidth / 2) : swipeCurrentBtnTarget;
    swipeNextBtnTarget = nBtn ? nBtn.offsetLeft - w2 + (nBtn.offsetWidth / 2) : swipeCurrentBtnTarget;
  }

  if (swipeActiveSec) {
    swipeActiveSec.style.transition = 'none';
    swipeActiveSec.style.animation = 'none';
  }
  if (swipePrevSec) {
    swipePrevSec.style.display = 'block';
    swipePrevSec.style.position = 'absolute';
    swipePrevSec.style.top = '0';
    swipePrevSec.style.width = '100%';
    swipePrevSec.style.transition = 'none';
    swipePrevSec.style.animation = 'none';
    swipePrevSec.style.transform = 'translateX(-100%)';
  }
  if (swipeNextSec) {
    swipeNextSec.style.display = 'block';
    swipeNextSec.style.position = 'absolute';
    swipeNextSec.style.top = '0';
    swipeNextSec.style.width = '100%';
    swipeNextSec.style.transition = 'none';
    swipeNextSec.style.animation = 'none';
    swipeNextSec.style.transform = 'translateX(100%)';
  }
}, { passive: true });

document.addEventListener('touchmove', function (e) {
  if (!swipeActiveSec) return;

  var x = e.touches[0].clientX;
  var y = e.touches[0].clientY;
  var dx = x - touchStartX;
  var dy = y - touchStartY;

  if (!isHorizontalSwipe) {
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isHorizontalSwipe = true;
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      cleanUpSwipeStyles(swipeActiveSec, swipePrevSec, swipeNextSec);
      resetSwipeGlobals();
      return;
    }
  }

  if (isHorizontalSwipe) {
    if (e.cancelable) e.preventDefault();

    touchCurrentX = dx;
    var w = window.innerWidth;

    // Rubber-band effect at limits
    if ((swipeCurrentIdx === 0 && dx > 0) || (swipeCurrentIdx === swipeCategories.length - 1 && dx < 0)) {
      dx = dx * 0.3;
    }

    swipeActiveSec.style.transform = 'translateX(' + dx + 'px)';
    if (swipePrevSec) swipePrevSec.style.transform = 'translateX(' + (dx - w) + 'px)';
    if (swipeNextSec) swipeNextSec.style.transform = 'translateX(' + (dx + w) + 'px)';

    if (swipeNavWrap) {
      var percentage = Math.abs(dx) / w;
      if (percentage > 1) percentage = 1;
      var scrollTrg = swipeCurrentBtnTarget;
      if (dx < 0 && swipeNextSec) {
        scrollTrg = swipeCurrentBtnTarget + percentage * (swipeNextBtnTarget - swipeCurrentBtnTarget);
      } else if (dx > 0 && swipePrevSec) {
        scrollTrg = swipeCurrentBtnTarget + percentage * (swipePrevBtnTarget - swipeCurrentBtnTarget);
      }
      swipeNavWrap.scrollLeft = scrollTrg;
    }
  }
}, { passive: false });

document.addEventListener('touchend', function (e) {
  if (!swipeActiveSec || !isHorizontalSwipe) {
    cleanUpSwipeStyles(swipeActiveSec, swipePrevSec, swipeNextSec);
    resetSwipeGlobals();
    return;
  }

  isSwipeLocked = true;

  var dx = touchCurrentX;
  var absDx = Math.abs(dx);
  var currentMode = localStorage.getItem('saloon_mode') || 'food';
  var threshold = Math.min(window.innerWidth * 0.25, 90);

  var transitionStr = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  swipeActiveSec.style.transition = transitionStr;
  if (swipePrevSec) swipePrevSec.style.transition = transitionStr;
  if (swipeNextSec) swipeNextSec.style.transition = transitionStr;

  if (absDx > threshold) {
    var isNext = dx < 0;
    var nextIdx = swipeCurrentIdx + (isNext ? 1 : -1);

    if (nextIdx >= 0 && nextIdx < swipeCategories.length) {
      var nextCat = swipeCategories[nextIdx];
      var btnClass = currentMode === 'food' ? '.nav-btn-food' : '.nav-btn-drinks';
      var catBtn = document.querySelector(btnClass + '[onclick*="' + nextCat + '"]');

      if (catBtn) {
        // Complete the drag animation natively in JS
        swipeActiveSec.style.transform = isNext ? 'translateX(-100%)' : 'translateX(100%)';
        var incomingSec = isNext ? swipeNextSec : swipePrevSec;
        if (incomingSec) incomingSec.style.transform = 'translateX(0)';

        var tA = swipeActiveSec, tP = swipePrevSec, tN = swipeNextSec;
        setTimeout(function () {
          if (tA) tA.style.display = 'none'; // Prevent flicker before stripping inline transform
          cleanUpSwipeStyles(tA, tP, tN);
          showCategory(nextCat, catBtn, currentMode, 'swipe-done');
          catBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          setTimeout(function () { isSwipeLocked = false; }, 50);
        }, 300);

        resetSwipeGlobals();
        return;
      }
    }
  }

  // Snap back (revert)
  swipeActiveSec.style.transform = 'translateX(0)';
  if (swipePrevSec) swipePrevSec.style.transform = 'translateX(-100%)';
  if (swipeNextSec) swipeNextSec.style.transform = 'translateX(100%)';

  if (swipeNavWrap) {
    swipeNavWrap.scrollTo({ left: swipeCurrentBtnTarget, behavior: 'smooth' });
  }

  var tA = swipeActiveSec, tP = swipePrevSec, tN = swipeNextSec;
  setTimeout(function () {
    cleanUpSwipeStyles(tA, tP, tN);
    isSwipeLocked = false;
  }, 300);

  resetSwipeGlobals();
}, { passive: true });

function lockLeafPosition() {
  var leaf = document.querySelector('.decor-br');
  if (leaf) {
    var vh = window.innerHeight;
    leaf.style.top = (vh - 200) + 'px';
  }
}

function startBannerRotation() {
  var slides = document.querySelectorAll('.announce-slide');
  if (slides.length === 0) return;
  var current = 0;
  setInterval(function () {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 4000);
}

window.onload = function () {
  initSplash();
  var savedLang = localStorage.getItem('preferred_lang') || 'el';
  document.body.setAttribute('data-lang', savedLang);
  document.getElementById('label-el').classList.toggle('active', savedLang === 'el');
  document.getElementById('label-en').classList.toggle('active', savedLang === 'en');

  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.placeholder = savedLang === 'el' ? 'Αναζήτηση μενού...' : 'Search menu...';
  }

  lockLeafPosition();

  var chefContent = document.querySelector('.chef-modal-content');
  if (chefContent) {
    var chefStartY = 0;
    var chefCurrentY = 0;
    chefContent.addEventListener('touchstart', function (e) {
      chefStartY = e.touches[0].clientY;
      chefContent.style.transition = 'none';
    }, { passive: true });
    chefContent.addEventListener('touchmove', function (e) {
      var y = e.touches[0].clientY;
      var dy = y - chefStartY;
      if (dy > 0) {
        chefCurrentY = dy;
        chefContent.style.transform = 'translateY(' + dy + 'px) translateZ(0)';
      }
    }, { passive: false });
    chefContent.addEventListener('touchend', function (e) {
      chefContent.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      if (chefCurrentY > 150) {
        if (typeof closeChefModal === 'function') closeChefModal();
      } else {
        chefContent.style.transform = 'translateY(0) translateZ(0)';
      }
      chefCurrentY = 0;
    });
  }
  startBannerRotation();

  var savedMode = localStorage.getItem('saloon_mode') || 'food';
  var savedCat = localStorage.getItem('saloon_category') || 's0';

  var modeBtns = document.querySelectorAll('.mode-btn');
  modeBtns.forEach(function (b) { b.classList.remove('active'); });
  var modeBtnSelector = savedMode === 'drinks' ? '.mode-btn:nth-child(2)' : '.mode-btn:nth-child(1)';
  var activeModeBtn = document.querySelector(modeBtnSelector);
  if (activeModeBtn) activeModeBtn.classList.add('active');

  document.getElementById('nav-food').classList.toggle('hidden', savedMode === 'drinks');
  document.getElementById('food-sections').style.display = savedMode === 'drinks' ? 'none' : 'block';
  document.getElementById('nav-drinks').classList.toggle('hidden', savedMode === 'food');
  document.getElementById('drinks-sections').style.display = savedMode === 'food' ? 'none' : 'block';

  var catBtn = document.querySelector(`[onclick*="'${savedCat}'"]`);
  if (catBtn) {
    showCategory(savedCat, catBtn, savedMode);
  }
};

window.addEventListener('scroll', function () {
  var btt = document.getElementById('backToTop');
  if (btt) {
    if (window.scrollY > 400) btt.classList.add('visible');
    else btt.classList.remove('visible');
  }
});

/* =========================================
   AMBIENT SOUND TOGGLE
========================================= */
function toggleAmbientSound() {
  const waves = document.getElementById('ambient-waves');
  const music = document.getElementById('ambient-music');
  const btn = document.getElementById('ambient-toggle');
  
  if (!waves || !music || !btn) return;

  if (waves.paused) {
    // Set relative volumes (Waves slightly louder for immersion)
    waves.volume = 0.6;
    music.volume = 0.4;
    
    // Play both together
    Promise.all([waves.play(), music.play()]).then(() => {
      btn.classList.add('playing');
    }).catch(err => {
      console.log('Audio playback failed', err);
    });
  } else {
    waves.pause();
    music.pause();
    btn.classList.remove('playing');
  }
}

/* =========================================
   COCKTAIL QUIZ LOGIC
========================================= */
const quizQuestions = [
  {
    en: "What's your mood tonight?",
    el: "Ποια είναι η διάθεσή σας;",
    options: [
      { id: "relaxed", en: "Relaxed & Chill", el: "Χαλαρή & Ήρεμη" },
      { id: "party", en: "Ready to Party!", el: "Έτοιμος για Party!" },
      { id: "romantic", en: "Romantic & Cozy", el: "Ρομαντική" },
      { id: "adventurous", en: "Adventurous", el: "Περιπετειώδης" }
    ]
  },
  {
    en: "What flavor profile do you prefer?",
    el: "Τι γευστικό προφίλ προτιμάτε;",
    options: [
      { id: "sweet", en: "Sweet & Fruity", el: "Γλυκό & Φρουτώδες" },
      { id: "bitter", en: "Bitter & Complex", el: "Πικρό & Πολύπλοκο" },
      { id: "refreshing", en: "Fresh & Citrusy", el: "Δροσερό & Κιτρώδες" },
      { id: "spicy", en: "Spicy & Exotic", el: "Πικάντικο & Εξωτικό" }
    ]
  },
  {
    en: "How strong do you want it?",
    el: "Πόσο δυνατό το θέλετε;",
    options: [
      { id: "light", en: "Light & Easy", el: "Ελαφρύ" },
      { id: "strong", en: "Strong & Bold", el: "Δυνατό" },
      { id: "virgin", en: "Virgin (Mocktail)", el: "Χωρίς Αλκοόλ" }
    ]
  }
];

let currentQuizStep = 0;
let quizAnswers = {};

function openQuizModal() {
  currentQuizStep = 0;
  quizAnswers = {};
  renderQuizStep();
  document.getElementById('quiz-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeQuizModal() {
  document.getElementById('quiz-modal').classList.remove('active');
  document.body.style.overflow = '';
}

function renderQuizStep() {
  const container = document.getElementById('quiz-step-container');
  const lang = document.body.getAttribute('data-lang') || 'el';
  container.innerHTML = '';

  if (currentQuizStep < quizQuestions.length) {
    const q = quizQuestions[currentQuizStep];
    const questionText = lang === 'en' ? q.en : q.el;
    
    let html = `<div class="quiz-step active">
                  <div class="quiz-question">${questionText}</div>
                  <div class="quiz-options">`;
    
    q.options.forEach(opt => {
      const optText = lang === 'en' ? opt.en : opt.el;
      html += `<div class="quiz-option" onclick="selectQuizOption('${opt.id}')">${optText}</div>`;
    });
    
    html += `</div></div>`;
    container.innerHTML = html;
  } else {
    // Show loading
    container.innerHTML = `
      <div class="quiz-loading">
        <i class="fa-solid fa-cocktail quiz-loading-icon"></i>
        <div style="font-weight:600; color:var(--dark);">${lang === 'en' ? 'Shaking your cocktail...' : 'Ετοιμάζουμε το αποτέλεσμα...'}</div>
      </div>
    `;
    
    setTimeout(showQuizResult, 1500);
  }
}

function selectQuizOption(value) {
  vibrate();
  quizAnswers[`step${currentQuizStep}`] = value;
  currentQuizStep++;
  renderQuizStep();
}

function showQuizResult() {
  const lang = document.body.getAttribute('data-lang') || 'el';
  const container = document.getElementById('quiz-step-container');
  
  // Logic mapping based on flavor and mood
  let resultId = 'teddy_bear'; 
  const flavor = quizAnswers.step1;
  const strength = quizAnswers.step2;
  const mood = quizAnswers.step0;

  if (flavor === 'sweet') {
    resultId = (strength === 'strong') ? 'behind_her_eyes' : 'netflix_n_chill';
    if (mood === 'party') resultId = 'bite_my_cookie';
  } else if (flavor === 'bitter') {
    resultId = 'truth_or_dare';
  } else if (flavor === 'refreshing') {
    resultId = (mood === 'adventurous') ? 'new_zealand' : 'mastiha_ri';
    if (strength === 'light') resultId = 'feels_like_summer';
  } else if (flavor === 'spicy') {
    resultId = 'spicy_gentleman';
  }

  // Fallback
  if (strength === 'virgin') {
    resultId = 'feels_like_summer'; 
  }

  const cocktails = {
    'behind_her_eyes': { name: "Behind Her Eyes", descEn: "Sweet & Tropical. Rum with passion fruit and pineapple.", descEl: "Γλυκό & Τροπικό. Ρούμι με φρούτα του πάθους και ανανά." },
    'truth_or_dare': { name: "Truth or Dare", descEn: "Bittersweet & Citrusy with Tequila Blanco.", descEl: "Γλυκόπικρο & Κιτρώδες με Τεκίλα Λευκή." },
    'netflix_n_chill': { name: "Netflix N' Chill", descEn: "Sweet & Creamy Vodka with salted caramel.", descEl: "Γλυκό & Κρεμώδες Vodka με αλατισμένη καραμέλα." },
    'new_zealand': { name: "New Zealand", descEn: "Fresh & Botanical Gin with kiwi and cucumber.", descEl: "Δροσερό & Βοτανικό Τζιν με ακτινίδιο." },
    'feels_like_summer': { name: "Feels Like Summer", descEn: "Light & Fruity Gin with watermelon.", descEl: "Ελαφρύ & Φρουτώδες Τζιν με καρπούζι." },
    'mastiha_ri': { name: "Mastiha-ri", descEn: "Aromatic & Refreshing with Vodka and Masticha.", descEl: "Αρωματικό & Δροσερό με Βότκα και Μαστίχα." },
    'spicy_gentleman': { name: "Spicy Gentleman", descEn: "Spicy & Exotic Tequila with chili and pineapple.", descEl: "Πικάντικο & Εξωτικό με Τεκίλα." },
    'teddy_bear': { name: "Teddy Bear", descEn: "Sweet & Velvety Vodka with bubblegum.", descEl: "Γλυκό & Βελούδινο με Βότκα και τσιχλόφουσκα." },
    'bite_my_cookie': { name: "Bite My Cookie", descEn: "Sweet Dessert Rum with choco cookie.", descEl: "Γλυκό Επιδόρπιο Ρούμι με μπισκότο." }
  };

  const cocktail = cocktails[resultId] || cocktails['teddy_bear'];
  const name = cocktail.name;
  const desc = lang === 'en' ? cocktail.descEn : cocktail.descEl;
  const shareText = lang === 'en' ? 'Share your match' : 'Μοιραστείτε το';

  container.innerHTML = `
    <div style="animation: fadeInStep 0.5s ease forwards;">
      <div style="font-size: 16px; color: var(--muted); margin-bottom: 5px;">
        ${lang === 'en' ? "You're definitely a" : "Σίγουρα σου ταιριάζει το"}
      </div>
      <div class="quiz-result-card">
        <div class="quiz-result-name">${name}</div>
        <div class="quiz-result-desc">${desc}</div>
      </div>
      <button class="quiz-share-btn" style="margin-top:20px;" onclick="shareQuizResult('${name}')">
        <i class="fa-solid fa-share-nodes"></i> ${shareText}
      </button>
      <button onclick="closeQuizModal()" style="display:block; width:100%; margin-top:15px; padding:12px; background:transparent; border:none; color:var(--accent); font-weight:600; font-size:16px; cursor:pointer;">
        ${lang === 'en' ? 'Back to Menu' : 'Επιστροφή στο Μενού'}
      </button>
    </div>
  `;
}

function shareQuizResult(cocktailName) {
  const lang = document.body.getAttribute('data-lang') || 'el';
  const text = lang === 'en' 
    ? `I just took the Saloon Cocktail Quiz and got: ${cocktailName}! Find your match:` 
    : `Έκανα το Saloon Cocktail Quiz και μου έτυχε: ${cocktailName}! Βρες το δικό σου:`;
    
  if (navigator.share) {
    navigator.share({
      title: 'Saloon Signature Cocktail Match',
      text: text,
      url: window.location.href
    });
  } else {
    // Fallback copy to clipboard
    const dummy = document.createElement('textarea');
    document.body.appendChild(dummy);
    dummy.value = text + " " + window.location.href;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    alert(lang === 'en' ? 'Copied to clipboard!' : 'Αντιγράφηκε στο πρόχειρο!');
  }
}