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

        // Draw clickable zones
        for (let s = 0; s < 6; s++) {
            for (let f = minFret; f <= maxFret; f++) {
                const x = f === minFret ? this.margin.left - 20 : this.margin.left + (f - minFret) * this.fretWidth - this.fretWidth;
                const y = this.margin.top + s * this.stringHeight - this.stringHeight / 2;
                const w = f === minFret ? 20 : this.fretWidth;
                const h = this.stringHeight;

                const isChallengePos = this.game.status === 'playing' && 
                                     this.game.mode === 'identify' && 
                                     this.game.currentChallenge && 
                                     this.game.currentChallenge.stringIdx === s && 
                                     this.game.currentChallenge.fret === f;

                html += `<rect x="${x}" y="${y}" width="${w}" height="${h}" 
                          fill="${isChallengePos ? 'rgba(0,123,255,0.2)' : 'transparent'}" 
                          class="fret-target" data-string="${s}" data-fret="${f}" 
                          style="cursor: pointer;" />`;
                
                if (isChallengePos) {
                    html += `<circle cx="${x + w/2}" cy="${y + h/2}" r="8" fill="#007bff" opacity="0.6" />`;
                }

                // Permanent feedback dot (if exists)
                if (this.feedbackPos && this.feedbackPos.stringIdx === s && this.feedbackPos.fret === f) {
                    html += `<circle cx="${x + w/2}" cy="${y + h/2}" r="12" fill="${this.feedbackPos.color}" />`;
                    if (this.feedbackPos.label) {
                        html += `<text x="${x + w/2}" y="${y + h/2 + 4}" font-size="10" font-weight="bold" text-anchor="middle" fill="white">${this.feedbackPos.label}</text>`;
                    }
                }
            }
        }

        // Hover dot (dynamic)
        html += `<circle id="hover-dot" cx="0" cy="0" r="8" fill="rgba(0,123,255,0.3)" style="display: none; pointer-events: none;" />`;

        html += '</svg>';
        this.container.innerHTML = html;

        // Add event listeners
        const hoverDot = this.container.querySelector('#hover-dot');

        this.container.querySelectorAll('.fret-target').forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const rect = e.target;
                const cx = parseFloat(rect.getAttribute('x')) + parseFloat(rect.getAttribute('width')) / 2;
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
        this.feedbackPos = {
            stringIdx,
            fret,
            color: isCorrect ? '#28a745' : '#dc3545',
            label
        };
        this.render();
        setTimeout(() => {
            this.feedbackPos = null;
            this.render();
        }, 500);
    }
}
