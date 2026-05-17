import { STRINGS, NOTES, getNoteAt } from './fretboard.js';

export class FretboardUI {
    constructor(containerId, gameState, onFretClick) {
        this.container = document.getElementById(containerId);
        this.game = gameState;
        this.onFretClick = onFretClick;
        this.fretWidth = 60;
        this.stringHeight = 25;
        this.margin = { top: 35, right: 20, bottom: 35, left: 50 };
        this.highlights = []; // Array of { stringIdx, fret, color, label }
        this.render();
    }

    render() {
        const [minFret, maxFret] = this.game.fretRange;
        const numFrets = maxFret - minFret;
        const width = (numFrets + 1) * this.fretWidth + this.margin.left + this.margin.right;
        const height = 5 * this.stringHeight + this.margin.top + this.margin.bottom;

        let html = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

        // Draw background wood-ish soft color
        html += `<rect x="${this.margin.left}" y="${this.margin.top}" width="${(numFrets) * this.fretWidth}" height="${5 * this.stringHeight}" fill="#FAF3E0" rx="4" pointer-events="none" />`;

        // Draw frets
        for (let i = 0; i <= numFrets; i++) {
            const x = this.margin.left + i * this.fretWidth;
            const isNut = (i + minFret) === 0;
            html += `<line x1="${x}" y1="${this.margin.top}" x2="${x}" y2="${height - this.margin.bottom}" 
                      stroke="${isNut ? '#484848' : '#D1D1D1'}" stroke-width="${isNut ? 6 : 3}" stroke-linecap="round" pointer-events="none" />`;
            
            // Fret numbers
            if (!isNut) {
                html += `<text x="${x - this.fretWidth/2}" y="${height - 10}" font-size="12" font-weight="600" text-anchor="middle" fill="#717171" pointer-events="none">${i + minFret}</text>`;
            } else {
                html += `<text x="${x - 30}" y="${height - 10}" font-size="10" font-weight="800" text-anchor="middle" fill="#FF5A5F" pointer-events="none">OPEN</text>`;
            }
        }

        // Draw strings
        const stringColors = ["#8B7E74", "#A4907C", "#BC9F8B", "#C7B198", "#D9CAB3", "#EADBC8"];
        for (let i = 0; i < 6; i++) {
            const y = this.margin.top + i * this.stringHeight;
            html += `<line x1="${this.margin.left}" y1="${y}" x2="${width - this.margin.right}" y2="${y}" 
                      stroke="${stringColors[i]}" stroke-width="${1.5 + i * 0.4}" pointer-events="none" />`;
        }

        // Draw markers
        const markers = [3, 5, 7, 9, 12];
        markers.forEach(m => {
            if (m >= minFret && m <= maxFret) {
                const x = this.margin.left + (m - minFret) * this.fretWidth - this.fretWidth / 2;
                if (m === 12) {
                    html += `<circle cx="${x}" cy="${this.margin.top + 1.5 * this.stringHeight}" r="4" fill="#E6D5B8" pointer-events="none" />`;
                    html += `<circle cx="${x}" cy="${this.margin.top + 3.5 * this.stringHeight}" r="4" fill="#E6D5B8" pointer-events="none" />`;
                } else {
                    html += `<circle cx="${x}" cy="${this.margin.top + 2.5 * this.stringHeight}" r="4" fill="#E6D5B8" pointer-events="none" />`;
                }
            }
        });

        // Draw dynamic highlights (for challenge and feedback)
        for (let s = 0; s < 6; s++) {
            for (let f = minFret; f <= maxFret; f++) {
                const isNut = f === 0;
                const x = isNut ? this.margin.left - 40 : this.margin.left + (f - minFret) * this.fretWidth - this.fretWidth;
                const y = this.margin.top + s * this.stringHeight - this.stringHeight / 2;
                const w = isNut ? 40 : this.fretWidth;
                const h = this.stringHeight;

                const isChallengePos = this.game.status === 'playing' && 
                                     this.game.mode === 'identify' && 
                                     this.game.currentChallenge && 
                                     this.game.currentChallenge.stringIdx === s && 
                                     this.game.currentChallenge.fret === f;

                if (isChallengePos) {
                    const cx = isNut ? this.margin.left - 25 : x + w/2;
                    html += `<circle cx="${cx}" cy="${y + h/2}" r="11" fill="${isNut ? 'white' : '#FF5A5F'}" stroke="#FF5A5F" stroke-width="2" pointer-events="none" />`;
                    if (!isNut) {
                        html += `<circle cx="${cx}" cy="${y + h/2}" r="14" fill="none" stroke="#FF5A5F" stroke-width="2" opacity="0.3" pointer-events="none" />`;
                    }
                }

                const highlight = this.highlights.find(h => h.stringIdx === s && h.fret === f);
                if (highlight) {
                    const fx = isNut ? this.margin.left - 25 : x + w/2;
                    html += `<circle cx="${fx}" cy="${y + h/2}" r="14" fill="${highlight.color}" pointer-events="none" />`;
                    if (highlight.label) {
                        html += `<text x="${fx}" y="${y + h/2 + 4}" font-size="11" font-weight="800" text-anchor="middle" fill="white" pointer-events="none">${highlight.label}</text>`;
                    }
                }
            }
        }

        // Draw CLICKABLE zones (Must be LAST to be on top)
        for (let s = 0; s < 6; s++) {
            for (let f = minFret; f <= maxFret; f++) {
                const isNut = f === 0;
                const x = isNut ? this.margin.left - 40 : this.margin.left + (f - minFret) * this.fretWidth - this.fretWidth;
                const y = this.margin.top + s * this.stringHeight - this.stringHeight / 2;
                const w = isNut ? 40 : this.fretWidth;
                const h = this.stringHeight;

                html += `<rect x="${x}" y="${y}" width="${w}" height="${h}" 
                          fill="white" fill-opacity="0" 
                          class="fret-target" data-string="${s}" data-fret="${f}" 
                          style="cursor: pointer;" />`;
            }
        }

        // Hover dot (dynamic)
        html += `<circle id="hover-dot" cx="0" cy="0" r="10" fill="rgba(255, 90, 95, 0.15)" style="display: none; pointer-events: none;" />`;

        html += '</svg>';
        this.container.innerHTML = html;

        // Add event listeners
        const hoverDot = this.container.querySelector('#hover-dot');

        this.container.querySelectorAll('.fret-target').forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const rect = e.target;
                const isNut = parseInt(rect.dataset.fret) === 0;
                const cx = isNut ? this.margin.left - 25 : parseFloat(rect.getAttribute('x')) + parseFloat(rect.getAttribute('width')) / 2;
                const cy = parseFloat(rect.getAttribute('y')) + parseFloat(rect.getAttribute('height')) / 2;
                hoverDot.setAttribute('cx', cx);
                hoverDot.setAttribute('cy', cy);
                hoverDot.style.display = 'block';
            });

            el.addEventListener('mouseleave', () => {
                hoverDot.style.display = 'none';
            });

            el.addEventListener('click', (e) => {
                const stringIdx = parseInt(e.target.dataset.string);
                const fret = parseInt(e.target.dataset.fret);
                this.onFretClick(stringIdx, fret);
            });
        });
    }

    showFeedback(stringIdx, fret, isCorrect, label = null) {
        const h = {
            stringIdx,
            fret,
            color: isCorrect ? '#00A699' : '#FF5A5F', // Accent Green or Airbnb Coral
            label
        };
        this.highlights.push(h);
        this.render();
        setTimeout(() => {
            this.highlights = this.highlights.filter(item => item !== h);
            this.render();
        }, 500);
    }

    setHighlights(highlights) {
        this.highlights = highlights;
        this.render();
    }
}
