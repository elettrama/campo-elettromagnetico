/**
 * CAMPO ELETTROMAGNETICO & SPETTRO VISIBILE (FISICA RIGOROSA)
 * 1. Onde 3D Maxwell
 * 2. Spettro EM Universale
 * 3. Focus Ottico & Transizioni Atomiche
 * 4. Prisma di Newton: Ray Tracing Rigoroso con Legge di Snell & Riflessione Totale Interna (TIR)
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
   4. SIMULATORE PRISMA DI NEWTON (RAY TRACING RIGOROSO CON SNELL & TIR)
   ========================================================================== */
class NewtonPrismSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Parametri ottici fisici
    this.theta1Deg = 48;       // Angolo di incidenza θ1 rispetto alla normale della faccia 1 (gradi)
    this.nBase = 1.52;         // Indice di rifrazione base (ad es. Vetro Crown)
    this.cauchyB = 0.012;      // Coefficiente di dispersione di Cauchy B (in µm²)
    this.beamThickness = 5;

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
        this.theta1Deg = parseFloat(e.target.value);
        const valSpan = document.getElementById('prismAngleVal');
        if (valSpan) valSpan.textContent = `${this.theta1Deg.toFixed(1)}°`;
        this.render();
      });
    }

    const nSlider = document.getElementById('prismIndex');
    if (nSlider) {
      nSlider.addEventListener('input', (e) => {
        this.nBase = parseFloat(e.target.value);
        const valSpan = document.getElementById('prismIndexVal');
        if (valSpan) valSpan.textContent = this.nBase.toFixed(2);
        this.render();
      });
    }

    const bSlider = document.getElementById('prismCauchyB');
    if (bSlider) {
      bSlider.addEventListener('input', (e) => {
        this.cauchyB = parseFloat(e.target.value);
        const valSpan = document.getElementById('prismCauchyBVal');
        if (valSpan) valSpan.textContent = this.cauchyB.toFixed(3);
        this.render();
      });
    }

    // Preset fisici
    const setPreset = (angle, n, b) => {
      this.theta1Deg = angle;
      this.nBase = n;
      this.cauchyB = b;

      if (angleSlider) angleSlider.value = angle;
      if (nSlider) nSlider.value = n;
      if (bSlider) bSlider.value = b;

      const angleVal = document.getElementById('prismAngleVal');
      const nVal = document.getElementById('prismIndexVal');
      const bVal = document.getElementById('prismCauchyBVal');
      if (angleVal) angleVal.textContent = `${angle.toFixed(1)}°`;
      if (nVal) nVal.textContent = n.toFixed(2);
      if (bVal) bVal.textContent = b.toFixed(3);

      this.render();
    };

    const btnCrown = document.getElementById('btnPresetCrown');
    if (btnCrown) btnCrown.addEventListener('click', () => setPreset(48, 1.52, 0.012));

    const btnFlint = document.getElementById('btnPresetFlint');
    if (btnFlint) btnFlint.addEventListener('click', () => setPreset(48, 1.66, 0.018));

    const btnWater = document.getElementById('btnPresetWater');
    if (btnWater) btnWater.addEventListener('click', () => setPreset(52, 1.33, 0.006));

    const btnDiamond = document.getElementById('btnPresetDiamond');
    if (btnDiamond) btnDiamond.addEventListener('click', () => setPreset(40, 2.42, 0.024));
  }

  // Formula di Cauchy: n(λ) = nBase + B / λ² (con λ in µm)
  getRefractiveIndex(wlNm) {
    const wlMicrons = wlNm / 1000;
    return this.nBase + this.cauchyB / (wlMicrons * wlMicrons);
  }

  // Intersezione tra semiretta (rx, ry) + t*(rdx, rdy) con segmento (sx1, sy1) -> (sx2, sy2)
  intersectRaySegment(rx, ry, rdx, rdy, sx1, sy1, sx2, sy2) {
    const sdx = sx2 - sx1;
    const sdy = sy2 - sy1;
    const denom = rdx * sdy - rdy * sdx;
    if (Math.abs(denom) < 1e-7) return null;

    const t = ((sx1 - rx) * sdy - (sy1 - ry) * sdx) / denom;
    const u = ((sx1 - rx) * rdy - (sy1 - ry) * rdx) / denom;

    if (t > 0.001 && u >= 0 && u <= 1) {
      return { x: rx + t * rdx, y: ry + t * rdy, t: t };
    }
    return null;
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Sfondo ottico da laboratorio scuro
    this.ctx.fillStyle = '#03050a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Geometria del prisma triangolare equilatero (angolo al vertice A = 60°)
    const S = Math.min(this.width * 0.38, 230); // lunghezza lato
    const H = S * (Math.sqrt(3) / 2);           // altezza triangolo
    const cx = this.width * 0.44;
    const cy = this.height * 0.52;

    const pTop = { x: cx, y: cy - (2 / 3) * H };
    const pLeft = { x: cx - S / 2, y: cy + (1 / 3) * H };
    const pRight = { x: cx + S / 2, y: cy + (1 / 3) * H };

    // Faccia 1 (Sinistra): L -> T
    // Tangente unitaria lungo la faccia verso l'alto
    const u1 = { x: (pTop.x - pLeft.x) / S, y: (pTop.y - pLeft.y) / S }; // (0.5, -sqrt(3)/2)
    // Normale unitaria interna (rivolta verso l'interno del prisma)
    const nIn1 = { x: -u1.y, y: u1.x }; // (sqrt(3)/2, 0.5)
    // Normale unitaria esterna
    const nOut1 = { x: -nIn1.x, y: -nIn1.y };

    // Faccia 2 (Destra): T -> R
    const u2 = { x: (pRight.x - pTop.x) / S, y: (pRight.y - pTop.y) / S }; // (0.5, sqrt(3)/2)
    const nOut2 = { x: u2.y, y: -u2.x }; // (sqrt(3)/2, -0.5) verso l'esterno
    const nIn2 = { x: -nOut2.x, y: -nOut2.y };

    // Faccia 3 (Base): L -> R
    const nOut3 = { x: 0, y: 1 }; // verso il basso esterno
    const nIn3 = { x: 0, y: -1 };

    // Punto di incidenza P1 sulla faccia sinistra (circa al 55% dall'alto per consentire un buon percorso interno)
    const tHit = 0.52;
    const P1 = {
      x: pLeft.x + (pTop.x - pLeft.x) * tHit,
      y: pLeft.y + (pTop.y - pLeft.y) * tHit
    };

    // VETTORE DI INCIDENZA DEL RAGGIO BIANCO ESTERNO
    // Angolo θ1 rispetto alla normale interna nIn1
    const theta1Rad = (this.theta1Deg * Math.PI) / 180;
    // Il raggio viaggia verso P1 con angolo θ1 rispetto a nIn1:
    // dInc = cos(θ1)*nIn1 - sin(θ1)*u1
    const dInc = {
      x: Math.cos(theta1Rad) * nIn1.x - Math.sin(theta1Rad) * u1.x,
      y: Math.cos(theta1Rad) * nIn1.y - Math.sin(theta1Rad) * u1.y
    };

    // Sorgente raggio bianco esterno
    const sourceLen = 220;
    const Psrc = {
      x: P1.x - dInc.x * sourceLen,
      y: P1.y - dInc.y * sourceLen
    };

    // Disegna la normale ottica tratteggiata sulla faccia 1 per riferimento didattico
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(P1.x - nIn1.x * 40, P1.y - nIn1.y * 40);
    this.ctx.lineTo(P1.x + nIn1.x * 40, P1.y + nIn1.y * 40);
    this.ctx.stroke();
    this.ctx.restore();

    // Disegna il raggio bianco incidente
    this.ctx.save();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = this.beamThickness;
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    this.ctx.shadowBlur = 12;
    this.ctx.beginPath();
    this.ctx.moveTo(Psrc.x, Psrc.y);
    this.ctx.lineTo(P1.x, P1.y);
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '600 11px Inter, sans-serif';
    this.ctx.fillText(`Luce Bianca Incidente (θ₁ = ${this.theta1Deg.toFixed(1)}°)`, Psrc.x + 10, Psrc.y - 12);
    this.ctx.restore();

    // Disegna il corpo geometrico del prisma
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(pTop.x, pTop.y);
    this.ctx.lineTo(pRight.x, pRight.y);
    this.ctx.lineTo(pLeft.x, pLeft.y);
    this.ctx.closePath();

    const prismGrad = this.ctx.createLinearGradient(pLeft.x, pLeft.y, pRight.x, pRight.y);
    prismGrad.addColorStop(0, 'rgba(100, 150, 255, 0.08)');
    prismGrad.addColorStop(0.5, 'rgba(180, 220, 255, 0.15)');
    prismGrad.addColorStop(1, 'rgba(100, 150, 255, 0.06)');
    this.ctx.fillStyle = prismGrad;
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(200, 230, 255, 0.7)';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = 'rgba(150, 200, 255, 0.4)';
    this.ctx.shadowBlur = 10;
    this.ctx.stroke();
    this.ctx.restore();

    // Campioni spettrali (lunghezze d'onda da violetto a rosso)
    const spectralBands = [
      { wl: 400, color: '#8b00ff', name: 'Violetto' },
      { wl: 445, color: '#2b35ff', name: 'Blu' },
      { wl: 485, color: '#00c3ff', name: 'Ciano' },
      { wl: 525, color: '#00ff40', name: 'Verde' },
      { wl: 575, color: '#ffff00', name: 'Giallo' },
      { wl: 615, color: '#ff7700', name: 'Arancione' },
      { wl: 685, color: '#ff1111', name: 'Rosso' }
    ];

    const nAir = 1.00029;
    let totalInternalReflectionCount = 0;
    let avgDeviationDeg = 0;
    let validRaysCount = 0;

    // 1ª RIFRAZIONE (Aria -> Prisma) con Legge di Snell per ciascuna λ
    spectralBands.forEach((band) => {
      const nGlass = this.getRefractiveIndex(band.wl);

      // Snell: nAir * sin(θ1) = nGlass * sin(θ2)
      const sinTheta2 = (nAir * Math.sin(theta1Rad)) / nGlass;
      if (Math.abs(sinTheta2) > 1) return; // Non accade da aria a vetro

      const theta2Rad = Math.asin(sinTheta2);
      // Vettore dInside: cos(θ2)*nIn1 - sin(θ2)*u1
      const dInside = {
        x: Math.cos(theta2Rad) * nIn1.x - Math.sin(theta2Rad) * u1.x,
        y: Math.cos(theta2Rad) * nIn1.y - Math.sin(theta2Rad) * u1.y
      };

      // Trova intersezione del raggio interno con la faccia 2 (destra) o la faccia 3 (base)
      const hitRight = this.intersectRaySegment(P1.x, P1.y, dInside.x, dInside.y, pTop.x, pTop.y, pRight.x, pRight.y);
      const hitBase = this.intersectRaySegment(P1.x, P1.y, dInside.x, dInside.y, pLeft.x, pLeft.y, pRight.x, pRight.y);

      let P2 = null;
      let faceHit = null;

      if (hitRight && (!hitBase || hitRight.t < hitBase.t)) {
        P2 = hitRight;
        faceHit = 'right';
      } else if (hitBase) {
        P2 = hitBase;
        faceHit = 'base';
      }

      if (!P2) return;

      // Disegna il percorso interno del raggio cromatico
      this.ctx.save();
      this.ctx.strokeStyle = band.color;
      this.ctx.lineWidth = 2.0;
      this.ctx.beginPath();
      this.ctx.moveTo(P1.x, P1.y);
      this.ctx.lineTo(P2.x, P2.y);
      this.ctx.stroke();
      this.ctx.restore();

      // 2ª INTERFACCIA: Controllo Riflessione Totale Interna (TIR) o Rifrazione
      if (faceHit === 'right') {
        // Angolo di incidenza θ3 rispetto alla normale esterna nOut2
        // cos(θ3) = dInside · nOut2
        const cosTheta3 = dInside.x * nOut2.x + dInside.y * nOut2.y;
        const sinTheta3 = Math.sqrt(Math.max(0, 1 - cosTheta3 * cosTheta3));

        // Angolo critico: sin(θc) = nAir / nGlass
        const sinCritical = nAir / nGlass;

        if (sinTheta3 > sinCritical || cosTheta3 <= 0) {
          // ==========================================
          // RIFLESSIONE TOTALE INTERNA (TIR)
          // ==========================================
          totalInternalReflectionCount++;

          // Vettore riflesso: dRefl = dInside - 2*(dInside · nOut2)*nOut2
          const dRefl = {
            x: dInside.x - 2 * cosTheta3 * nOut2.x,
            y: dInside.y - 2 * cosTheta3 * nOut2.y
          };

          // Il raggio riflesso internamente prosegue verso la base del prisma (pLeft -> pRight)
          const hitBaseAfterTIR = this.intersectRaySegment(P2.x, P2.y, dRefl.x, dRefl.y, pLeft.x, pLeft.y, pRight.x, pRight.y);

          this.ctx.save();
          this.ctx.strokeStyle = band.color;
          this.ctx.shadowColor = band.color;
          this.ctx.shadowBlur = 10;
          this.ctx.lineWidth = 2.4;

          if (hitBaseAfterTIR) {
            // Disegna raggio riflesso che colpisce la base
            this.ctx.beginPath();
            this.ctx.moveTo(P2.x, P2.y);
            this.ctx.lineTo(hitBaseAfterTIR.x, hitBaseAfterTIR.y);
            this.ctx.stroke();

            // Rifrazione all'uscita dalla base verso il basso
            const cosBaseInc = dRefl.x * nOut3.x + dRefl.y * nOut3.y;
            const sinBaseInc = Math.sqrt(Math.max(0, 1 - cosBaseInc * cosBaseInc));
            const sinBaseRef = (nGlass * sinBaseInc) / nAir;

            if (sinBaseRef <= 1) {
              const thetaBaseRef = Math.asin(sinBaseRef);
              // Raggio che fuoriesce dalla base
              const dBaseOut = {
                x: (dRefl.x > 0 ? 1 : -1) * Math.sin(thetaBaseRef),
                y: Math.cos(thetaBaseRef)
              };

              this.ctx.beginPath();
              this.ctx.moveTo(hitBaseAfterTIR.x, hitBaseAfterTIR.y);
              this.ctx.lineTo(hitBaseAfterTIR.x + dBaseOut.x * 120, hitBaseAfterTIR.y + dBaseOut.y * 120);
              this.ctx.stroke();
            }
          } else {
            // Riflessione senza colpire la base nel disegno
            this.ctx.beginPath();
            this.ctx.moveTo(P2.x, P2.y);
            this.ctx.lineTo(P2.x + dRefl.x * 140, P2.y + dRefl.y * 140);
            this.ctx.stroke();
          }
          this.ctx.restore();

        } else {
          // ==========================================
          // RIFRAZIONE DI SNELL REGOLARE FUORI DAL PRISMA
          // ==========================================
          const sinTheta4 = (nGlass * sinTheta3) / nAir;
          const theta4Rad = Math.asin(Math.min(1, sinTheta4));
          const cosTheta4 = Math.cos(theta4Rad);

          // Componente tangenziale unitaria
          const dTang = {
            x: dInside.x - cosTheta3 * nOut2.x,
            y: dInside.y - cosTheta3 * nOut2.y
          };
          const lenTang = Math.hypot(dTang.x, dTang.y) || 1;
          const uTang = { x: dTang.x / lenTang, y: dTang.y / lenTang };

          // Vettore dOut: cos(θ4)*nOut2 + sin(θ4)*uTang
          const dOut = {
            x: cosTheta4 * nOut2.x + Math.sin(theta4Rad) * uTang.x,
            y: cosTheta4 * nOut2.y + Math.sin(theta4Rad) * uTang.y
          };

          // Angolo di deviazione totale: δ = θ1 + θ4 - A
          const apexA = (60 * Math.PI) / 180;
          const deviationRad = theta1Rad + theta4Rad - apexA;
          avgDeviationDeg += (deviationRad * 180) / Math.PI;
          validRaysCount++;

          // Disegna raggio spettrale rifratto all'esterno
          const rayLen = this.width - P2.x + 30;
          const Pout = {
            x: P2.x + dOut.x * rayLen,
            y: P2.y + dOut.y * rayLen
          };

          this.ctx.save();
          this.ctx.strokeStyle = band.color;
          this.ctx.shadowColor = band.color;
          this.ctx.shadowBlur = 12;
          this.ctx.lineWidth = 2.6;
          this.ctx.beginPath();
          this.ctx.moveTo(P2.x, P2.y);
          this.ctx.lineTo(Pout.x, Pout.y);
          this.ctx.stroke();
          this.ctx.restore();
        }
      }
    });

    // Calcolo angolo critico limite per nBase
    const criticalAngleDeg = (Math.asin(nAir / this.nBase) * 180) / Math.PI;
    const isTIR = totalInternalReflectionCount === spectralBands.length;

    // Aggiornamento interfaccia metrica
    const elCritAngle = document.getElementById('prismCriticalAngle');
    const elDevAngle = document.getElementById('prismDevAngle');
    const elStatus = document.getElementById('prismStatusPill');

    if (elCritAngle) elCritAngle.textContent = `${criticalAngleDeg.toFixed(1)}°`;
    if (elDevAngle) {
      if (validRaysCount > 0) {
        elDevAngle.textContent = `${(avgDeviationDeg / validRaysCount).toFixed(1)}°`;
      } else {
        elDevAngle.textContent = 'N/A (Riflessione Totale)';
      }
    }

    if (elStatus) {
      if (isTIR) {
        elStatus.className = 'emission-status-pill emission-no';
        elStatus.textContent = '⚡ RIFLESSIONE TOTALE INTERNA (TIR ATTIVA: θ₃ > θ_c)';
      } else if (totalInternalReflectionCount > 0) {
        elStatus.className = 'emission-status-pill';
        elStatus.style.background = 'rgba(234, 179, 8, 0.2)';
        elStatus.style.color = '#facc15';
        elStatus.style.border = '1px solid rgba(234, 179, 8, 0.4)';
        elStatus.textContent = '⚠️ RIFLESSIONE TOTALE PARZIALE (Solo alcune lunghezze d\'onda)';
      } else {
        elStatus.className = 'emission-status-pill emission-yes';
        elStatus.style.background = '';
        elStatus.style.color = '';
        elStatus.style.border = '';
        elStatus.textContent = '🌈 RIFRAZIONE DI SNELL & DISPERSIONE SPETTRALE ATTIVA';
      }
    }

    // Firma didattica sul canvas
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.font = '600 10px monospace';
    this.ctx.fillText(`DISPERSIONE OTTICA DI SNELL — n = ${this.nBase.toFixed(2)} | θ₁ = ${this.theta1Deg.toFixed(1)}° | θ_crit = ${criticalAngleDeg.toFixed(1)}°`, 20, this.height - 18);
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
    this.intensity = 1.0;

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

    const thresholdWlNm = ((H_EV * C) / workFunctionEv) * 1e9;
    const canEmit = photonEnergyEv > workFunctionEv;
    const maxKineticEnergyEv = canEmit ? photonEnergyEv - workFunctionEv : 0;
    const stoppingVoltage = maxKineticEnergyEv;

    const maxK_Joule = maxKineticEnergyEv * EV_JOULE;
    const maxVelocityM_S = Math.sqrt((2 * maxK_Joule) / ELECTRON_MASS);
    const reachesAnode = maxKineticEnergyEv > this.retardingVoltage;

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

    const padX = 60;
    const tubeY = 70;
    const tubeH = this.height - 140;
    const tubeW = this.width - padX * 2;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(120, 160, 255, 0.25)';
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = 'rgba(8, 12, 22, 0.8)';
    this.ctx.beginPath();
    this.ctx.roundRect(padX, tubeY, tubeW, tubeH, 20);
    this.ctx.fill();
    this.ctx.stroke();

    const cathodeX = padX + 45;
    const cathodeY1 = tubeY + 30;
    const cathodeY2 = tubeY + tubeH - 30;
    this.ctx.strokeStyle = '#94a3b8';
    this.ctx.lineWidth = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(cathodeX, cathodeY1);
    this.ctx.lineTo(cathodeX, cathodeY2);
    this.ctx.stroke();

    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.font = 'bold 11px Inter, sans-serif';
    this.ctx.fillText(`Catodo [${PHOTO_METALS[this.metalKey].name}]`, cathodeX - 25, cathodeY1 - 10);

    const anodeX = padX + tubeW - 45;
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.moveTo(anodeX, cathodeY1);
    this.ctx.lineTo(anodeX, cathodeY2);
    this.ctx.stroke();

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.fillText('Anodo (+)', anodeX - 20, cathodeY1 - 10);

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

    for (let i = this.electrons.length - 1; i >= 0; i--) {
      const e = this.electrons[i];
      const decel = (this.retardingVoltage / (this.kineticEv + 0.1)) * 0.08;
      e.vx -= decel;
      e.x += e.vx;
      e.y += e.vy;
      e.life++;

      this.ctx.save();
      this.ctx.fillStyle = '#00f7ff';
      this.ctx.shadowColor = '#00f7ff';
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      if (e.x >= anodeX || e.x <= cathodeX || e.life > e.maxLife || e.vx < -2) {
        this.electrons.splice(i, 1);
      }
    }

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
  new NewtonPrismSimulator('prismCanvas');
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
