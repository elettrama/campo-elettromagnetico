# 🌌 Il Campo Elettromagnetico & Lo Spettro Visibile

Un'applicazione web interattiva, scientifica ed esteticamente moderna dedicata all'**elettrodinamica classica**, all'**ottica ondulatoria** e alla **meccanica quantistica dei fotoni**, con un focus sulla **luce visibile**, sulla **dispersione cromatica del prisma** (ispirata alla copertina iconica di *The Dark Side of the Moon* dei Pink Floyd) e sull'**effetto fotoelettrico di Einstein**.

---

## 🚀 Funzionalità Principali

### 1. 📡 Simulatore 3D dell'Onda Elettromagnetica (Canvas Prospettico)
- Proiezione tridimensionale con orbita interattiva (rotazione 3D via mouse o touch).
- Visualizzazione del **Campo Elettrico $\vec{E}$** (rosso) e del **Campo Magnetico $\vec{B}$** (blu) mutuamente ortogonali e in fase.
- Vettori istantanei e **Vettore di Poynting $\vec{S} = \frac{1}{\mu_0} \vec{E} \times \vec{B}$** che illustra la densità di flusso di energia radiante.
- Regolazione in tempo reale di lunghezza d'onda $\lambda$ e velocità di propagazione $c$.

### 2. 🔭 Esploratore dello Spettro Elettromagnetico Completo
- Scala continua da **Onde Radio** ($> 1\text{ m}$) a **Raggi Gamma** ($< 0.01\text{ nm}$).
- Scheda interattiva con ordini di grandezza, frequenze ($\text{THz}$, $\text{GHz}$, $\text{MHz}$), energie fotoniche in $\text{eV}$, sorgenti astrofisiche e applicazioni tecnologiche.

### 3. 🌈 Focus sulla Luce Visibile (380 – 750 nm)
- Selettore continuo monocromatico con algoritmo fisico (approssimazione CIE / Dan Bruton) per calcolare la tonalità esatta e il codice colore HEX.
- Calcolo quantistico in tempo reale:
  - Frequenza $\nu = c / \lambda$ in Terahertz ($\text{THz}$)
  - Energia per fotone $E = h\nu$ in Elettronvolt ($\text{eV}$) e Joule ($10^{-19}\text{ J}$)
  - Periodo temporale $T$ in femtosecondi ($\text{fs}$)
  - Vettore d'onda $k = 2\pi / \lambda$ in $\text{rad/m}$
- Approfondimento di fisica pura: Radiazione di corpo nero (Planck & Wien a $5778\text{ K}$) e le 4 righe spettrali visibili della **Serie di Balmer dell'idrogeno** ($H_\alpha, H_\beta, H_\gamma, H_\delta$).

### 4. 🌑 Dispersione Spettrale: Il Prisma & "The Dark Side of the Moon"
- Simulazione ottica su fondo nero cosmico ispirata all'artwork di Storm Thorgerson (Hipgnosis) per l'album dei **Pink Floyd** (1973).
- Fascio incidente bianco collimato ad alta intensità con effetto *optical glow*.
- Dispersione interna e rifrazione alle interfacce aria-vetro secondo la **Legge di Snell** e la **Formula di Cauchy**:
  $$n(\lambda) = A + \frac{B}{\lambda^2}$$
- Modalità di visualizzazione:
  - **The Dark Side of the Moon**: Nastro iconico a 6 bande cromatiche continue e sature (Rosso, Arancione, Giallo, Verde, Blu, Violetto).
  - **Simulazione Fisica**: Tracciamento dei singoli raggi di rifrazione spettrale.
- Regolazione dell'angolo d'incidenza, apertura del ventaglio e intensità del bagliore.

### 5. ⚡ Quanti di Luce & Effetto Fotoelettrico (Einstein 1905)
- Simulatore di cella fototubo a vuoto con catodo emettitore e anodo.
- Selezione del materiale del catodo con relativo lavoro di estrazione ($\Phi$):
  - **Cesio (Cs)**: $\Phi = 2.14\text{ eV}$ (estrazione già attiva con luce verde/blu)
  - **Potassio (K)**: $\Phi = 2.30\text{ eV}$
  - **Sodio (Na)**: $\Phi = 2.36\text{ eV}$
  - **Calcio (Ca)**: $\Phi = 2.87\text{ eV}$
  - **Zinco (Zn)**: $\Phi = 4.30\text{ eV}$ (richiede ultravioletti)
- Verifica sperimentale dell'equazione di Einstein:
  $$K_{\max} = h\nu - \Phi = e \cdot V_{\text{arresto}}$$
- Calcolo della velocità massima degli elettroni (in km/s), potenziale di frenamento ritardante e particelle fotoelettroniche animate in tempo reale.

---

## 📁 Struttura dei File

```text
campo-elettromagnetico/
├── index.html        # Struttura della pagina e testi scientifici
├── style.css         # Styling dark-mode, layout responsive e animazioni
├── app.js            # Motore Canvas 2D/3D e calcoli fisici in Vanilla JS
└── README.md         # Documentazione del progetto
```

---

## 💻 Come Eseguire Localmente

Non è richiesta alcuna installazione o dipendenza esterna:
1. Clona o scarica questa repository.
2. Apri direttamente `index.html` con qualsiasi browser web moderno (Chrome, Safari, Firefox, Edge).

---

## 📄 Licenza

Distribuito sotto licenza **MIT**. Sentiti libero di utilizzare, modificare e condividere per fini didattici, scientifici o personali.
