/* ==========================================
   1. 기본 변수 및 가스레인지 상태 관리
   ========================================== */
const 배경 = document.getElementById('배경');
const 쌓인냄비위 = document.getElementById('쌓인냄비위');
const 냄비템플릿 = document.getElementById('냄비');

const 가스레인지들 = [
  document.getElementById('가스레인지1'),
  document.getElementById('가스레인지2'),
  document.getElementById('가스레인지3'),
  document.getElementById('가스레인지4')
];

const 가스레인지점유상태 = {
  '가스레인지1': false,
  '가스레인지2': false,
  '가스레인지3': false,
  '가스레인지4': false
};

let 현재조작냄비 = null;
let 마우스다운상태 = false;

function 드래그종료() {
  마우스다운상태 = false;
  document.body.classList.remove('dragging-active');
  if (현재조작냄비) {
    if (현재조작냄비.dataset.originalStove) {
      const origId = 현재조작냄비.dataset.originalStove;
      현재조작냄비.style.left = 현재조작냄비.dataset.originalLeft;
      현재조작냄비.style.top = 현재조작냄비.dataset.originalTop;
      현재조작냄비.style.zIndex = 현재조작냄비.dataset.originalZIndex;

      가스레인지점유상태[origId] = true;
      현재조작냄비.dataset.occupiedStove = origId;

      delete 현재조작냄비.dataset.originalStove;
      delete 현재조작냄비.dataset.originalLeft;
      delete 현재조작냄비.dataset.originalTop;
      delete 현재조작냄비.dataset.originalZIndex;

      resumePot(현재조작냄비);
    } else {
      if (현재조작냄비.dataset.occupiedStove) {
        가스레인지점유상태[현재조작냄비.dataset.occupiedStove] = false;
      }
      현재조작냄비.remove();
    }
    현재조작냄비 = null;
  }
}

/* ==========================================
   2. 냄비 드래그 (생성 및 재드래그)
   ========================================== */
쌓인냄비위.addEventListener('mousedown', (e) => {
  if (!isGameActive) return;
  if (e.button === 2) return;
  if (e.target.tagName.toLowerCase() !== 'path') return;

  e.preventDefault();
  
  const 빈자리있음 = Object.values(가스레인지점유상태).includes(false);
  if (!빈자리있음) return;

  마우스다운상태 = true;
  document.body.classList.add('dragging-active');
  
  현재조작냄비 = 냄비템플릿.cloneNode(true);
  현재조작냄비.style.display = 'block';
  delete 현재조작냄비.dataset.originalStove;
  배경.appendChild(현재조작냄비);

  냄비이동(e);
});

배경.addEventListener('mousedown', (e) => {
  if (e.target.closest('#game-over-modal, #game-ui, #restart-btn')) return;
  if (!isGameActive) return; 
  if (e.button === 2) return;

  const 히트박스목록 = [
    '#냄비타원', '.냄비타원',
    '#냄비아래틀', '.냄비아래틀',
    '#냄비위테두리틀', '.냄비위테두리틀',
    '#냄비오른쪽손잡이틀', '.냄비오른쪽손잡이틀',
    '#냄비왼쪽손잡이틀', '.냄비왼쪽손잡이틀',
    '#바닥테두리틀', '.바닥테두리틀',
    '#냄비테두리틀', '.냄비테두리틀'
  ].join(', ');

  const hitbox = e.target.closest(히트박스목록);
  if (!hitbox) return;

  const clickedPot = hitbox.closest('.냄비, #냄비');
  if (!clickedPot || clickedPot === 냄비템플릿) return;

  e.preventDefault();
  e.stopPropagation();

  if (clickedPot.dataset.occupiedStove) {
    const origStove = clickedPot.dataset.occupiedStove;
    clickedPot.dataset.originalStove = origStove;
    clickedPot.dataset.originalLeft = clickedPot.style.left;
    clickedPot.dataset.originalTop = clickedPot.style.top;
    clickedPot.dataset.originalZIndex = clickedPot.style.zIndex;

    가스레인지점유상태[origStove] = false;
    delete clickedPot.dataset.occupiedStove;
  }

  pausePot(clickedPot);

  마우스다운상태 = true;
  document.body.classList.add('dragging-active');
  현재조작냄비 = clickedPot;

  냄비이동(e);
});

window.addEventListener('mousemove', (e) => {
  if (!마우스다운상태 || !현재조작냄비) return;
  냄비이동(e);
});

