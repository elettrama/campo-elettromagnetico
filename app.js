/**
 * CAMPO ELETTROMAGNETICO & SPETTRO VISIBILE (FISICA PURA)
 * 1. Onde 3D Maxwell
 * 2. Spettro EM Universale
 * 3. Focus Ottico & Transizioni Atomiche
 * 4. Prisma di Newton - "The Dark Side of the Moon" (Pink Floyd Effect)
 * 5. Effetto Fotoelettrico & Quanti di Luce (Einstein 1905)
 */

// Costanti fisiche fondamentali (CODATA)
const C = 299792458;               // Velocità della luce nel vuoto (m/s)
const H_PLANCK = 6.62607015e-34;    // Costante di Planck (J·s)
const H_EV = 4.135667696e-15;      // Costante di Planck (eV·s)
const EV_JOULE = 1.602176634e-19;   // 1 eV in Joule
const ELECTRON_MASS = 9.1093837e-31;// Massa dell'elettrone (kg)

/* ==========================================================================
   1. SIMULATORE ONDA ELETTROMAGNETICA 3D (CANVAS 2D CON PROIEZIONE PROSPETTICA)
   ========================================================================== */
class WaveSimulator3D {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.wavelength = 60; // pixel di lunghezza d'onda visiva
    this.amplitude = 70;  // ampiezza picco
    this.speed = 1.0;     // velocità temporale
    this.time = 0;
    this.paused = false;

    this.showE = true;
    this.showB = true;
    this.showVectors = true;

