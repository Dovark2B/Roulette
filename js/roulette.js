(function () {
    const windowEl = document.getElementById('rouletteWindow');
    const emptyEl = document.getElementById('emptyState');
    const btnTest = document.getElementById('btnTest');
    const debugEl = document.getElementById('debug');

    let cfg = window.MKR.loadConfig();
    let items = cfg.images || [];
    let isSpinning = false;
    let spawnTimer = null;
    let lastVersion = cfg.version || 0;
    let lastSpinSignal = 0;

    function setDebug(msg) {
        if (debugEl) debugEl.textContent = msg || '';
    }

    function refreshFromStorage() {
        const next = window.MKR.loadConfig();
        if ((next.version || 0) !== lastVersion) {
            cfg = next;
            items = cfg.images || [];
            lastVersion = cfg.version || 0;
            if (!isSpinning) showIdle(); // Affiche juste le dernier gagnant ou rien
        }
    }

    function showIdle() {
        // Nettoyage complet
        windowEl.innerHTML = '';
        windowEl.appendChild(emptyEl);

        if (!items.length) {
            emptyEl.hidden = false;
            setDebug('No items');
            return;
        }
        emptyEl.hidden = true;

        // On affiche une image statique (la première ou au hasard) en attendant
        const staticImg = document.createElement('img');
        staticImg.src = items[0];
        staticImg.className = 'scroll-item';
        // On force le style pour qu'elle soit au centre fixe
        staticImg.style.top = '50%';
        staticImg.style.opacity = '1';
        staticImg.style.transform = 'translate(-50%, -50%) scale(1)';
        windowEl.appendChild(staticImg);

        setDebug(`Prêt (${items.length} images)`);
    }

    // Crée une image qui traverse l'écran puis s'autodétruit
    function spawnGhost() {
        if (!items.length) return;

        const img = document.createElement('img');
        const randomSrc = items[Math.floor(Math.random() * items.length)];

        img.src = randomSrc;
        img.className = 'scroll-item anim-scroll';

        windowEl.appendChild(img);

        // Nettoyage automatique après l'animation (0.6s defined in CSS)
        setTimeout(() => {
            if (img.parentNode === windowEl) {
                windowEl.removeChild(img);
            }
        }, 600);
    }

    function spin() {
        refreshFromStorage();
        if (isSpinning || !items.length) return;

        isSpinning = true;
        windowEl.innerHTML = ''; // On vide l'image statique

        const duration = Number(cfg.settings?.spinDuration || 3000);
        // Vitesse de spawn : plus c'est bas, plus il y a d'images (flux rapide)
        // On peut lier ça à la "vitesse" des settings si tu veux, ici je mets 120ms en dur pour l'effet slot
        const spawnRate = 120;

        setDebug('Spinning...');

        // 1. Démarrage du flux
        spawnTimer = setInterval(spawnGhost, spawnRate);

        // 2. Arrêt et affichage du résultat
        setTimeout(() => {
            finishSpin();
        }, duration);
    }

    function finishSpin() {
        clearInterval(spawnTimer);

        // --- NETTOYAGE FLUIDE ---
        const ghosts = windowEl.querySelectorAll('.scroll-item');

        ghosts.forEach(g => {
            // On force une transition d'opacité très rapide
            // Pas de classe CSS compliquée, on tape direct dans le style
            g.style.transition = 'opacity 0.2s ease-out';
            g.style.opacity = '0';

            // On supprime après
            setTimeout(() => g.remove(), 200);
        });



        // --- ARRIVÉE DU GAGNANT ---
        const winnerSrc = items[Math.floor(Math.random() * items.length)];
        const winnerImg = document.createElement('img');
        winnerImg.src = winnerSrc;
        winnerImg.style.zIndex = '10';
        winnerImg.className = 'scroll-item anim-winner';
        windowEl.appendChild(winnerImg);

        // Stabilisation... (code inchangé)
        setTimeout(() => {
            winnerImg.classList.remove('anim-winner');
            winnerImg.style.top = '50%';
            winnerImg.style.transform = 'translate(-50%, -50%) scale(1)';
            winnerImg.style.opacity = '1';
            winnerImg.classList.add('winner-pop');
            setTimeout(() => winnerImg.classList.remove('winner-pop'), 300);
        }, 800);

        isSpinning = false;
        setDebug('Winner displayed');
    }

    function checkSpinSignal() {
        const raw = localStorage.getItem('mk_roulette_spin_signal');
        if (!raw) return;

        try {
            const data = JSON.parse(raw);
            // Si le signal est nouveau (plus récent que le dernier traité)
            // et qu'il est récent (moins de 2 secondes, pour éviter de spin au démarrage sur un vieux signal)
            const now = Date.now();
            if (data.timestamp > lastSpinSignal && (now - data.timestamp) < 5000) {
                lastSpinSignal = data.timestamp;
                console.log("Signal reçu des settings !");
                spin();
            }
        } catch (e) { console.error(e); }
    }
    // Expose global
    window.MKRSpin = spin;

    // Listeners
    if (btnTest) btnTest.addEventListener('click', spin);

    // Polling config
    setInterval(() => {
        refreshFromStorage();
        checkSpinSignal();
    }, 500);

    // Init
    showIdle();
})();
