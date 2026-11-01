import { BELT_TIERS } from './fluencyMastery.js';

export function showBeltTransitionAnimation(oldLevel, newLevel, transitionType, onComplete) {
  const oldBelt = BELT_TIERS[oldLevel] || BELT_TIERS[1];
  const newBelt = BELT_TIERS[newLevel] || BELT_TIERS[1];
  const isPositive = transitionType === 'PROMOTION' || transitionType === 'RECOVERY';

  const existing = document.getElementById('beltCeremonyOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'beltCeremonyOverlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(10, 15, 29, 0.95);
    backdrop-filter: blur(10px);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.4s ease;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes unwrapOldBelt {
        0% { transform: scaleX(1) translateX(0); opacity: 1; }
        50% { transform: scaleX(1.2) translateX(-40px) rotate(-10deg); opacity: 0.6; }
        100% { transform: scaleX(0) translateX(-120px) rotate(-25deg); opacity: 0; }
      }

      @keyframes wrapNewBelt {
        0% { transform: scale(0.3) translateY(-40px); opacity: 0; filter: brightness(2); }
        60% { transform: scale(1.15) translateY(4px); opacity: 1; filter: brightness(1.4); }
        100% { transform: scale(1) translateY(0); opacity: 1; filter: brightness(1); }
      }

      .ceremony-container {
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        border: 3px solid ${isPositive ? '#f59e0b' : '#64748b'};
        border-radius: 24px;
        padding: 36px 28px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        position: relative;
        box-shadow: 0 20px 50px rgba(0,0,0,0.6);
      }

      .torso-visual-box {
        position: relative;
        width: 220px;
        height: 220px;
        margin: 0 auto 20px auto;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .belt-on-waist {
        position: absolute;
        bottom: 38px;
        width: 140px;
        height: 22px;
        border-radius: 6px;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        transition: all 0.4s ease;
      }

      .belt-knot {
        position: absolute;
        width: 20px;
        height: 28px;
        border-radius: 4px;
        top: -3px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      }

      .belt-tail-left {
        position: absolute;
        width: 12px;
        height: 36px;
        top: 14px;
        left: 56px;
        border-radius: 3px;
        transform: rotate(8deg);
      }

      .belt-tail-right {
        position: absolute;
        width: 12px;
        height: 42px;
        top: 14px;
        right: 56px;
        border-radius: 3px;
        transform: rotate(-12deg);
      }

      .animate-unwrap {
        animation: unwrapOldBelt 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards !important;
      }

      .animate-wrap {
        animation: wrapNewBelt 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important;
      }
    </style>

    <div class="ceremony-container">
      <div style="font-size: 0.85rem; font-weight: 900; letter-spacing: 2px; color: ${isPositive ? '#fbbf24' : '#94a3b8'}; margin-bottom: 8px; text-transform: uppercase;">
        ${transitionType === 'PROMOTION' ? '🏆 DOJO PROMOTION CEREMONY' : (transitionType === 'RECOVERY' ? '⚡ FAST RECOVERY RESTORATION' : '🥋 RANK RE-ALIGNMENT')}
      </div>

      <h1 id="ceremonyHeader" style="font-size: 2rem; margin: 0 0 16px 0; color: #ffffff; font-weight: 900;">
        ${isPositive ? 'PROMOTED TO NEXT RANK!' : 'BELT STEP-DOWN'}
      </h1>

      <div class="torso-visual-box">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 180 L60 50 L100 90 L140 50 L160 180 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
          <path d="M60 50 L100 120 L140 50" fill="none" stroke="#94a3b8" stroke-width="6"/>
          <path d="M65 130 L100 165 L135 130" fill="none" stroke="#cbd5e1" stroke-width="3"/>
        </svg>

        <div id="waistBeltWrapper" style="position: absolute; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
          <div id="activeWaistBelt" class="belt-on-waist" style="background: ${oldBelt.color}; border: 1.5px solid rgba(255,255,255,0.3);">
            <div class="belt-knot" style="background: ${oldBelt.color};"></div>
            <div class="belt-tail-left" style="background: ${oldBelt.color};"></div>
            <div class="belt-tail-right" style="background: ${oldBelt.color};"></div>
          </div>
        </div>
      </div>

      <div id="ceremonyTitle" style="font-size: 1.4rem; font-weight: 800; color: #e2e8f0; margin-bottom: 6px;">
        ${oldBelt.badge} ${oldBelt.name} (Tier ${oldBelt.tier})
      </div>

      <p id="ceremonySubtext" style="font-size: 0.95rem; color: #94a3b8; margin: 0 0 24px 0; min-height: 44px;">
        ${isPositive ? 'The Sensei unties your belt to present your new rank...' : 'Untying belt to return to previous rank for refinement.'}
      </p>

      <button id="btnDismissCeremony" class="btn" style="
        background: ${isPositive ? '#f59e0b' : '#475569'};
        color: white; font-weight: 900; font-size: 1.1rem;
        padding: 14px 32px; border-radius: 12px; width: 100%;
        cursor: pointer; opacity: 0.4; pointer-events: none; transition: all 0.3s ease;
      ">
        ${isPositive ? 'BOW & ACCEPT RANK ↵' : 'BOW & ACKNOWLEDGE ↵'}
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; }, 20);

  // STEP 1: UNTIE & REMOVE OLD BELT (0.9s)
  setTimeout(() => {
    const activeBelt = overlay.querySelector('#activeWaistBelt');
    if (activeBelt) {
      activeBelt.classList.add('animate-unwrap');
    }
  }, 900);

  // STEP 2: REPLACE WITH NEW BELT & BURST AURA (1.8s)
  setTimeout(() => {
    const wrapper = overlay.querySelector('#waistBeltWrapper');
    const titleEl = overlay.querySelector('#ceremonyTitle');
    const subtextEl = overlay.querySelector('#ceremonySubtext');
    const btn = overlay.querySelector('#btnDismissCeremony');

    if (wrapper) {
      wrapper.innerHTML = `
        <div id="newWaistBelt" class="belt-on-waist animate-wrap" style="background: ${newBelt.color}; border: 2px solid #ffffff; filter: drop-shadow(0 0 20px ${newBelt.color});">
          <div class="belt-knot" style="background: ${newBelt.color};"></div>
          <div class="belt-tail-left" style="background: ${newBelt.color};"></div>
          <div class="belt-tail-right" style="background: ${newBelt.color};"></div>
        </div>
      `;
    }

    if (titleEl) {
      titleEl.innerHTML = `<span style="color: ${isPositive ? '#10b981' : '#f59e0b'}; text-shadow: 0 0 12px rgba(16,185,129,0.4);">${newBelt.badge} ${newBelt.name} (Tier ${newBelt.tier})</span>`;
    }

    if (subtextEl) {
      subtextEl.innerText = isPositive
        ? `The Sensei ties the ${newBelt.name} around your waist! Outstanding mastery!`
        : `Bound with the ${newBelt.name}. Practice your speed and form to reclaim your rank!`;
    }

    if (btn) {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      btn.onclick = () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          if (typeof onComplete === 'function') onComplete();
        }, 300);
      };
    }
  }, 1800);
}