    // Angoli camera 3D (orbita)
    this.yaw = -0.55;    // rotazione orizzontale
    this.pitch = 0.38;   // inclinazione verticale
    this.distance = 600;

    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.initCanvasSize();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initCanvasSize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 700;
    this.height = 440;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.initCanvasSize());

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.yaw += dx * 0.008;
      this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch - dy * 0.008));
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => { this.isDragging = false; });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.lastMouseX;
      const dy = e.touches[0].clientY - this.lastMouseY;
      this.yaw += dx * 0.008;
      this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch - dy * 0.008));
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', () => { this.isDragging = false; });

    // Controlli UI
    const waveSlider = document.getElementById('waveLambda');
    if (waveSlider) {
      waveSlider.addEventListener('input', (e) => {
        this.wavelength = parseFloat(e.target.value);
        const valSpan = document.getElementById('waveLambdaVal');
        if (valSpan) valSpan.textContent = `${this.wavelength} px`;
      });
    }

    const speedSlider = document.getElementById('waveSpeed');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.speed = parseFloat(e.target.value);
        const valSpan = document.getElementById('waveSpeedVal');
        if (valSpan) valSpan.textContent = `${this.speed.toFixed(1)}x`;
      });
    }

    const toggleE = document.getElementById('toggleE');
    if (toggleE) {
      toggleE.addEventListener('change', (e) => { this.showE = e.target.checked; });
    }

    const toggleB = document.getElementById('toggleB');
    if (toggleB) {
      toggleB.addEventListener('change', (e) => { this.showB = e.target.checked; });
    }

    const toggleVec = document.getElementById('toggleVectors');
    if (toggleVec) {
      toggleVec.addEventListener('change', (e) => { this.showVectors = e.target.checked; });
    }

    const btnPause = document.getElementById('btnPauseWave');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        this.paused = !this.paused;
        btnPause.textContent = this.paused ? '▶ Riprendi' : '⏸ Pausa';
        btnPause.classList.toggle('active', this.paused);
      });
    }

    const btnResetView = document.getElementById('btnResetWaveView');
    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        this.yaw = -0.55;
        this.pitch = 0.38;
      });
    }
  }

  project(x, y, z) {
    const cosY = Math.cos(this.yaw);
    const sinY = Math.sin(this.yaw);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    const cosP = Math.cos(this.pitch);
    const sinP = Math.sin(this.pitch);
    const y2 = y * cosP - z1 * sinP;
    const z2 = y * sinP + z1 * cosP;

    const cameraZ = this.distance;
    const fov = 420;
    const depth = cameraZ + z2;
    if (depth <= 20) return null;

    const scale = fov / depth;
    const u = this.width / 2 + x1 * scale;
    const v = this.height / 2 - y2 * scale;

    return { u, v, depth, scale };
  }

  drawArrow3D(x1, y1, z1, x2, y2, z2, color, lineWidth = 1.5, arrowSize = 4) {
    const p1 = this.project(x1, y1, z1);
    const p2 = this.project(x2, y2, z2);
    if (!p1 || !p2) return;

    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = lineWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(p1.u, p1.v);
    this.ctx.lineTo(p2.u, p2.v);
    this.ctx.stroke();

    const dx = p2.u - p1.u;
    const dy = p2.v - p1.v;
    const angle = Math.atan2(dy, dx);
    const size = arrowSize * p2.scale;

    this.ctx.beginPath();
    this.ctx.moveTo(p2.u, p2.v);
    this.ctx.lineTo(p2.u - size * Math.cos(angle - Math.PI / 6), p2.v - size * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(p2.u - size * Math.cos(angle + Math.PI / 6), p2.v - size * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath();
    this.ctx.fill();
  }

  animate() {
    if (!this.paused) {
      this.time += 0.045 * this.speed;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Griglia prospettica
    this.drawBackgroundGrid();

    const zMin = -260;
    const zMax = 280;
    const k = (2 * Math.PI) / this.wavelength;

    // Asse di propagazione Z
    this.drawArrow3D(0, 0, zMin, 0, 0, zMax + 30, '#ffcc00', 2, 7);

    const pK = this.project(0, 0, zMax + 38);
    if (pK) {
      this.ctx.font = 'bold 12px Inter, sans-serif';
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.fillText('v = c  (Direzione k)', pK.u + 10, pK.v);
    }

    this.drawAxesReference();

    const numSteps = 240;
    const stepSize = (zMax - zMin) / numSteps;

    // 1. Campo Elettrico E (rosso su Y-Z)
    if (this.showE) {
      this.ctx.save();
      this.ctx.shadowColor = 'rgba(255, 51, 102, 0.6)';
      this.ctx.shadowBlur = 10;
      this.ctx.strokeStyle = '#ff3366';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();

      let first = true;
      for (let i = 0; i <= numSteps; i++) {
        const z = zMin + i * stepSize;
        const phase = k * z - this.time;
        const eY = this.amplitude * Math.sin(phase);
        const p = this.project(0, eY, z);
        if (p) {
          if (first) {
            this.ctx.moveTo(p.u, p.v);
            first = false;
          } else {
            this.ctx.lineTo(p.u, p.v);
          }
        }
      }
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 2. Campo Magnetico B (blu su X-Z ortogonale)
    if (this.showB) {
      this.ctx.save();
      this.ctx.shadowColor = 'rgba(0, 212, 255, 0.6)';
      this.ctx.shadowBlur = 10;
      this.ctx.strokeStyle = '#00d4ff';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();

      let first = true;
      for (let i = 0; i <= numSteps; i++) {
        const z = zMin + i * stepSize;
        const phase = k * z - this.time;
        const bX = this.amplitude * Math.sin(phase);
        const p = this.project(bX, 0, z);
        if (p) {
          if (first) {
            this.ctx.moveTo(p.u, p.v);
            first = false;
          } else {
            this.ctx.lineTo(p.u, p.v);
          }
        }
      }
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. Frecce dei Vettori istantanei
    if (this.showVectors) {
      const vectorInterval = 14;
      for (let z = zMin; z <= zMax; z += vectorInterval) {
        const phase = k * z - this.time;
        const sinVal = Math.sin(phase);

        if (Math.abs(sinVal) > 0.05) {
          if (this.showE) {
            const eY = this.amplitude * sinVal;
            this.drawArrow3D(0, 0, z, 0, eY, z, 'rgba(255, 51, 102, 0.8)', 1.2, 3);
          }
          if (this.showB) {
            const bX = this.amplitude * sinVal;
            this.drawArrow3D(0, 0, z, bX, 0, z, 'rgba(0, 212, 255, 0.8)', 1.2, 3);
          }
        }
      }
    }

    // 4. Vettore di Poynting S = (1/mu0) * (E x B)
    const frontZ = zMax - 10;
    const pFront = this.project(0, 0, frontZ);
    if (pFront) {
      this.drawArrow3D(0, 0, frontZ, 0, 0, frontZ + 45, '#ffea00', 3, 6);
      const pSLabel = this.project(0, 15, frontZ + 50);
      if (pSLabel) {
        this.ctx.fillStyle = '#ffea00';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText('S = E × H (Flusso di Energia)', pSLabel.u - 40, pSLabel.v);
      }
    }

    requestAnimationFrame(this.animate);
  }

  drawBackgroundGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;

    const gridSize = 250;
    const step = 50;
    for (let x = -gridSize; x <= gridSize; x += step) {
      const p1 = this.project(x, -this.amplitude - 20, -gridSize);
      const p2 = this.project(x, -this.amplitude - 20, gridSize);
      if (p1 && p2) {
        this.ctx.beginPath();
        this.ctx.moveTo(p1.u, p1.v);
        this.ctx.lineTo(p2.u, p2.v);
        this.ctx.stroke();
      }
    }
  }

  drawAxesReference() {
    const originX = -190;
    const originY = -this.amplitude - 10;
    const originZ = -190;

    this.drawArrow3D(originX, originY, originZ, originX, originY + 45, originZ, '#ff3366', 1.8, 4);
    const pE = this.project(originX, originY + 52, originZ);
    if (pE) {
      this.ctx.fillStyle = '#ff3366';
      this.ctx.font = 'bold 10px Inter, sans-serif';
      this.ctx.fillText('E (Campo Elettrico)', pE.u + 6, pE.v);
    }

    this.drawArrow3D(originX, originY, originZ, originX + 45, originY, originZ, '#00d4ff', 1.8, 4);
    const pB = this.project(originX + 52, originY, originZ);
    if (pB) {
      this.ctx.fillStyle = '#00d4ff';
      this.ctx.font = 'bold 10px Inter, sans-serif';
      this.ctx.fillText('B (Campo Magnetico)', pB.u + 6, pB.v);
    }
  }
}

/* ==========================================================================
   2. ESPLORATORE DELLO SPETTRO ELETTROMAGNETICO COMPLETO
   ========================================================================== */
const SPECTRUM_DATA = {
  radio: {
    name: 'Onde Radio',
    lambda: '> 1 metro (fino a migliaia di km)',
    freq: '< 300 MHz',
    energy: '< 1.24 µeV',
    scale: 'Edifici, montagne, automobili',
    sources: 'Oscillazione di cariche libere in antenne, pulsar cosmiche, quasar',
    desc: 'Generate da correnti elettriche alternate ad alta frequenza. Trasportano segnali su distanze continentali e interplanetarie.',
    apps: 'Radiodiffusione FM/AM, TV digitale, comunicazioni satellitari, radar marittimi, radioastronomia.'
  },
  microwave: {
    name: 'Microonde',
    lambda: '1 mm – 1 metro',
    freq: '300 MHz – 300 GHz',
    energy: '1.24 µeV – 1.24 meV',
    scale: 'Monete, piccoli oggetti, insetti',
    sources: 'Magnetron, transistor GaAs, Radiazione Cosmica di Fondo a Microonde (CMBR a 2.725 K)',
    desc: 'Interagiscono fortemente con i modi di rotazione quantizzati delle molecole con momento di dipolo permanente (es. H₂O).',
    apps: 'Forni a microonde, ponti radio terrestri, reti Wi-Fi e 5G, radar meteorologici e militari.'
  },
  infrared: {
    name: 'Infrarossi (IR)',
    lambda: '750 nm – 1 mm',
    freq: '300 GHz – 400 THz',
    energy: '1.24 meV – 1.65 eV',
    scale: 'Punta di spillo, spessore capello (~80 µm)',
    sources: 'Emissione termica di corpi neri a temperature ordinarie (300 K – 3000 K)',
    desc: 'L\'energia dei fotoni infrarossi corrisponde agli stati discreti di vibrazione quantizzata dei legami molecolari (fononi).',
    apps: 'Spettroscopia vibrazionale FTIR, termografia a infrarossi, telecomandi ottici, telescopio spaziale James Webb.'
  },
  visible: {
    name: 'Luce Visibile (Focus Ottico)',
    lambda: '380 nm – 750 nm (0.38 – 0.75 µm)',
    freq: '400 THz – 790 THz',
    energy: '1.65 eV – 3.26 eV',
    scale: 'Reticoli di diffrazione, micro-strutture ottiche',
    sources: 'Fotosfera solare (~5778 K), lampade a scarica, laser He-Ne e semiconduttori, archi elettrici',
    desc: 'Intervallo energetico che corrisponde esattamente ai salti quantici degli elettroni di valenza negli atomi e nelle molecole (Serie di Balmer dell\'idrogeno).',
    apps: 'Laser a stato solido, spettroscopia atomica ad alta risoluzione, interferometria laser (LIGO), fibre ottiche monomodo.'
  },
  uv: {
    name: 'Ultravioletti (UV)',
    lambda: '10 nm – 380 nm',
    freq: '790 THz – 30 PHz',
    energy: '3.26 eV – 124 eV',
    scale: 'Proteine, filamenti molecolari, nanostrutture',
    sources: 'Stelle calde O/B, vapori di mercurio, sincrotroni, archi di saldatura',
    desc: 'Radiazione con energia pari o superiore all\'energia di prima ionizzazione di molti elementi chimici e metalli.',
    apps: 'Fotolitografia ultravioletta estrema (EUV) per microchip a 3 nm, sterilizzazione germicida UV-C, laser ad eccimeri.'
  },
  xray: {
    name: 'Raggi X',
    lambda: '0.01 nm – 10 nm',
    freq: '30 PHz – 30 EHz',
    energy: '124 eV – 124 keV',
    scale: 'Distanze interatomiche nei reticoli cristallini (~1 Å = 0.1 nm)',
    sources: 'Tubi radiogeni (radiazione di frenamento Bremsstrahlung), dischi di accrescimento di buchi neri',
    desc: 'I fotoni X estraggono elettroni dagli orbitali più interni degli atomi pesanti (K-shell).',
    apps: 'Cristallografia a diffrazione di raggi X (struttura atomica del DNA e delle proteine), TAC, radiografia diagnostica.'
  },
  gamma: {
    name: 'Raggi Gamma (γ)',
    lambda: '< 0.01 nm (< 10 picometri)',
    freq: '> 30 EHz (> 3 × 10¹⁹ Hz)',
    energy: '> 124 keV (fino a Tera-eV)',
    scale: 'Nuclei atomici, nucleoni, quark',
    sources: 'Decadimenti radioattivi nucleari, annichilazione elettrone-positrone (511 keV), supernove, lampi gamma (GRB)',
    desc: 'Originati da transizioni quantistiche interne ai livelli energetici del nucleo atomico. Altissimo potere penetrante.',
    apps: 'Radioterapia oncologica a fascio guidato (Gamma Knife), tracciamento PET in medicina nucleare, fisica delle particelle.'
  }
};

function initSpectrumExplorer() {
  const segments = document.querySelectorAll('.spectrum-segment');
  const nameEl = document.getElementById('bandName');
  const lambdaEl = document.getElementById('bandLambda');
  const freqEl = document.getElementById('bandFreq');
  const energyEl = document.getElementById('bandEnergy');
  const scaleEl = document.getElementById('bandScale');
  const sourcesEl = document.getElementById('bandSources');
  const descEl = document.getElementById('bandDesc');
  const appsEl = document.getElementById('bandApps');

  function updateBand(key) {
    const data = SPECTRUM_DATA[key];
    if (!data) return;

    segments.forEach(s => s.classList.toggle('active', s.dataset.band === key));

    if (nameEl) nameEl.textContent = data.name;
    if (lambdaEl) lambdaEl.textContent = data.lambda;
    if (freqEl) freqEl.textContent = data.freq;
    if (energyEl) energyEl.textContent = data.energy;
    if (scaleEl) scaleEl.textContent = data.scale;
    if (sourcesEl) sourcesEl.textContent = data.sources;
    if (descEl) descEl.textContent = data.desc;
    if (appsEl) appsEl.textContent = data.apps;
  }

  segments.forEach(segment => {
    segment.addEventListener('click', () => updateBand(segment.dataset.band));
  });

  updateBand('visible');
}

/* ==========================================================================
   3. CALCOLATORE FISICO LUNGHEZZA D'ONDA -> RGB & FISICA DEI FOTONI
   ========================================================================== */
function wavelengthToRGB(wavelength) {
  let r = 0, g = 0, b = 0;
  const wl = wavelength;

  if (wl >= 380 && wl < 440) {
    r = -(wl - 440) / (440 - 380);
    g = 0.0;
    b = 1.0;
  } else if (wl >= 440 && wl < 490) {
    r = 0.0;
    g = (wl - 440) / (490 - 440);
    b = 1.0;
  } else if (wl >= 490 && wl < 510) {
    r = 0.0;
    g = 1.0;
    b = -(wl - 510) / (510 - 490);
  } else if (wl >= 510 && wl < 580) {
    r = (wl - 510) / (580 - 510);
    g = 1.0;
    b = 0.0;
  } else if (wl >= 580 && wl < 645) {
    r = 1.0;
    g = -(wl - 645) / (645 - 580);
    b = 0.0;
  } else if (wl >= 645 && wl <= 750) {
    r = 1.0;
    g = 0.0;
    b = 0.0;
  }

  let factor = 0;
  if (wl >= 380 && wl < 420) {
    factor = 0.3 + 0.7 * (wl - 380) / (420 - 380);
  } else if (wl >= 420 && wl <= 700) {
    factor = 1.0;
  } else if (wl > 700 && wl <= 750) {
    factor = 0.3 + 0.7 * (750 - wl) / (750 - 700);
  }

  const gamma = 0.8;
  const R = Math.round(255 * Math.pow(Math.max(0, r * factor), gamma));
  const G = Math.round(255 * Math.pow(Math.max(0, g * factor), gamma));
  const B = Math.round(255 * Math.pow(Math.max(0, b * factor), gamma));

  return { r: R, g: G, b: B, hex: `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}` };
}

function getColorName(wl) {
  if (wl < 430) return 'Violetto profondo';
  if (wl < 460) return 'Violetto / Indaco';
  if (wl < 485) return 'Blu';
  if (wl < 500) return 'Ciano / Azzurro';
  if (wl < 560) return 'Verde';
  if (wl < 585) return 'Giallo';
  if (wl < 620) return 'Arancione';
  if (wl < 700) return 'Rosso';
  return 'Rosso profondo / Infrarosso limite';
}

function initVisibleExplorer() {
  const slider = document.getElementById('visibleSlider');
  const previewBox = document.getElementById('colorPreviewBox');
  const previewName = document.getElementById('colorPreviewName');
  const previewHex = document.getElementById('colorPreviewHex');

  const valWl = document.getElementById('valWl');
  const valFreq = document.getElementById('valFreq');
  const valEnergyEv = document.getElementById('valEnergyEv');
  const valEnergyJ = document.getElementById('valEnergyJ');
  const valPeriod = document.getElementById('valPeriod');
  const valK = document.getElementById('valK');

  function update(wl) {
    const rgb = wavelengthToRGB(wl);
    const name = getColorName(wl);

    const lambdaMeters = wl * 1e-9;
    const freqHz = C / lambdaMeters;
    const freqTHz = freqHz / 1e12;
    const energyJ = H_PLANCK * freqHz;
    const energyEv = energyJ / EV_JOULE;
    const periodFs = (1 / freqHz) * 1e15;
    const waveNumberK = (2 * Math.PI) / lambdaMeters;

    if (previewBox) {
      previewBox.style.backgroundColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      previewBox.style.boxShadow = `0 10px 40px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)`;
    }
    if (previewName) previewName.textContent = name;
    if (previewHex) previewHex.textContent = `HEX: ${rgb.hex.toUpperCase()} | RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`;

    if (valWl) valWl.textContent = `${wl} nm`;
    if (valFreq) valFreq.textContent = `${freqTHz.toFixed(2)} THz`;
    if (valEnergyEv) valEnergyEv.textContent = `${energyEv.toFixed(3)} eV`;
    if (valEnergyJ) valEnergyJ.textContent = `${(energyJ * 1e19).toFixed(3)} × 10⁻¹⁹ J`;
    if (valPeriod) valPeriod.textContent = `${periodFs.toFixed(2)} fs`;
    if (valK) valK.textContent = `${(waveNumberK / 1e6).toFixed(2)} × 10⁶ rad/m`;

    // Sincronizza il simulatore dell'effetto fotoelettrico
    if (window.photoelectricSim) {
      window.photoelectricSim.setWavelength(wl);
    }
  }

  if (slider) {
    slider.addEventListener('input', (e) => {
      update(parseInt(e.target.value, 10));
    });
    update(532);
  }
}

/* ==========================================================================
   4. SIMULATORE PRISMA DI NEWTON - "THE DARK SIDE OF THE MOON" (PINK FLOYD)
   ========================================================================== */
class DarkSidePrismSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Parametri ottici & artistici Dark Side of the Moon
    this.incidenceAngle = 36;   // inclinazione fascio bianco in gradi
    this.beamThickness = 5;     // spessore del raggio bianco
    this.dispersionSpread = 1.0;// moltiplicatore ampiezza ventaglio
    this.glowIntensity = 1.0;   // intensità bagliore
    this.mode = 'pinkfloyd';    // 'pinkfloyd' (album ribbon) o 'physics' (raggi continui Snell)

    this.initCanvasSize();
    this.bindEvents();
    this.render();
  }

  initCanvasSize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 720;
    this.height = 420;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.render();
    });

    const angleSlider = document.getElementById('prismAngle');
    if (angleSlider) {
      angleSlider.addEventListener('input', (e) => {
        this.incidenceAngle = parseFloat(e.target.value);
        const valSpan = document.getElementById('prismAngleVal');
        if (valSpan) valSpan.textContent = `${this.incidenceAngle}°`;
        this.render();
      });
    }

    const spreadSlider = document.getElementById('prismSpread');
    if (spreadSlider) {
      spreadSlider.addEventListener('input', (e) => {
        this.dispersionSpread = parseFloat(e.target.value);
        const valSpan = document.getElementById('prismSpreadVal');
        if (valSpan) valSpan.textContent = `${this.dispersionSpread.toFixed(1)}x`;
        this.render();
      });
    }

    const glowSlider = document.getElementById('prismGlow');
    if (glowSlider) {
      glowSlider.addEventListener('input', (e) => {
        this.glowIntensity = parseFloat(e.target.value);
        const valSpan = document.getElementById('prismGlowVal');
        if (valSpan) valSpan.textContent = `${Math.round(this.glowIntensity * 100)}%`;
        this.render();
      });
    }

    const modeSelect = document.getElementById('prismMode');
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        this.mode = e.target.value;
        this.render();
      });
    }

    const btnPreset = document.getElementById('btnPresetDarkSide');
    if (btnPreset) {
      btnPreset.addEventListener('click', () => {
        this.incidenceAngle = 36;
        this.beamThickness = 5;
        this.dispersionSpread = 1.0;
        this.glowIntensity = 1.0;
        this.mode = 'pinkfloyd';

        if (angleSlider) angleSlider.value = 36;
        if (spreadSlider) spreadSlider.value = 1.0;
        if (glowSlider) glowSlider.value = 1.0;
        if (modeSelect) modeSelect.value = 'pinkfloyd';

        const angleVal = document.getElementById('prismAngleVal');
        const spreadVal = document.getElementById('prismSpreadVal');
        const glowVal = document.getElementById('prismGlowVal');
        if (angleVal) angleVal.textContent = '36°';
        if (spreadVal) spreadVal.textContent = '1.0x';
        if (glowVal) glowVal.textContent = '100%';

        this.render();
      });
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Sfondo profondo nero assoluto (Dark Side of the Moon)
    this.ctx.fillStyle = '#020205';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Geometria del prisma equilatero posizionato a centro-sinistra
    const cx = this.width * 0.43;
    const cy = this.height * 0.52;
    const side = Math.min(this.width * 0.38, 220);
    const h = side * (Math.sqrt(3) / 2);

    const pTop = { x: cx, y: cy - (2 / 3) * h };
    const pLeft = { x: cx - side / 2, y: cy + (1 / 3) * h };
    const pRight = { x: cx + side / 2, y: cy + (1 / 3) * h };

    // Punto di incidenza sulla faccia sinistra (circa al 46% dall'alto)
    const hitPoint = {
      x: pLeft.x + (pTop.x - pLeft.x) * 0.52,
      y: pLeft.y + (pTop.y - pLeft.y) * 0.52
    };

    // Direzione del fascio bianco: sale da sinistra in basso verso destra in alto
    const incRad = (this.incidenceAngle * Math.PI) / 180;
    const beamLen = this.width * 0.55;
    const sourceX = hitPoint.x - Math.cos(incRad) * beamLen;
    const sourceY = hitPoint.y + Math.sin(incRad) * beamLen;

    // 1. RAGGIO BIANCO INCIDENTE CON INTENSO BAGLIORE
    this.ctx.save();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = this.beamThickness;
    this.ctx.shadowColor = `rgba(255, 255, 255, ${0.9 * this.glowIntensity})`;
    this.ctx.shadowBlur = 18 * this.glowIntensity;
    this.ctx.beginPath();
    this.ctx.moveTo(sourceX, sourceY);
    this.ctx.lineTo(hitPoint.x, hitPoint.y);
    this.ctx.stroke();

    // Nucleo brillante interno
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = Math.max(1.5, this.beamThickness * 0.45);
    this.ctx.stroke();
    this.ctx.restore();

    // 2. CORPO DEL PRISMA DI VETRO TRASPARENTE
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(pTop.x, pTop.y);
    this.ctx.lineTo(pRight.x, pRight.y);
    this.ctx.lineTo(pLeft.x, pLeft.y);
    this.ctx.closePath();

    // Gradiente traslucido interno
    const prismFill = this.ctx.createLinearGradient(pLeft.x, pLeft.y, pRight.x, pRight.y);
    prismFill.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
    prismFill.addColorStop(0.5, 'rgba(120, 180, 255, 0.08)');
    prismFill.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    this.ctx.fillStyle = prismFill;
    this.ctx.fill();

    // Bordi del prisma netti e luminescenti (stile Hipgnosis)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    this.ctx.shadowColor = `rgba(180, 220, 255, ${0.6 * this.glowIntensity})`;
    this.ctx.shadowBlur = 12 * this.glowIntensity;
    this.ctx.lineWidth = 2.2;
    this.ctx.stroke();
    this.ctx.restore();

    // I 6 Colori Iconici di "The Dark Side of the Moon"
    // Rosso (in alto), Arancione, Giallo, Verde, Blu, Violetto (in basso)
    const albumColors = [
      { name: 'Rosso', hex: '#ff002f', n: 1.514 },
      { name: 'Arancione', hex: '#ff7700', n: 1.520 },
      { name: 'Giallo', hex: '#ffea00', n: 1.527 },
      { name: 'Verde', hex: '#00e640', n: 1.536 },
      { name: 'Blu', hex: '#00b0ff', n: 1.548 },
      { name: 'Violetto', hex: '#8400ff', n: 1.565 }
    ];

    // Faccia destra del prisma: retta pTop -> pRight
    const rightFaceNorm = {
      x: (pRight.y - pTop.y) / h,
      y: -(pRight.x - pTop.x) / h
    };

    if (this.mode === 'pinkfloyd') {
      // RENDERING ICONICO A BANDE CONTINUE SOLIDE "THE DARK SIDE OF THE MOON"
      const bandHeight = (18 / albumColors.length) * (this.beamThickness / 4);
      const exitBaseY = pTop.y + (pRight.y - pTop.y) * 0.44;
      const exitBaseX = pTop.x + (pRight.x - pTop.x) * 0.44;

      // Disegna i fasci all'interno del prisma che si aprono dal punto di impatto
      albumColors.forEach((color, i) => {
        const spreadFactor = (i - 2.5) * 2.8 * this.dispersionSpread;
        const exitPoint = {
          x: exitBaseX + spreadFactor * 0.6,
          y: exitBaseY + spreadFactor * 2.0
        };

        // Percorso interno al prisma
        this.ctx.save();
        this.ctx.strokeStyle = color.hex;
        this.ctx.lineWidth = bandHeight * 0.8;
        this.ctx.shadowColor = color.hex;
        this.ctx.shadowBlur = 6 * this.glowIntensity;
        this.ctx.beginPath();
        this.ctx.moveTo(hitPoint.x, hitPoint.y);
        this.ctx.lineTo(exitPoint.x, exitPoint.y);
        this.ctx.stroke();
        this.ctx.restore();

        // Fascio che fuoriesce dalla faccia destra: si apre ad angolo verso destra
        const exitAngle = 0.08 + (i - 2.5) * 0.048 * this.dispersionSpread;
        const endDist = this.width - exitPoint.x + 80;
        const endX = exitPoint.x + endDist;
        const endY = exitPoint.y + Math.tan(exitAngle) * endDist + (i - 2.5) * 14 * this.dispersionSpread;

        this.ctx.save();
        this.ctx.strokeStyle = color.hex;
        this.ctx.lineWidth = bandHeight * 1.6;
        this.ctx.shadowColor = color.hex;
        this.ctx.shadowBlur = 14 * this.glowIntensity;
        this.ctx.lineCap = 'butt';
        this.ctx.beginPath();
        this.ctx.moveTo(exitPoint.x, exitPoint.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.restore();
      });

      // Riflessione interna parziale (il tocco di classe dell'artwork originale all'interno dell'album)
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(hitPoint.x, hitPoint.y);
      this.ctx.lineTo(cx - 15, cy + (1 / 3) * h - 8);
      this.ctx.stroke();
      this.ctx.restore();

    } else {
      // MODALITÀ FISICA RIGOROSA (RAGGI DI SNELL & DISPERSIONE DI CAUCHY)
      albumColors.forEach((color, i) => {
        const nAir = 1.00029;
        const nGlass = color.n * this.dispersionSpread;

        // Snell alla prima superficie
        const normAngle1 = Math.atan2(pTop.y - pLeft.y, pTop.x - pLeft.x) + Math.PI / 2;
        const rayInAngle = Math.PI - incRad;
        const incNormAngle = rayInAngle - normAngle1;

        const sinRef1 = (nAir * Math.sin(incNormAngle)) / nGlass;
        const refAngle1 = Math.asin(Math.max(-1, Math.min(1, sinRef1)));
        const rayInsideAngle = normAngle1 + refAngle1;

        // Calcola intersezione con la faccia destra
        const hit2 = this.intersectRaySegment(
          hitPoint.x, hitPoint.y,
          Math.cos(rayInsideAngle), Math.sin(rayInsideAngle),
          pTop.x, pTop.y, pRight.x, pRight.y
        );

        if (hit2) {
          // Tratto interno
          this.ctx.save();
          this.ctx.strokeStyle = color.hex;
          this.ctx.lineWidth = 2.2;
          this.ctx.beginPath();
          this.ctx.moveTo(hitPoint.x, hitPoint.y);
          this.ctx.lineTo(hit2.x, hit2.y);
          this.ctx.stroke();

          // Snell seconda superficie (vetro -> aria)
          const normAngle2 = Math.atan2(pRight.y - pTop.y, pRight.x - pTop.x) - Math.PI / 2;
          const incNorm2 = rayInsideAngle - normAngle2;
          const sinRef2 = (nGlass * Math.sin(incNorm2)) / nAir;

          if (Math.abs(sinRef2) <= 1) {
            const refAngle2 = Math.asin(sinRef2);
            const rayOutAngle = normAngle2 + refAngle2;

            const outLen = this.width - hit2.x + 50;
            const outX = hit2.x + Math.cos(rayOutAngle) * outLen;
            const outY = hit2.y + Math.sin(rayOutAngle) * outLen;

            this.ctx.strokeStyle = color.hex;
            this.ctx.shadowColor = color.hex;
            this.ctx.shadowBlur = 12 * this.glowIntensity;
            this.ctx.lineWidth = 2.8;
            this.ctx.beginPath();
            this.ctx.moveTo(hit2.x, hit2.y);
            this.ctx.lineTo(outX, outY);
            this.ctx.stroke();
          }
          this.ctx.restore();
        }
      });
    }

    // Firma estetica Dark Side
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.font = '600 10px monospace';
    this.ctx.fillText('DISPERSIONE SPETTRALE — NEWTON (1666) / PINK FLOYD (1973)', 20, this.height - 20);
  }

  intersectRaySegment(rx, ry, rdx, rdy, sx1, sy1, sx2, sy2) {
    const sdx = sx2 - sx1;
    const sdy = sy2 - sy1;
    const denom = rdx * sdy - rdy * sdx;
    if (Math.abs(denom) < 1e-6) return null;

    const t = ((sx1 - rx) * sdy - (sy1 - ry) * sdx) / denom;
    const u = ((sx1 - rx) * rdy - (sy1 - ry) * rdx) / denom;

    if (t > 0.001 && u >= 0 && u <= 1) {
      return { x: rx + t * rdx, y: ry + t * rdy };
    }
    return null;
  }
}

