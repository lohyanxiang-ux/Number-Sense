import { BELT_TIERS } from './fluencyMastery.js';

/**
 * Displays a full-screen animated belt ceremony overlay when a student ranks up or steps down.
 * 
 * @param {number} oldLevel - Belt tier index before session.
 * @param {number} newLevel - Belt tier index after session.
 * @param {'PROMOTION'|'RECOVERY'|'STEP_DOWN'} transitionType - Type of belt transition.
 * @param {Function} onComplete - Callback executed when the student clicks continue.
 */
export function showBeltTransitionAnimation(oldLevel, newLevel, transitionType, onComplete) {
  const oldBelt = BELT_TIERS[oldLevel] || BELT_TIERS[1];
  const newBelt = BELT_TIERS[newLevel] || BELT_TIERS[1];

  const isPositive = transitionType === 'PROMOTION' || transitionType === 'RECOVERY';

  const overlay = document.createElement('div');
  overlay.id = 'beltCeremonyOverlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(10, 15, 29, 0.94);
    backdrop-filter: blur(8px);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.4s ease;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes martialArtistPulse {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-8px) scale(1.03); }
      }

      @keyframes beltFlashBurst {
        0% { transform: scale(0.2) rotate(-180deg); opacity: 0; filter: brightness(2); }
        60% { transform: scale(1.3) rotate(15deg); opacity: 1; filter: brightness(1.5); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(1); }
      }

      @keyframes auraGlow {
        0%, 100% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.3), inset 0 0 20px rgba(245, 158, 11, 0.2); }
        50% { box-shadow: 0 0 60px rgba(245, 158, 11, 0.8), inset 0 0 40px rgba(245, 158, 11, 0.5); }
      }

      @keyframes particleFloat {
        0% { transform: translateY(0) scale(0.8); opacity: 1; }
        100% { transform: translateY(-120px) scale(1.2); opacity: 0; }
      }

      .ceremony-card {
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        border: 3px solid ${isPositive ? '#f59e0b' : '#64748b'};
        border-radius: 24px;
        padding: 36px 28px;
        max-width: 480px;
        width: 90%;
        text-align: center;
        position: relative;
        overflow: hidden;
        animation: auraGlow 2.5s infinite ease-in-out;
      }

      .fighter-avatar-box {
        position: relative;
        width: 160px;
        height: 160px;
        margin: 0 auto 20px auto;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 50%;
        border: 2px dashed rgba(255, 255, 255, 0.2);
        animation: martialArtistPulse 3s infinite ease-in-out;
      }

      .belt-badge-display {
        font-size: 5rem;
        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .belt-award-animate {
        animation: beltFlashBurst 0.8s ease-out forwards;
      }
    </style>

    <div class="ceremony-card">
      <div style="font-size: 0.9rem; font-weight: 900; letter-spacing: 2px; color: ${isPositive ? '#fbbf24' : '#94a3b8'}; margin-bottom: 8px; text-transform: uppercase;">
        ${transitionType === 'PROMOTION' ? '🏆 DOJO PROMOTION CEREMONY' : (transitionType === 'RECOVERY' ? '⚡ FAST RECOVERY RESTORATION' : '🥋 RANK RE-ALIGNMENT')}
      </div>

      <h1 style="font-size: 2.2rem; margin: 0 0 16px 0; color: #ffffff; font-weight: 900;">
        ${isPositive ? 'NEW BELT UNLOCKED!' : 'BELT STEP-DOWN'}
      </h1>

      <!-- MARTIAL ARTIST AVATAR & DYNAMIC BELT ANIMATION -->
      <div class="fighter-avatar-box">
        <div style="position: absolute; font-size: 6rem; opacity: 0.85;">🥋</div>
        <div id="ceremonyBeltBadge" class="belt-badge-display">${oldBelt.badge}</div>
      </div>

      <div id="ceremonyTitle" style="font-size: 1.4rem; font-weight: 800; color: #e2e8f0; margin-bottom: 6px;">
        ${oldBelt.name} (Tier ${oldBelt.tier})
      </div>

      <p id="ceremonySubtext" style="font-size: 0.95rem; color: #94a3b8; margin: 0 0 24px 0; min-height: 48px;">
        ${isPositive ? 'The Sensei is presenting your new rank...' : 'Returning to previous rank for form refinement.'}
      </p>

      <button id="btnDismissCeremony" class="btn" style="
        background: ${isPositive ? '#f59e0b' : '#475569'};
        color: white;
        font-weight: 900;
        font-size: 1.1rem;
        padding: 14px 32px;
        border-radius: 12px;
        width: 100%;
        cursor: pointer;
        opacity: 0.5;
        pointer-events: none;
        transition: all 0.3s ease;
      ">
        OSS! CONTINUE ↵
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Fade in overlay
  setTimeout(() => { overlay.style.opacity = '1'; }, 20);

  // Step 1: Trigger Belt Swap Animation after 0.8s
  setTimeout(() => {
    const badgeEl = overlay.querySelector('#ceremonyBeltBadge');
    const titleEl = overlay.querySelector('#ceremonyTitle');
    const subtextEl = overlay.querySelector('#ceremonySubtext');
    const btn = overlay.querySelector('#btnDismissCeremony');

    if (badgeEl) {
      badgeEl.innerText = newBelt.badge;
      badgeEl.classList.add('belt-award-animate');
    }

    if (titleEl) {
      titleEl.innerHTML = `<span style="color: ${isPositive ? '#10b981' : '#f59e0b'}">${newBelt.name} (Tier ${newBelt.tier})</span>`;
    }

    if (subtextEl) {
      subtextEl.innerText = isPositive
        ? `Congratulations! You have demonstrated true mastery and earned your ${newBelt.name}!`
        : `Keep practicing! Refine your speed and accuracy at the ${newBelt.name} level.`;
    }

    // Enable Continue Button
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
  }, 1200);
}