window.addEventListener('mouseup', (e) => {
  if (!마우스다운상태 || !현재조작냄비) return;
  마우스다운상태 = false;
  document.body.classList.remove('dragging-active');

  const 마우스X = e.clientX;
  const 마우스Y = e.clientY;

  const 쟁반 = document.getElementById('쟁반');
  const 점수판 = document.getElementById('점수판');

  if (쟁반 && 현재조작냄비) {
    const 쟁반영역 = 쟁반.getBoundingClientRect();
    const 중심X = 쟁반영역.left + 쟁반영역.width / 2;
    const 중심Y = 쟁반영역.top + 쟁반영역.height / 2;
    const 반지름X = 쟁반영역.width / 2;
    const 반지름Y = 쟁반영역.height / 2;

    const 거리X = 마우스X - 중심X;
    const 거리Y = 마우스Y - 중심Y;

    const 쟁반내부인가 = ((거리X * 거리X) / (반지름X * 반지름X) + (거리Y * 거리Y) / (반지름Y * 반지름Y)) <= 1;

    if (쟁반내부인가) {
      const 얻은점수 = calculatePotScore(현재조작냄비);
      let 현재점수 = parseInt(점수판.textContent) || 0;
      현재점수 += 얻은점수;
      점수판.textContent = 현재점수 + '원';

      if (현재조작냄비.dataset.originalStove) {
        가스레인지점유상태[현재조작냄비.dataset.originalStove] = false;
      }

      pausePot(현재조작냄비);
      현재조작냄비.remove();
      현재조작냄비 = null;
      return;
    }
  }

  let 올라간가스레인지 = null;

  가스레인지들.forEach((가스레인지) => {
    if (!가스레인지) return;
    const 영역 = 가스레인지.getBoundingClientRect();
    const 중심X = 영역.left + 영역.width / 2;
    const 중심Y = 영역.top + 영역.height / 2;
    const 반지름X = 영역.width / 2;
    const 반지름Y = 영역.height / 2;

    const 거리X = 마우스X - 중심X;
    const 거리Y = 마우스Y - 중심Y;

    const 타원내부인가 = ((거리X * 거리X) / (반지름X * 반지름X) + (거리Y * 거리Y) / (반지름Y * 반지름Y)) <= 1;

    if (타원내부인가 && !가스레인지점유상태[가스레인지.id]) {
      올라간가스레인지 = 가스레인지;
    }
  });

  if (올라간가스레인지) {
    const 배경영역 = 배경.getBoundingClientRect();
    const 레인지영역 = 올라간가스레인지.getBoundingClientRect();

    const 중앙X = ((레인지영역.left + 레인지영역.width / 2) - 배경영역.left) / 배경영역.width * 100;
    const 중앙Y = ((레인지영역.top + 레인지영역.height / 2) - 배경영역.top) / 배경영역.height * 100 - 7;

    현재조작냄비.style.left = `${중앙X}%`;
    현재조작냄비.style.top = `${중앙Y}%`;
    현재조작냄비.style.zIndex = 올라간가스레인지.classList.contains('가스레인지아래') ? 3 : 2;

    const 레인지ID = 올라간가스레인지.id;
    가스레인지점유상태[레인지ID] = true;
    현재조작냄비.dataset.occupiedStove = 레인지ID;

    delete 현재조작냄비.dataset.originalStove;
    delete 현재조작냄비.dataset.originalLeft;
    delete 현재조작냄비.dataset.originalTop;
    delete 현재조작냄비.dataset.originalZIndex;

    resumePot(현재조작냄비);

    현재조작냄비 = null;
  } else {
    if (현재조작냄비.dataset.originalStove) {
      const origId = 현재조작냄비.dataset.originalStove;
      현재조작냄비.style.left = 현재조작냄비.dataset.originalLeft;
      현재조작냄비.style.top = 현재조작냄비.dataset.originalTop;
      현재조작냄비.style.zIndex = 현재조작냄비.dataset.originalZIndex;

      가스레인지점유상태[origId] = true;
      현재조작냄비.dataset.occupiedStove = origId;

      delete 현재조작냄비.dataset.originalStove;
      delete 현재조작냄비.dataset.originalLeft;
      delete 현재조작냄비.dataset.originalTop;
      delete 현재조작냄비.dataset.originalZIndex;

      resumePot(현재조작냄비);
      현재조작냄비 = null;
    } else {
      드래그종료();
    }
  }
});

window.addEventListener('contextmenu', (e) => {
  if (마우스다운상태 || 현재조작냄비) {
    e.preventDefault();
    드래그종료();
  }
});

function 냄비이동(e) {
  if (!현재조작냄비) return;
  const 배경영역 = 배경.getBoundingClientRect();
  const X비율 = (e.clientX - 배경영역.left) / 배경영역.width * 100;
  const Y비율 = (e.clientY - 배경영역.top) / 배경영역.height * 100;

  현재조작냄비.style.left = `${X비율}%`;
  현재조작냄비.style.top = `${Y비율 - 8}%`;
  현재조작냄비.style.zIndex = 100;
}

/* ==========================================
   3. 냄비 일시정지 및 재개 제어 함수
   ========================================== */
function pausePot(potElement) {
  if (!potElement) return;

  if (potElement.탄타이머) {
    clearTimeout(potElement.탄타이머);
    potElement.탄타이머 = null;
  }
  if (potElement.cookingTimeout) {
    clearTimeout(potElement.cookingTimeout);
    potElement.cookingTimeout = null;
  }
  if (potElement.ramenTimeout) {
    clearTimeout(potElement.ramenTimeout);
    potElement.ramenTimeout = null;
  }

  const waterElement = potElement.querySelector('#냄비물, .냄비물');
  if (waterElement) {
    if (waterElement.isBoilWaiting && waterElement.boilWaitStartTime) {
      const elapsedWait = Date.now() - waterElement.boilWaitStartTime;
      waterElement.boilWaitRemaining = Math.max(0, 1000 - elapsedWait);
    } else if (waterElement.boilStartTime) {
      const sessionBoil = Date.now() - waterElement.boilStartTime;
      waterElement.accumulatedBoilTime = (waterElement.accumulatedBoilTime || 0) + sessionBoil;
      waterElement.boilStartTime = null;
    }

    stopBoiling(waterElement, true, true);
    if (waterElement.evaporateTimer) clearTimeout(waterElement.evaporateTimer);
    if (waterElement.evaporateEndTimer) clearTimeout(waterElement.evaporateEndTimer);
    if (waterElement.activeFillAnimation) {
      try { waterElement.activeFillAnimation.cancel(); } catch (err) {}
      waterElement.activeFillAnimation = null;
    }
  }

  const rawEgg = potElement.querySelector('#계란후라이, .계란후라이');
  const cookedEgg = potElement.querySelector('#익은계란후라이, .익은계란후라이');
  if (rawEgg) rawEgg.style.transition = 'none';
  if (cookedEgg) cookedEgg.style.transition = 'none';

  const potRamen = potElement.querySelector('#냄비라면사리, .냄비라면사리');
  const ramenTop = potElement.querySelector('#라면위, .라면위'); 
  const cookedRamen = potElement.querySelector('#익은라면, .익은라면');
  if (potRamen) potRamen.style.transition = 'none';
  if (ramenTop) ramenTop.style.transition = 'none'; 
  if (cookedRamen) cookedRamen.style.transition = 'none';
}