/* ==========================================================================
   5. SIMULATORE EFFETTO FOTOELETTRICO (EINSTEIN 1905) - FISICA QUANTISTICA
   ========================================================================== */
const PHOTO_METALS = {
  cesium: { name: 'Cesio (Cs)', workFunction: 2.14, desc: 'Metallo alcalino con bassissimo lavoro d\'estrazione: emette elettroni già con luce verde, blu e violetta!' },
  potassium: { name: 'Potassio (K)', workFunction: 2.30, desc: 'Emette fotoelettroni con lunghezze d\'onda inferiori a 539 nm (verde-ciano e superiori).' },
  sodium: { name: 'Sodio (Na)', workFunction: 2.36, desc: 'Emette elettroni con luce azzurra/blu (λ < 525 nm). Non emette con luce gialla o rossa.' },
  calcium: { name: 'Calcio (Ca)', workFunction: 2.87, desc: 'Richiede luce violetta ad alta frequenza (λ < 432 nm) o raggi ultravioletti.' },
  zinc: { name: 'Zinco (Zn)', workFunction: 4.30, desc: 'Non emette nel visibile! Richiede necessariamente radiazione ultravioletta UV (λ < 288 nm).' }
};

class PhotoelectricSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.currentWl = 532; // nm
    this.metalKey = 'cesium';
    this.retardingVoltage = 0.0; // Volt
    this.intensity = 1.0; // intensità fascio

    this.electrons = [];
    this.maxElectrons = 30;

    this.initCanvasSize();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initCanvasSize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 640;
    this.height = 360;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.initCanvasSize());

    const metalSelect = document.getElementById('photoMetalSelect');
    if (metalSelect) {
      metalSelect.addEventListener('change', (e) => {
        this.metalKey = e.target.value;
        this.updatePhysics();
      });
    }

    const voltSlider = document.getElementById('retardingVolt');
    if (voltSlider) {
      voltSlider.addEventListener('input', (e) => {
        this.retardingVoltage = parseFloat(e.target.value);
        const valSpan = document.getElementById('retardingVoltVal');
        if (valSpan) valSpan.textContent = `${this.retardingVoltage.toFixed(2)} V`;
        this.updatePhysics();
      });
    }

    const intensitySlider = document.getElementById('photoIntensity');
    if (intensitySlider) {
      intensitySlider.addEventListener('input', (e) => {
        this.intensity = parseFloat(e.target.value);
        const valSpan = document.getElementById('photoIntensityVal');
        if (valSpan) valSpan.textContent = `${Math.round(this.intensity * 100)}%`;
      });
    }

    this.updatePhysics();
  }

  setWavelength(wl) {
    this.currentWl = wl;
    this.updatePhysics();
  }

  updatePhysics() {
    const metal = PHOTO_METALS[this.metalKey];
    const photonEnergyEv = (H_EV * C) / (this.currentWl * 1e-9);
    const workFunctionEv = metal.workFunction;

    // Frequenza di soglia nu_0 e lunghezza d'onda di soglia lambda_0
    const thresholdWlNm = ((H_EV * C) / workFunctionEv) * 1e9;
    const canEmit = photonEnergyEv > workFunctionEv;
    const maxKineticEnergyEv = canEmit ? photonEnergyEv - workFunctionEv : 0;
    const stoppingVoltage = maxKineticEnergyEv; // V_0 = K_max / e

    // Velocità massima elettrone v = sqrt(2 * K / m)
    const maxK_Joule = maxKineticEnergyEv * EV_JOULE;
    const maxVelocityM_S = Math.sqrt((2 * maxK_Joule) / ELECTRON_MASS);

    // Elettroni fermati dal potenziale ritardante?
    const reachesAnode = maxKineticEnergyEv > this.retardingVoltage;

    // Aggiornamento DOM
    const elPhotonEnergy = document.getElementById('pePhotonEnergy');
    const elWorkFunc = document.getElementById('peWorkFunction');
    const elThresholdWl = document.getElementById('peThresholdWl');
    const elKineticEnergy = document.getElementById('peKineticEnergy');
    const elStoppingVolt = document.getElementById('peStoppingVolt');
    const elVelocity = document.getElementById('peMaxVelocity');
    const elStatus = document.getElementById('peEmissionStatus');
    const elDesc = document.getElementById('peMetalDesc');

    if (elPhotonEnergy) elPhotonEnergy.textContent = `${photonEnergyEv.toFixed(3)} eV`;
    if (elWorkFunc) elWorkFunc.textContent = `${workFunctionEv.toFixed(2)} eV`;
    if (elThresholdWl) elThresholdWl.textContent = `${thresholdWlNm.toFixed(1)} nm`;
    if (elKineticEnergy) elKineticEnergy.textContent = canEmit ? `${maxKineticEnergyEv.toFixed(3)} eV` : '0 eV (E < Φ)';
    if (elStoppingVolt) elStoppingVolt.textContent = `${stoppingVoltage.toFixed(3)} V`;
    if (elVelocity) elVelocity.textContent = canEmit ? `${(maxVelocityM_S / 1000).toFixed(0)} km/s` : '0 km/s';
    if (elDesc) elDesc.textContent = metal.desc;

    if (elStatus) {
      if (canEmit && reachesAnode) {
        elStatus.className = 'emission-status-pill emission-yes';
        elStatus.textContent = '⚡ FOTOEMISSIONE ATTIVA (Corrente rilevata)';
      } else if (canEmit && !reachesAnode) {
        elStatus.className = 'emission-status-pill emission-no';
        elStatus.textContent = '⛔ ELETTRONI FERMATI DAL POTENZIALE RITARDANTE (V > V_arresto)';
      } else {
        elStatus.className = 'emission-status-pill emission-no';
        elStatus.textContent = '❌ NESSUNA EMISSIONE (Energia del fotone sotto soglia)';
      }
    }

    this.canEmit = canEmit;
    this.maxVelocity = maxVelocityM_S;
    this.reachesAnode = reachesAnode;
    this.kineticEv = maxKineticEnergyEv;
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Sfondo camera a vuoto con tubo di quarzo
    const padX = 60;
    const tubeY = 70;
    const tubeH = this.height - 140;
    const tubeW = this.width - padX * 2;

    // Disegna contorno cilindrico della camera a vuoto in vetro/quarzo
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(120, 160, 255, 0.25)';
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = 'rgba(8, 12, 22, 0.8)';
    this.ctx.beginPath();
    this.ctx.roundRect(padX, tubeY, tubeW, tubeH, 20);
    this.ctx.fill();
    this.ctx.stroke();

    // Catodo metallico a sinistra
    const cathodeX = padX + 45;
    const cathodeY1 = tubeY + 30;
    const cathodeY2 = tubeY + tubeH - 30;
    this.ctx.strokeStyle = '#94a3b8';
    this.ctx.lineWidth = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(cathodeX, cathodeY1);
    this.ctx.lineTo(cathodeX, cathodeY2);
    this.ctx.stroke();

    // Etichetta Catodo (-)
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.font = 'bold 11px Inter, sans-serif';
    this.ctx.fillText(`Catodo [${PHOTO_METALS[this.metalKey].name}]`, cathodeX - 25, cathodeY1 - 10);

    // Anodo a destra
    const anodeX = padX + tubeW - 45;
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.moveTo(anodeX, cathodeY1);
    this.ctx.lineTo(anodeX, cathodeY2);
    this.ctx.stroke();

    // Etichetta Anodo (+)
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.fillText('Anodo (+)', anodeX - 20, cathodeY1 - 10);

    // Fascio di luce incidente che colpisce il catodo ad angolo
    const rgb = wavelengthToRGB(this.currentWl);
    const lightColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

    this.ctx.strokeStyle = lightColor;
    this.ctx.shadowColor = lightColor;
    this.ctx.shadowBlur = 15;
    this.ctx.lineWidth = 12 * this.intensity;
    this.ctx.beginPath();
    this.ctx.moveTo(padX - 20, tubeY - 30);
    this.ctx.lineTo(cathodeX, tubeY + tubeH * 0.5);
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '10px monospace';
    this.ctx.fillText(`Fascio Fotoni λ = ${this.currentWl} nm`, padX - 35, tubeY - 38);
    this.ctx.restore();

    // Generazione particelle elettroni se c'è fotoemissione
    if (this.canEmit && Math.random() < 0.35 * this.intensity) {
      this.electrons.push({
        x: cathodeX + 4,
        y: tubeY + tubeH * 0.3 + Math.random() * tubeH * 0.4,
        vx: (1.5 + (this.kineticEv / 2) * 2.5) * (0.8 + Math.random() * 0.4),
        vy: (Math.random() - 0.5) * 1.2,
        life: 0,
        maxLife: 120
      });
    }

    // Aggiornamento e rendering elettroni fotoemessi
    for (let i = this.electrons.length - 1; i >= 0; i--) {
      const e = this.electrons[i];
      // Decelerazione dovuta al potenziale ritardante V
      const decel = (this.retardingVoltage / (this.kineticEv + 0.1)) * 0.08;
      e.vx -= decel;
      e.x += e.vx;
      e.y += e.vy;
      e.life++;

      // Disegna particella elettrone (blu ciano fluorescente)
      this.ctx.save();
      this.ctx.fillStyle = '#00f7ff';
      this.ctx.shadowColor = '#00f7ff';
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      // Rimuovi se assorbito dall'anodo o se rimbalzato indietro o morto
      if (e.x >= anodeX || e.x <= cathodeX || e.life > e.maxLife || e.vx < -2) {
        this.electrons.splice(i, 1);
      }
    }

    // Indicatore microamperometro corrente
    const meterX = this.width / 2;
    const meterY = tubeY + tubeH + 35;
    const currentVal = (this.canEmit && this.reachesAnode) ? (this.intensity * (this.kineticEv - this.retardingVoltage + 0.1) * 14).toFixed(1) : '0.0';

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '11px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`FOTOCORRENTE RILEVATA: ${currentVal} µA`, meterX, meterY);
    this.ctx.textAlign = 'start';

    requestAnimationFrame(this.animate);
  }
}

/* ==========================================================================
   INIZIALIZZAZIONE ALL'AVVIO
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  new WaveSimulator3D('waveCanvas');
  initSpectrumExplorer();
  initVisibleExplorer();
  new DarkSidePrismSimulator('prismCanvas');
  window.photoelectricSim = new PhotoelectricSimulator('photoelectricCanvas');

  // Compilazione KaTeX se non ancora attivata da onload
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false
    });
  }
});
