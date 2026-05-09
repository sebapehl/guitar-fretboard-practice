import { STRINGS, NOTES, getNoteAt } from './fretboard.js';

export class FretboardUI {
    constructor(containerId, gameState, onFretClick) {
        this.container = document.getElementById(containerId);
        this.game = gameState;
        this.onFretClick = onFretClick;
        this.fretWidth = 60;
        this.stringHeight = 25;
        this.margin = { top: 20, right: 20, bottom: 20, left: 30 };
        this.render();
    }

    render() {
        const [minFret, maxFret] = this.game.fretRange;
        const numFrets = maxFret - minFret;
        const width = (numFrets + 1) * this.fretWidth + this.margin.left + this.margin.right;
        const height = 5 * this.stringHeight + this.margin.top + this.margin.bottom;

        let html = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

        // Draw frets
        for (let i = 0; i <= numFrets; i++) {
            const x = this.margin.left + i * this.fretWidth;
            const isNut = (i + minFret) === 0;
            html += `<line x1="${x}" y1="${this.margin.top}" x2="${x}" y2="${height - this.margin.bottom}" 
                      stroke="${isNut ? 'black' : '#999'}" stroke-width="${isNut ? 5 : 2}" />`;
            
            // Fret numbers
            if (!isNut) {
                html += `<text x="${x - this.fretWidth/2}" y="${height - 2}" font-size="12" text-anchor="middle" fill="#666">${i + minFret}</text>`;
            }
        }

        // Draw strings
        for (let i = 0; i < 6; i++) {
            const y = this.margin.top + i * this.stringHeight;
            html += `<line x1="${this.margin.left}" y1="${y}" x2="${width - this.margin.right}" y2="${y}" 
                      stroke="#444" stroke-width="${1 + i * 0.3}" />`;
        }

        // Draw markers (3, 5, 7, 9, 12)
        const markers = [3, 5, 7, 9, 12];
        markers.forEach(m => {
            if (m >= minFret && m <= maxFret) {
                const x = this.margin.left + (m - minFret) * this.fretWidth - this.fretWidth / 2;
                if (m === 12) {
                    html += `<circle cx="${x}" cy="${this.margin.top + 1.5 * this.stringHeight}" r="5" fill="#ddd" />`;
                    html += `<circle cx="${x}" cy="${this.margin.top + 3.5 * this.stringHeight}" r="5" fill="#ddd" />`;
                } else {
                    html += `<circle cx="${x}" cy="${this.margin.top + 2.5 * this.stringHeight}" r="5" fill="#ddd" />`;
                }
            }
        });

        // Draw clickable zones and highlights
        for (let s = 0; s < 6; s++) {
            for (let f = minFret; f <= maxFret; f++) {
                const x = f === minFret ? this.margin.left - 20 : this.margin.left + (f - minFret) * this.fretWidth - this.fretWidth;
                const y = this.margin.top + s * this.stringHeight - this.stringHeight / 2;
                const w = f === minFret ? 20 : this.fretWidth;
                const h = this.stringHeight;

                const isHighlighted = this.game.status === 'playing' && 
                                     this.game.mode === 'identify' && 
                                     this.game.currentChallenge && 
                                     this.game.currentChallenge.stringIdx === s && 
                                     this.game.currentChallenge.fret === f;

                html += `<rect x="${x}" y="${y}" width="${w}" height="${h}" 
                          fill="${isHighlighted ? 'rgba(0,123,255,0.4)' : 'transparent'}" 
                          class="fret-target" data-string="${s}" data-fret="${f}" 
                          style="cursor: pointer;" />`;
                
                if (isHighlighted) {
                    html += `<circle cx="${x + w/2}" cy="${y + h/2}" r="8" fill="#007bff" />`;
                }
            }
        }

        html += '</svg>';
        this.container.innerHTML = html;

        // Add event listeners
        this.container.querySelectorAll('.fret-target').forEach(el => {
            el.addEventListener('click', (e) => {
                const stringIdx = parseInt(e.target.dataset.string);
                const fret = parseInt(e.target.dataset.fret);
                this.onFretClick(stringIdx, fret);
            });
        });
    }

    highlightCorrect(stringIdx, fret) {
        // Visual feedback for correct/incorrect can be added here
        this.render();
    }
}