function resumePot(potElement) {
  if (!potElement) return;

  const isBurning = potElement.classList.contains('burning');
  if (isBurning) return;

  const waterElement = potElement.querySelector('#냄비물, .냄비물');
  const potRamen = potElement.querySelector('#냄비라면사리, .냄비라면사리');
  const cookedRamen = potElement.querySelector('#익은라면, .익은라면');
  const rawEgg = potElement.querySelector('#계란후라이, .계란후라이');
  const cookedEgg = potElement.querySelector('#익은계란후라이, .익은계란후라이');

  if (waterElement && waterElement.dataset.evaporating === 'true') {
    const EVAPORATE_DURATION = 2000;
    const elapsed = Date.now() - (waterElement.evaporateStartTime || Date.now());

    if (elapsed >= EVAPORATE_DURATION) {
      stopBoiling(waterElement, true);

      waterElement.classList.remove('evaporating', 'has-soup');
      waterElement.dataset.evaporating = 'false';
      waterElement.dataset.hasSoup = 'false';
      
      potElement.dataset.hasSoup = 'false';
      const soupPowder = potElement.querySelector('.스프가루, #스프가루') || document.querySelector('.스프가루');
      if (soupPowder) soupPowder.style.opacity = '0';

      waterElement.style.transform = 'translate(-50%, 65%) scale(0)';
      potElement.classList.add('burning');
      return;
    }

    const remainingTime = EVAPORATE_DURATION - elapsed;
    waterElement.evaporateEndTimer = setTimeout(() => {
      stopBoiling(waterElement, true);

      waterElement.classList.remove('evaporating', 'has-soup');
      waterElement.dataset.evaporating = 'false';
      waterElement.dataset.hasSoup = 'false';
      
      potElement.dataset.hasSoup = 'false';
      const soupPowder = potElement.querySelector('.스프가루, #스프가루') || document.querySelector('.스프가루');
      if (soupPowder) soupPowder.style.opacity = '0';

      waterElement.style.transform = 'translate(-50%, 65%) scale(0)';
      potElement.classList.add('burning');
    }, remainingTime);

    if (rawEgg && cookedEgg && getComputedStyle(rawEgg).opacity === '1') {
      cookEgg(potElement);
    }
    if (potRamen && cookedRamen && getComputedStyle(potRamen).opacity === '1' && getComputedStyle(cookedRamen).opacity !== '1') {
      cookRamen(potElement, potRamen, cookedRamen);
    }

    return;
  }

  const transformAttr = waterElement ? getComputedStyle(waterElement).transform : '';
  const isWaterPresent = waterElement && (
    waterElement.classList.contains('filling') ||
    waterElement.isBoilWaiting ||
    waterElement.spawnInterval ||
    (waterElement.accumulatedBoilTime > 0) ||
    (transformAttr !== 'none' && !transformAttr.includes('matrix(0'))
  );

  if (!isWaterPresent) {
    potElement.탄타이머 = setTimeout(() => {
      potElement.classList.add('burning');
    }, 2000);
    return;
  }

  startBoiling(waterElement, potElement);

  if (rawEgg && cookedEgg && getComputedStyle(rawEgg).opacity === '1') {
    cookEgg(potElement);
  }

  if (potRamen && cookedRamen && getComputedStyle(potRamen).opacity === '1' && getComputedStyle(cookedRamen).opacity !== '1') {
    if (waterElement && (waterElement.spawnInterval || waterElement.accumulatedBoilTime > 0)) {
      cookRamen(potElement, potRamen, cookedRamen);
    }
  }
}

/* ==========================================
   4. 물병 상호작용
   ========================================== */
const waterBottles = document.querySelectorAll('.물병');
let activeClone = null;
let currentDraggedBottle = null; 
let dragOffsetX = 0; 
let dragOffsetY = 0; 

