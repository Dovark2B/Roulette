(function () {
    const fileInput = document.getElementById('fileInput');
    const btnSave = document.getElementById('btnSave');
    const btnClear = document.getElementById('btnClear');
    const grid = document.getElementById('grid');
    const status = document.getElementById('status');
    const dropZone = document.getElementById('dropZone');
    
    // Nouveaux éléments
    const btnRemoteSpin = document.getElementById('btnRemoteSpin');
    const spinDurationEl = document.getElementById('spinDuration');
    const minIntervalEl = document.getElementById('minInterval');
    const maxIntervalEl = document.getElementById('maxInterval');

    let cfg = window.MKR.loadConfig();

    function setStatus(msg, kind) {
        status.textContent = msg || '';
        status.classList.remove('ok', 'err');
        if (kind) status.classList.add(kind);
    }

    function renderGrid() {
        grid.innerHTML = '';
        const imgs = cfg.images || [];

        if (imgs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'hint';
            empty.textContent = 'Aucune image pour le moment.';
            grid.appendChild(empty);
            return;
        }

        imgs.forEach((dataUrl, idx) => {
            const card = document.createElement('div');
            card.className = 'card';

            const img = document.createElement('img');
            img.className = 'card__img';
            img.src = dataUrl;

            const bar = document.createElement('div');
            bar.className = 'card__bar';

            const meta = document.createElement('div');
            meta.className = 'card__meta';
            meta.textContent = `#${idx + 1}`;

            const del = document.createElement('button');
            del.className = 'card__del';
            del.type = 'button';
            del.textContent = 'Suppr';
            del.addEventListener('click', () => {
                cfg.images.splice(idx, 1);
                renderGrid();
                setStatus('Image supprimée (pense à sauvegarder).');
            });

            bar.appendChild(meta);
            bar.appendChild(del);

            card.appendChild(img);
            card.appendChild(bar);

            grid.appendChild(card);
        });
    }

    function bindSettingsInputs() {
        if(spinDurationEl) spinDurationEl.value = String(cfg.settings.spinDuration ?? 3000);
        if(minIntervalEl) minIntervalEl.value = String(cfg.settings.minInterval ?? 60);
        if(maxIntervalEl) maxIntervalEl.value = String(cfg.settings.maxInterval ?? 260);
    }

    // --- C'EST ICI QUE TU AVAIS L'ERREUR ---
    function readSettingsFromInputs() {
        // On vérifie que les éléments existent pour éviter une erreur si le HTML n'est pas complet
        const spinDuration = spinDurationEl ? Math.max(500, Number(spinDurationEl.value || 3000)) : 3000;
        const minInterval = minIntervalEl ? Math.max(10, Number(minIntervalEl.value || 60)) : 60;
        const maxInterval = maxIntervalEl ? Math.max(minInterval + 10, Number(maxIntervalEl.value || 260)) : 260;

        cfg.settings = { 
            spinDuration, 
            minInterval, 
            maxInterval 
        };
    }

    async function filesToDataUrls(fileList) {
        const files = Array.from(fileList || []);
        const images = files.filter(f => (f.type || '').startsWith('image/'));
        const results = [];

        for (const f of images) {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('FileReader error'));
                reader.readAsDataURL(f);
            });
            results.push(String(dataUrl));
        }
        return results;
    }

    async function handleAddFiles(fileList) {
        setStatus('');
        try {
            const added = await filesToDataUrls(fileList);
            if (added.length === 0) {
                setStatus('Aucune image valide détectée.', 'err');
                return;
            }
            cfg.images = [...(cfg.images || []), ...added];
            renderGrid();

            const bytes = window.MKR.estimateLocalStorageBytes();
            setStatus(`Ajouté: ${added.length} image(s). Taille approx localStorage: ${(bytes / 1024 / 1024).toFixed(2)} MB.`);
        } catch (e) {
            setStatus(`Erreur ajout fichiers: ${e?.message || e}`, 'err');
        }
    }

    // Input file
    if(fileInput) {
        fileInput.addEventListener('change', async (e) => {
            await handleAddFiles(e.target.files);
            fileInput.value = '';
        });
    }

    // Drag & drop
    if(dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            const files = e.dataTransfer?.files;
            if (files && files.length) await handleAddFiles(files);
        });
    }

    // Clear
    if(btnClear) {
        btnClear.addEventListener('click', () => {
            cfg.images = [];
            renderGrid();
            setStatus('Tout supprimé (pense à sauvegarder).');
        });
    }

    // Save
    if(btnSave) {
        btnSave.addEventListener('click', () => {
            readSettingsFromInputs();
            cfg = window.MKR.saveConfig(cfg);
            setStatus('✅ Sauvegardé.', 'ok');
        });
    }

    // Remote Spin (Test)
    if (btnRemoteSpin) {
        btnRemoteSpin.addEventListener('click', () => {
            readSettingsFromInputs();
            cfg = window.MKR.saveConfig(cfg);
            window.MKR.triggerSpinSignal();
            setStatus('Signal envoyé à la roulette !', 'ok');
        });
    }

    // Init
    bindSettingsInputs();
    renderGrid();
})();