waterBottles.forEach((waterBottle) => {
  waterBottle.addEventListener('mousedown', (e) => {
    if (typeof isGameActive !== 'undefined' && !isGameActive) return;
    if (e.button !== 0) return; 
    e.preventDefault();

    cleanupDrag();

    currentDraggedBottle = waterBottle;
    currentDraggedBottle.classList.add('dragging');

    activeClone = waterBottle.cloneNode(true);
    activeClone.id = '물병-따라다니는것';
    activeClone.classList.add('물병-클론');

    activeClone.style.width = getComputedStyle(waterBottle).width;
    activeClone.style.height = 'auto';

    document.body.style.cursor = 'grabbing';
    document.body.appendChild(activeClone);

    const rect = activeClone.getBoundingClientRect();
    dragOffsetX = rect.width * -0.43;
    dragOffsetY = rect.height * 0.41;

    moveBottle(e.clientX, e.clientY);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
});

function moveBottle(x, y) {
  if (activeClone) {
    activeClone.style.left = `${x - dragOffsetX}px`;
    activeClone.style.top = `${y - dragOffsetY}px`;
    activeClone.style.transform = 'translate(-50%, -50%) rotate(210deg)';
  }
}

function onMouseMove(e) {
  moveBottle(e.clientX, e.clientY);
}

function onMouseUp(e) {
  const 마우스X = e.clientX;
  const 마우스Y = e.clientY;

  if (activeClone) activeClone.style.display = 'none';
  const elements = document.elementsFromPoint(마우스X, 마우스Y);

  const targetElement = elements.find(
    (el) =>
      el.id === '냄비타원' ||
      el.classList.contains('냄비타원') ||
      el.closest('.냄비타원, #냄비타원')
  );

  if (targetElement) {
    const targetPot =
      targetElement.closest('.냄비, #냄비') || targetElement.parentElement;

    if (targetPot) {
      const isBurning = targetPot.classList.contains('burning');
      const waterElement = targetPot.querySelector('#냄비물, .냄비물');

      const isFilling =
        waterElement &&
        (waterElement.classList.contains('filling') ||
          Boolean(waterElement.activeFillAnimation));
      const isBoilWaiting =
        waterElement && Boolean(waterElement.isBoilWaiting);

      if (!isBurning && !isFilling && !isBoilWaiting) {
        if (waterElement) {
          fillWater(waterElement, targetPot);
        }
      }
    }
  }

  cleanupDrag();
}

function cleanupDrag() {
  if (currentDraggedBottle) {
    currentDraggedBottle.classList.remove('dragging');
    currentDraggedBottle = null;
  }
  document.body.style.cursor = '';

  if (activeClone) {
    activeClone.remove();
    activeClone = null;
  }

  document.querySelectorAll('.물병-클론').forEach((el) => el.remove());
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}

/* ==========================================
   5. 물 제어 및 애니메이션 연동
   ========================================== */
function fillWater(waterElement, potElement) {
  const soupPowder = potElement.querySelector('.스프가루, #스프가루') || document.querySelector('.스프가루');
  const hasSoupAlready = (soupPowder && soupPowder.classList.contains('visible')) || potElement.dataset.hasSoup === 'true';

  if (hasSoupAlready) {
    waterElement.dataset.hasSoup = 'true';
    waterElement.classList.add('has-soup');
    if (soupPowder) {
      soupPowder.classList.remove('visible');
    }
    const soupImg = potElement.querySelector('#라면국물, .라면국물');
    if (soupImg) {
      soupImg.style.opacity = '1';
      soupImg.style.transform = 'scale(1)';
    }
  } else {
    waterElement.classList.remove('has-soup');
    waterElement.dataset.hasSoup = 'false';
  }

  if (potElement.탄타이머) {
    clearTimeout(potElement.탄타이머);
    potElement.탄타이머 = null;
  }

  const isEvaporating = waterElement.classList.contains('evaporating') || waterElement.dataset.evaporating === 'true';
  const isFilling = waterElement.classList.contains('filling') || Boolean(waterElement.activeFillAnimation);

  const isFullyFilled = !isEvaporating && !isFilling && (waterElement.isBoilWaiting || waterElement.spawnInterval || waterElement.accumulatedBoilTime > 0);

  if (isFullyFilled) {
    stopBoiling(waterElement, false);
    if (waterElement.evaporateTimer) clearTimeout(waterElement.evaporateTimer);
    if (waterElement.evaporateEndTimer) clearTimeout(waterElement.evaporateEndTimer);

    waterElement.accumulatedBoilTime = 0;
    waterElement.boilWaitRemaining = null;
    waterElement.boilWaitStartTime = null;

    waterElement.style.transform = 'translate(-50%, 43%) scale(1)';
    startBoiling(waterElement, potElement);
    return;
  }

  stopBoiling(waterElement, false);
  waterElement.accumulatedBoilTime = 0;
  waterElement.boilWaitRemaining = null;
  waterElement.boilWaitStartTime = null;

  if (waterElement.evaporateTimer) clearTimeout(waterElement.evaporateTimer);
  if (waterElement.evaporateEndTimer) clearTimeout(waterElement.evaporateEndTimer);

  if (waterElement.activeFillAnimation) {
    try { waterElement.activeFillAnimation.cancel(); } catch (e) {}
    waterElement.activeFillAnimation = null;
  }

  let currentProgress = 0;
  if (isEvaporating && waterElement.evaporateStartTime) {
    const EVAPORATE_DURATION = 2000;
    const elapsed = Date.now() - waterElement.evaporateStartTime;
    const evaporateProgress = Math.min(1, Math.max(0, elapsed / EVAPORATE_DURATION));
    currentProgress = 1 - evaporateProgress;
  }

  waterElement.classList.remove('filling', 'evaporating');
  waterElement.dataset.evaporating = 'false';
  waterElement.style.transform = '';

  if (!isEvaporating || currentProgress <= 0.05) {
    void waterElement.offsetWidth;
    waterElement.classList.add('filling');

    const onFillingEnd = () => {
      waterElement.removeEventListener('animationend', onFillingEnd);
      waterElement.classList.remove('filling');
      waterElement.style.transform = 'translate(-50%, 43%) scale(1)';
      startBoiling(waterElement, potElement);
    };

    waterElement.addEventListener('animationend', onFillingEnd, { once: true });
    return;
  }

  const FULL_DURATION = 1300;
  const remainingDuration = Math.max(150, FULL_DURATION * (1 - currentProgress));

  let startTransform;
  if (currentProgress < 0.6) {
    const scaleVal = currentProgress / 0.6; 
    startTransform = `translate(-50%, 65%) scale(${scaleVal})`;
  } else {
    const yVal = 65 - ((currentProgress - 0.6) / 0.4) * (65 - 47);
    startTransform = `translate(-50%, ${yVal}%) scale(1)`;
  }

  const keyframes = [];
  keyframes.push({ transform: startTransform });

  if (currentProgress < 0.6) {
    keyframes.push({ 
      transform: 'translate(-50%, 65%) scale(1)', 
      offset: (0.6 - currentProgress) / (1 - currentProgress) 
    });
  }
  keyframes.push({ transform: 'translate(-50%, 47%) scale(1)' });

  try {
    const animation = waterElement.animate(keyframes, {
      duration: remainingDuration,
      easing: 'linear',
      fill: 'forwards'
    });

    waterElement.activeFillAnimation = animation;

    animation.onfinish = () => {
      waterElement.style.transform = 'translate(-50%, 43%) scale(1)';
      if (waterElement.activeFillAnimation) {
        waterElement.activeFillAnimation.cancel();
        waterElement.activeFillAnimation = null;
      }
      startBoiling(waterElement, potElement);
    };
  } catch (err) {
    waterElement.style.transform = 'translate(-50%, 43%) scale(1)';
    startBoiling(waterElement, potElement);
  }
}

function stopBubbles(potElement) {
  if (!potElement) return;

  const waterElement = potElement.querySelector('#냄비물, .냄비물');
  const bubbleContainer = potElement.querySelector('#bubble-container, .bubble-container');

  if (waterElement && waterElement.spawnInterval) {
    clearInterval(waterElement.spawnInterval);
    waterElement.spawnInterval = null;
  }
  if (potElement.bubbleInterval) {
    clearInterval(potElement.bubbleInterval);
    potElement.bubbleInterval = null;
  }

  if (bubbleContainer) {
    bubbleContainer.innerHTML = '';
  }
}

/* ==========================================
   6. 기포 생성 및 끓기
   ========================================== */
function startBoiling(waterElement, potElement) {
  if (!waterElement || !potElement) return;

  const bubbleContainer = potElement.querySelector('#bubble-container, .bubble-container');
  if (!bubbleContainer) return;

  const waitTime = (waterElement.boilWaitRemaining !== undefined && waterElement.boilWaitRemaining !== null)
    ? waterElement.boilWaitRemaining
    : ((waterElement.accumulatedBoilTime > 0) ? 0 : -500);

  if (waitTime > 0) {
    waterElement.isBoilWaiting = true;
    waterElement.boilWaitStartTime = Date.now();
  }

  waterElement.boilTimer = setTimeout(() => {
    waterElement.isBoilWaiting = false;
    waterElement.boilWaitRemaining = null;
    waterElement.boilWaitStartTime = null;

    const potRamen = potElement.querySelector('#냄비라면사리, .냄비라면사리');
    const cookedRamen = potElement.querySelector('#익은라면, .익은라면');

    if (potRamen && cookedRamen) {
      const isRamenPresent = getComputedStyle(potRamen).opacity === '1';
      const isAlreadyCooked = getComputedStyle(cookedRamen).opacity === '1';

      if (isRamenPresent && !isAlreadyCooked) {
        cookRamen(potElement, potRamen, cookedRamen);
      }
    }

    const sessionStartTime = Date.now();
    waterElement.boilStartTime = sessionStartTime;
    const initialAccumulated = waterElement.accumulatedBoilTime || 0;

    const RAMP_UP_DURATION = 1000; 
    const START_FPS = 5;   
    const MAX_FPS = 25;    
    const MAX_BUBBLES = 50; 
    const EVAPORATE_DURATION = 1000;

    function createBubble() {
      if (!waterElement.isConnected || !bubbleContainer) return;

      if (bubbleContainer.querySelectorAll('.bubble').length >= MAX_BUBBLES) {
        scheduleNext();
        return;
      }

      let cx = 50;  
      let cy = 38;  
      let rx = 33;  
      let ry = 17;  

      if (waterElement.dataset.evaporating === 'true') {
        const elapsed = Date.now() - (waterElement.evaporateStartTime || Date.now());
        const progress = Math.min(1, elapsed / EVAPORATE_DURATION);

        cy = cy + progress * 15;      
        rx = rx * (1 - progress);      
        ry = ry * (1 - progress);      
      }

      let randomX, randomY;
      let isValid = false;
      let attempts = 0;

      if (rx > 1 && ry > 1) {
        while (!isValid && attempts < 100) {
          attempts++;
          randomX = (Math.random() * 2 - 1) * rx + cx;
          randomY = (Math.random() * 2 - 1) * ry + cy;

          const normalizedX = (randomX - cx) / rx;
          const normalizedY = (randomY - cy) / ry;

          if (normalizedX * normalizedX + normalizedY * normalizedY <= 1) {
            isValid = true;
          }
        }
      }

      if (isValid) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.style.left = `${randomX}%`;
        bubble.style.top = `${randomY}%`;

        const randomScale = Math.random() * 0.6 + 0.7;
        bubble.style.transform = `scale(${randomScale})`;

        bubbleContainer.appendChild(bubble);

        const removeBubble = () => bubble.remove();
        bubble.addEventListener('animationend', removeBubble, { once: true });
        setTimeout(removeBubble, 2000);
      }

      scheduleNext();
    }

    function scheduleNext() {
      if (!waterElement.isConnected) return;

      let nextDelay;

      if (waterElement.dataset.evaporating === 'true') {
        const elapsed = Date.now() - (waterElement.evaporateStartTime || Date.now());
        const progress = Math.min(1, elapsed / EVAPORATE_DURATION);
        const currentFPS = MAX_FPS * (1 - progress); 
        nextDelay = currentFPS > 0.5 ? (1000 / currentFPS) : 2000;
      } else {
        const elapsed = initialAccumulated + (Date.now() - sessionStartTime);
        const progress = Math.min(1, elapsed / RAMP_UP_DURATION); 
        const currentFPS = START_FPS + (MAX_FPS - START_FPS) * progress;
        nextDelay = 1000 / currentFPS;
      }

      waterElement.spawnInterval = setTimeout(createBubble, nextDelay);
    }

    createBubble();

    const remainingEvaporateTime = Math.max(0, 9000 - initialAccumulated);
    waterElement.evaporateTimer = setTimeout(() => {
      startEvaporating(waterElement, potElement);
    }, remainingEvaporateTime);

  }, waitTime);
}

/* ==========================================
   7. 물 증발 연출
   ========================================== */
function startEvaporating(waterElement, potElement) {
  waterElement.classList.remove('filling');
  waterElement.style.transform = ''; 

  waterElement.dataset.evaporating = 'true';
  waterElement.evaporateStartTime = Date.now();

  waterElement.classList.add('evaporating');

  waterElement.evaporateEndTimer = setTimeout(() => {
    stopBoiling(waterElement, true);

    waterElement.classList.remove('evaporating', 'has-soup');
    waterElement.dataset.evaporating = 'false';
    waterElement.dataset.hasSoup = 'false';
    
    potElement.dataset.hasSoup = 'false';
    const soupPowder = potElement.querySelector('.스프가루, #스프가루') || document.querySelector('.스프가루');
    if (soupPowder) soupPowder.style.opacity = '0';

    waterElement.style.transform = 'translate(-50%, 65%) scale(0)';
    
    potElement.classList.add('burning');
  }, 2000);
}

/* ==========================================
   8. 정지 및 리셋 함수
   ========================================== */
function stopBoiling(waterElement, clearExistingBubbles = false, keepEvaporateState = false) {
  if (!waterElement) return;

  if (!keepEvaporateState) {
    waterElement.dataset.evaporating = 'false';
  }
  waterElement.isBoilWaiting = false;

  if (waterElement.boilTimer) {
    clearTimeout(waterElement.boilTimer);
    waterElement.boilTimer = null;
  }
  if (waterElement.spawnInterval) {
    clearTimeout(waterElement.spawnInterval);
    waterElement.spawnInterval = null;
  }

  if (clearExistingBubbles) {
    const potElement = waterElement.closest('#냄비, .냄비') || waterElement.parentElement;
    const bubbleContainer = potElement ? potElement.querySelector('#bubble-container, .bubble-container') : null;

    if (bubbleContainer) {
      bubbleContainer.querySelectorAll('.bubble').forEach(b => b.remove());
    }
  }
}

/* ==========================================
   9. 스프 드래그 및 적용
   ========================================== */
const soupPackets = document.querySelectorAll('.스프');
let activeSoupClone = null;
let currentSoupPacket = null;

if (soupPackets.length > 0) {
  soupPackets.forEach(soupPacket => {
    soupPacket.addEventListener('mousedown', (e) => {
      if (!isGameActive) return; 
      if (e.button !== 0) return;
      e.preventDefault();

      currentSoupPacket = soupPacket;
      currentSoupPacket.classList.add('dragging');

      activeSoupClone = currentSoupPacket.cloneNode(true);
      activeSoupClone.classList.add('스프-따라다니는것', '스프-클론');

      activeSoupClone.style.width = getComputedStyle(currentSoupPacket).width;
      activeSoupClone.style.height = 'auto';
      activeSoupClone.style.position = 'fixed'; 
      activeSoupClone.style.pointerEvents = 'none'; 
      activeSoupClone.style.zIndex = '9999';
      
      document.body.style.cursor = 'grabbing';
      document.body.appendChild(activeSoupClone);

      requestAnimationFrame(() => {
        moveSoup(e.clientX, e.clientY);
      });

      window.addEventListener('mousemove', onSoupMouseMove);
      window.addEventListener('mouseup', onSoupMouseUp);
    });
  });
}

function moveSoup(x, y) {
  if (activeSoupClone) {
    const rect = activeSoupClone.getBoundingClientRect();
    const offsetX = rect.width * 0.5;
    const offsetY = rect.height * 0.5;

    activeSoupClone.style.left = `${x - offsetX}px`;
    activeSoupClone.style.top = `${y - offsetY}px`;
  }
}

function onSoupMouseMove(e) {
  moveSoup(e.clientX, e.clientY);
}

function onSoupMouseUp(e) {
  const 마우스X = e.clientX;
  const 마우스Y = e.clientY;

  if (activeSoupClone) activeSoupClone.style.display = 'none';

  const elements = document.elementsFromPoint(마우스X, 마우스Y);
  
  const targetEllipse = elements.find(el => 
    el.id === '냄비타원' || 
    el.classList.contains('냄비타원') ||
    el.closest('#냄비타원, .냄비타원')
  );

  if (targetEllipse) {
    const targetPot = targetEllipse.closest('.냄비, #냄비') || targetEllipse.parentElement;

    if (targetPot) {
      const isBurning = targetPot.classList.contains('burning');

      if (!isBurning) {
        targetPot.dataset.hasSoup = 'true';

        const waterElement = targetPot.querySelector('#냄비물, .냄비물');
        if (waterElement) {
          addSoup(waterElement, targetPot, 마우스X, 마우스Y);
        }
      }
    }
  }

  if (currentSoupPacket) {
    currentSoupPacket.classList.remove('dragging');
    currentSoupPacket = null;
  }
  document.body.style.cursor = '';

  if (activeSoupClone) {
    activeSoupClone.remove();
    activeSoupClone = null;
  }
  window.removeEventListener('mousemove', onSoupMouseMove);
  window.removeEventListener('mouseup', onSoupMouseUp);
}

function addSoup(waterElement, potElement, dropX, dropY) {
  if (!waterElement || !potElement) return;

  const isBurning = potElement.classList.contains('burning');
  const isEvaporating = waterElement.classList.contains('evaporating') || waterElement.dataset.evaporating === 'true';

  if (isBurning || isEvaporating) return;

  if (potElement.dataset.hasEgg === 'true') {
    potElement.dataset.lateSoupPenalty = 'true';
  }

  const transformAttr = getComputedStyle(waterElement).transform;
  const isWaterPresent = waterElement.classList.contains('filling') ||
                         waterElement.isBoilWaiting ||
                         waterElement.spawnInterval ||
                         (waterElement.accumulatedBoilTime > 0) ||
                         (transformAttr !== 'none' && !transformAttr.includes('matrix(0'));

  const soupPowder = potElement.querySelector('.스프가루, #스프가루') || document.querySelector('.스프가루');
  potElement.dataset.hasSoup = 'true';

  if (isWaterPresent) {
    const isBoiling = waterElement && (Boolean(waterElement.spawnInterval) || waterElement.accumulatedBoilTime > 0);
    if (isBoiling) {
      potElement.dataset.soupBoilingBonus = 'true';
    }

    if (soupPowder) {
      soupPowder.style.opacity = '0';
      soupPowder.classList.remove('visible');
    }

    waterElement.dataset.hasSoup = 'true';
    waterElement.classList.add('has-soup');

    const soupImg = potElement.querySelector('#라면국물, .라면국물');
    if (soupImg) {
      animateSoupSpread(soupImg, dropX, dropY);
    }
  } else {
    if (soupPowder) {
      soupPowder.style.opacity = '1';
      soupPowder.classList.add('visible');
    }
  }
}

function animateSoupSpread(soupImg, dropX, dropY) {
  const potElement = soupImg.closest('.냄비, #냄비') || soupImg.parentElement;
  const waterSvg = potElement ? potElement.querySelector('#냄비물, .냄비물') : null;

  soupImg.style.transformBox = 'fill-box';
  soupImg.style.display = 'block';

  let originX = 50;
  let originY = 50;

  if (waterSvg && dropX !== undefined && dropY !== undefined) {
    const rect = waterSvg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      originX = Math.max(0, Math.min(100, ((dropX - rect.left) / rect.width) * 100));
      originY = Math.max(0, Math.min(100, ((dropY - rect.top) / rect.height) * 100));
    }
  }

  soupImg.style.transformOrigin = `${originX}% ${originY}%`;

  if (soupImg.activeSoupAnimation) {
    try { soupImg.activeSoupAnimation.cancel(); } catch (e) {}
  }

  soupImg.activeSoupAnimation = soupImg.animate([
    { transform: 'scale(0)', opacity: 0 },
    { transform: 'scale(1)', opacity: 1 }
  ], {
    duration: 600,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    fill: 'forwards'
  });
}

/* ==========================================
   10. 라면사리 드래그 및 익히기
   ========================================== */
/* ==========================================
   10. 라면사리 드래그 및 익히기
   ========================================== */
const ramenNoodles = document.querySelectorAll('.라면사리');
let activeRamenClone = null;
let currentDraggedRamen = null; 

ramenNoodles.forEach((ramenNoodle) => {
  ramenNoodle.addEventListener('mousedown', (e) => {
    if (typeof isGameActive !== 'undefined' && !isGameActive) return;
    if (e.button !== 0) return; 
    e.preventDefault();

    cleanupRamenDrag(); 

    currentDraggedRamen = ramenNoodle;
    currentDraggedRamen.classList.add('dragging');

    activeRamenClone = ramenNoodle.cloneNode(true);
    activeRamenClone.id = '라면사리-따라다니는것';
    activeRamenClone.classList.add('라면사리-클론');

    activeRamenClone.style.width = getComputedStyle(ramenNoodle).width;
    activeRamenClone.style.height = 'auto';

    document.body.style.cursor = 'grabbing';
    document.body.appendChild(activeRamenClone);

    requestAnimationFrame(() => {
      moveRamen(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', onRamenMouseMove);
    window.addEventListener('mouseup', onRamenMouseUp);
  });
});

function moveRamen(x, y) {
  if (activeRamenClone) {
    activeRamenClone.style.left = `${x}px`;
    activeRamenClone.style.top = `${y}px`;
    activeRamenClone.style.transform = 'translate(-50%, -50%)'; 
  }
}

function onRamenMouseMove(e) {
  moveRamen(e.clientX, e.clientY);
}

function onRamenMouseUp(e) {
  const 마우스X = e.clientX;
  const 마우스Y = e.clientY;

  if (activeRamenClone) activeRamenClone.style.display = 'none';

  const elements = document.elementsFromPoint(마우스X, 마우스Y);
  
  const targetEllipse = elements.find(el => 
    el.id === '냄비타원' || 
    el.classList.contains('냄비타원') ||
    el.closest('#냄비타원, .냄비타원')
  );

  if (targetEllipse) {
    const targetPot = targetEllipse.closest('.냄비, #냄비') || targetEllipse.parentElement;

    if (targetPot) {
      const isBurning = targetPot.classList.contains('burning');
      const waterElement = targetPot.querySelector('#냄비물, .냄비물');
      const potRamen = targetPot.querySelector('#냄비라면사리, .냄비라면사리');
      const ramenTop = targetPot.querySelector('#라면위, .라면위'); 
      const cookedRamen = targetPot.querySelector('#익은라면, .익은라면');

      const rawRamenOpacity = potRamen ? parseFloat(getComputedStyle(potRamen).opacity) : 0;
      const cookedRamenOpacity = cookedRamen ? parseFloat(getComputedStyle(cookedRamen).opacity) : 0;
      const hasRamenAlready = rawRamenOpacity > 0 || cookedRamenOpacity > 0;

      const isBoiling = waterElement && (Boolean(waterElement.spawnInterval) || waterElement.accumulatedBoilTime > 0);

      if (!isBurning && !hasRamenAlready) {
        if (potRamen) {
          potRamen.style.transition = 'none';
          if (ramenTop) ramenTop.style.transition = 'none'; 
          if (cookedRamen) cookedRamen.style.transition = 'none';

          potRamen.style.opacity = '1';
          if (ramenTop) ramenTop.style.opacity = '1'; 
          if (cookedRamen) cookedRamen.style.opacity = '0';

          if (isBoiling) {
            targetPot.dataset.ramenBoilingBonus = 'true';
            cookRamen(targetPot, potRamen, cookedRamen);
          }
        }
      }
    }
  }

  cleanupRamenDrag();
}

function cleanupRamenDrag() {
  if (currentDraggedRamen) {
    currentDraggedRamen.classList.remove('dragging');
    currentDraggedRamen = null;
  }
  document.body.style.cursor = '';

  if (activeRamenClone) {
    activeRamenClone.remove();
    activeRamenClone = null;
  }
  
  document.querySelectorAll('.라면사리-클론').forEach(el => el.remove());
  window.removeEventListener('mousemove', onRamenMouseMove);
  window.removeEventListener('mouseup', onRamenMouseUp);
}

function cookRamen(potElement, potRamen, cookedRamen) {
  if (!potRamen || !cookedRamen) return;

  const ramenTop = potElement.querySelector('#라면위, .라면위'); 

  if (potElement.ramenTimeout) {
    clearTimeout(potElement.ramenTimeout);
  }

  potElement.ramenTimeout = setTimeout(() => {
    // 1초가 지나 실제로 면이 익기 시작하는 순간에만 플래그를 true로 변경
    potElement.dataset.ramenIsCooking = 'true';

    potRamen.style.transition = 'opacity 1s linear';
    if (ramenTop) ramenTop.style.transition = 'opacity 1s linear'; 
    cookedRamen.style.transition = 'opacity 1s linear';

    potRamen.style.opacity = '0';
    if (ramenTop) ramenTop.style.opacity = '0'; 
    cookedRamen.style.opacity = '1';
  }, 100);
}

/* ==========================================
   11. 계란 드래그 및 익히기
   ========================================== */
const eggs = document.querySelectorAll('.계란, #계란');
let activeEggClone = null;
let currentEgg = null;

if (eggs.length > 0) {
  eggs.forEach(egg => {
    egg.addEventListener('mousedown', (e) => {
      if (typeof isGameActive !== 'undefined' && !isGameActive) return; 
      if (e.button !== 0) return;
      e.preventDefault();

      currentEgg = egg; 

      activeEggClone = document.createElement('img');
      activeEggClone.src = '계란.svg'; 
      
      activeEggClone.id = '계란-따라다니는것';
      activeEggClone.classList.add('계란-클론');

      activeEggClone.style.width = '3.9%'; 
      activeEggClone.style.height = 'auto';

      activeEggClone.style.position = 'fixed'; 
      activeEggClone.style.pointerEvents = 'none'; 
      activeEggClone.style.zIndex = '9999';
      
      document.body.style.cursor = 'grabbing';
      document.body.appendChild(activeEggClone);

      requestAnimationFrame(() => {
        moveEgg(e.clientX, e.clientY);
      });

      window.addEventListener('mousemove', onEggMouseMove);
      window.addEventListener('mouseup', onEggMouseUp);
    });
  });
}

function moveEgg(x, y) {
  if (activeEggClone) {
    const rect = activeEggClone.getBoundingClientRect();
    const offsetX = rect.width * 0.5;
    const offsetY = rect.height * 0.5;

    activeEggClone.style.left = `${x - offsetX}px`;
    activeEggClone.style.top = `${y - offsetY}px`;
  }
}

function onEggMouseMove(e) {
  moveEgg(e.clientX, e.clientY);
}

function onEggMouseUp(e) {
  const 마우스X = e.clientX;
  const 마우스Y = e.clientY;

  if (activeEggClone) activeEggClone.style.display = 'none';

  const elements = document.elementsFromPoint(마우스X, 마우스Y);
  const targetEllipse = elements.find(el => 
    el.id === '냄비타원' || 
    el.classList.contains('냄비타원') ||
    el.closest('#냄비타원, .냄비타원')
  );

  if (targetEllipse) {
    const targetPot = targetEllipse.closest('.냄비, #냄비') || targetEllipse.parentElement;
    if (targetPot) {
      // 계란이 투입되었음을 기록
      targetPot.dataset.hasEgg = 'true';

      if (targetPot.dataset.ramenIsCooking === 'true') {
        targetPot.dataset.eggCookedBonus = 'true';
      } else {
        targetPot.dataset.eggCookedBonus = 'false';
      }

      cookEgg(targetPot);
    }
  }

  if (currentEgg) {
    currentEgg.classList.remove('dragging');
    currentEgg = null;
  }

  document.body.style.cursor = '';

  if (activeEggClone) {
    activeEggClone.remove();
    activeEggClone = null;
  }
  
  window.removeEventListener('mousemove', onEggMouseMove);
  window.removeEventListener('mouseup', onEggMouseUp);
}

function cookEgg(potElement) {
  if (!potElement) return;
  if (potElement.classList.contains('burning')) return;

  const rawEgg = potElement.querySelector('#계란후라이, .계란후라이');
  const cookedEgg = potElement.querySelector('#익은계란후라이, .익은계란후라이');

  if (!rawEgg || !cookedEgg) return;

  if (potElement.cookingTimeout) {
    clearTimeout(potElement.cookingTimeout);
  }

  rawEgg.style.transition = 'none';
  cookedEgg.style.transition = 'none';
  rawEgg.style.opacity = '1';
  cookedEgg.style.opacity = '0';

  potElement.cookingTimeout = setTimeout(() => {
    rawEgg.style.transition = 'opacity 1s linear';
    cookedEgg.style.transition = 'opacity 1s linear';

    rawEgg.style.opacity = '0';
    cookedEgg.style.opacity = '1';
  }, 100);
}

/* ==========================================
   12. 점수 계산 함수
   ========================================== */
function calculatePotScore(potElement) {
  if (!potElement) return 0;

  if (potElement.classList.contains('burning')) {
    return 0;
  }

  let score = 0;
  const cookedRamen = potElement.querySelector('#익은라면, .익은라면');
  const cookedEgg = potElement.querySelector('#익은계란후라이, .익은계란후라이');
  const rawRamen = potElement.querySelector('#냄비라면사리, .냄비라면사리');

  const isRamenCooked = cookedRamen && parseFloat(getComputedStyle(cookedRamen).opacity) >= 0.9;
  const isEggCooked = cookedEgg && parseFloat(getComputedStyle(cookedEgg).opacity) > 0.1;
  const hasSoup = potElement.dataset.hasSoup === 'true';

  if (isRamenCooked) score += 300; // 익은 라면
  if (hasSoup) score += 150;       // 스프 추가
  if (isEggCooked) score += 150;   // 계란 추가

  if (rawRamen && !isRamenCooked && parseFloat(getComputedStyle(rawRamen).opacity) > 0.5) score -= 50; // 덜 익은 라면 감점

  if (potElement.dataset.soupBoilingBonus === 'true') {
    score += 100; // 스프 보너스
  }
  if (potElement.dataset.ramenBoilingBonus === 'true') {
    score += 150; // 면 타이밍 보너스
  }
  if (potElement.dataset.eggCookedBonus === 'true') {
    score += 150; // 계란 타이밍 보너스
  }
  if (potElement.dataset.lateSoupPenalty === 'true') {
  score -= 100;
  }

  const waterElement = potElement.querySelector('#냄비물, .냄비물');
  if (waterElement && waterElement.dataset.evaporating === 'true') {
    score -= 500;
  }

  return Math.max(0, score);
}

/* ==========================================
   13. 냄비 리셋 및 게임 시작/종료 제어
   ========================================== */
let isGameActive = false;
let gameTimer = null;
let timeLeft = 30;

const bg = document.getElementById('배경');
const startBtn = document.getElementById('start-btn');
const timerDisplay = document.getElementById('timer');
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreDisplay = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn'); 
const scoreBoard = document.getElementById('점수판');

function resetPot() {
  const allPots = document.querySelectorAll('.냄비, #냄비');
  allPots.forEach(pot => {
    if (pot !== 냄비템플릿) {
      pausePot(pot);
      pot.remove();
    }
  });

  for (let key in 가스레인지점유상태) {
    가스레인지점유상태[key] = false;
  }

  현재조작냄비 = null;
  마우스다운상태 = false;
  document.body.classList.remove('dragging-active');
}

function startGame() {
  resetPot();
  if (scoreBoard) scoreBoard.textContent = '0원';
  timeLeft = 30;
  if (timerDisplay) timerDisplay.textContent = timeLeft;
  
  isGameActive = true;
  if (bg) bg.classList.remove('not-started');
  if (gameOverModal) gameOverModal.style.display = 'none';

  // 상단 버튼 이미지를 '다시시작'으로 변경
  if (startBtn) {
    startBtn.src = '다시시작.svg';
  }

  if (gameTimer) clearInterval(gameTimer);
  gameTimer = setInterval(() => {
    timeLeft--;
    if (timerDisplay) timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  clearInterval(gameTimer);
  isGameActive = false;

  document.querySelectorAll('.냄비, #냄비').forEach(pot => {
    if (pot !== 냄비템플릿) pausePot(pot);
  });

  if (마우스다운상태 || 현재조작냄비) {
    드래그종료();
  }

  document.querySelectorAll(
    '.물병-클론, .스프-클론, .라면사리-클론, .계란-클론, #물병-따라다니는것, .스프-따라다니는것, #라면사리-따라다니는것, #계란-따라다니는것'
  ).forEach(el => el.remove());
  
  document.body.style.cursor = '';
  document.body.classList.remove('dragging-active');
  
  // 상단 버튼 및 배경 원상복구
  if (startBtn) startBtn.src = '게임시작.svg';
  if (bg) bg.classList.add('not-started');

  // 최종 점수 반영 및 성공/실패 텍스트 설정
  const finalScoreText = scoreBoard ? scoreBoard.textContent : '0원';
  if (finalScoreDisplay) finalScoreDisplay.textContent = finalScoreText;

  const scoreNum = parseInt(finalScoreText.replace(/[^0-9]/g, '')) || 0;
  const resultTitle = document.getElementById('game-result-title');

  if (resultTitle) {
    if (scoreNum >= 10000) {
      resultTitle.textContent = '성공';
      resultTitle.style.color = '#2ed573'; // 성공 시 초록색
      resultTitle.style.fontWeight = '1000';
      resultTitle.style.fontSize = '300%';
    } else {
      resultTitle.textContent = '실패';
      resultTitle.style.color = '#ff4757'; // 실패 시 빨간색
      resultTitle.style.fontWeight = '1000';
      resultTitle.style.fontSize = '300%';
    }
  }

  // 모달 창 띄우기
  if (gameOverModal) gameOverModal.style.display = 'flex';
}

if (startBtn) {
  startBtn.addEventListener('click', startGame);
}

const allRestartBtns = document.querySelectorAll('#restart-btn, .restart-btn');

allRestartBtns.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    startGame(); 
  });
});

const btnHowTo = document.getElementById('게임방법버튼');
const imgHowTo = document.getElementById('게임방법');
const btnStart = document.getElementById('게임시작1');

if (btnHowTo) {
  btnHowTo.addEventListener('click', function() {
    if (imgHowTo) imgHowTo.style.height = '100%';
    if (btnStart) btnStart.style.width = '14%';

    if (gameTimer) {
      clearInterval(gameTimer);
      gameTimer = null;
    }

    document.querySelectorAll('.냄비, #냄비').forEach(pot => {
      if (typeof 냄비템플릿 !== 'undefined' && pot !== 냄비템플릿) {
        pausePot(pot);
      }
    });
  });
}

if (btnStart) {
  btnStart.addEventListener('click', function() {
    if (imgHowTo) imgHowTo.style.height = '0%'; 
    btnStart.style.width = '0%';               
    startGame();
  });
}
