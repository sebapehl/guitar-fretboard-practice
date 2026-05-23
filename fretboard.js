export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const NOTE_VALUES = {
    "C": 0, "C#": 1, "Db": 1, "DB": 1, "D": 2, "D#": 3, "Eb": 3, "EB": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "GB": 6, "G": 7, "G#": 8, "Ab": 8, "AB": 8, "A": 9, "A#": 10, "Bb": 10, "BB": 10, "B": 11
};

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];

/**
 * Returns the major scale starting on rootName.
 * Simplification: uses the all-sharps NOTES array for all scales.
 */
export function getMajorScale(rootName) {
    const intervals = [0, 2, 4, 5, 7, 9, 11];
    const rootValue = NOTE_VALUES[rootName[0].toUpperCase() + rootName.slice(1).toLowerCase()] || NOTE_VALUES[rootName.toUpperCase()];
    if (rootValue === undefined) return null;

    return intervals.map(interval => {
        const targetValue = (rootValue + interval) % 12;
        return NOTES[targetValue];
    });
}

export const STRINGS = [
    { name: "e", open: "E", midi: 64 }, // E4
    { name: "B", open: "B", midi: 59 }, // B3
    { name: "G", open: "G", midi: 55 }, // G3
    { name: "D", open: "D", midi: 50 }, // D3
    { name: "A", open: "A", midi: 45 }, // A2
    { name: "E", open: "E", midi: 40 }  // E2
];

/**
 * Returns the note name and octave for a given string and fret.
 * e.g. { name: "C", octave: 4, full: "C4" }
 */
export function getNoteInfo(stringIdx, fret) {
    if (stringIdx < 0 || stringIdx >= STRINGS.length) return { name: "?", octave: 0, full: "?" };
    const baseMidi = STRINGS[stringIdx].midi;
    const midi = baseMidi + fret;
    const octave = Math.floor(midi / 12) - 1;
    const name = NOTES[((midi % 12) + 12) % 12];
    return { name, octave, full: `${name}${octave}` };
}

export function getNoteAt(stringOpen, fret) {
    const openValue = NOTE_VALUES[stringOpen];
    const noteValue = ((openValue + fret) % 12 + 12) % 12;
    return NOTES[noteValue];
}

export function isCorrectNote(userAnswer, correctNote) {
    const user = userAnswer.trim().toUpperCase();
    const correct = correctNote.trim().toUpperCase();
    
    // Check direct match
    if (user === correct) return true;
    
    // Check enharmonic equivalence using values
    const userVal = NOTE_VALUES[user];
    const correctVal = NOTE_VALUES[correct];
    
    return userVal !== undefined && correctVal !== undefined && userVal === correctVal;
}

export class GameState {
    constructor() {
        this.mode = 'identify'; // 'identify' (Position -> Name) or 'locate' (Name -> Position)
        this.fretRange = [0, 12]; // The overall practice bounds (e.g., set by user slider)
        this.currentNeighborhood = [0, 5]; // The active 5-fret window
        this.stringRange = [0, 5];
        this.rounds = 10;
        this.currentRound = 0;
        this.score = 0;
        this.history = [];
        this.startTime = null;
        this.roundStartTime = null;
        this.status = 'idle'; // 'idle', 'playing', 'finished'
        this.currentChallenge = null;
    }

    startRound() {
        this.status = 'playing';
        this.score = 0;
        this.currentRound = 0;
        this.history = [];
        this.startTime = performance.now();
        this.nextChallenge();
    }

    nextChallenge() {
        if (this.currentRound >= this.rounds) {
            this.status = 'finished';
            this.endTime = performance.now();
            return null;
        }

        // Positional Practice is now mandatory: pick a 5-fret neighborhood within the overall range
        const windowSize = 5;
        const [minLimit, maxLimit] = this.fretRange;
        const rangeSpan = maxLimit - minLimit;
        const effectiveWindow = Math.min(windowSize, rangeSpan);
        
        const anchor = Math.floor(Math.random() * (rangeSpan - effectiveWindow + 1)) + minLimit;
        this.currentNeighborhood = [anchor, anchor + effectiveWindow];

        const lastNote = this.currentChallenge ? this.currentChallenge.correctNote : null;
        let stringIdx, fret, correctNote;
        
        let attempts = 0;
        do {
            stringIdx = Math.floor(Math.random() * (this.stringRange[1] - this.stringRange[0] + 1)) + this.stringRange[0];
            fret = Math.floor(Math.random() * (this.currentNeighborhood[1] - this.currentNeighborhood[0] + 1)) + this.currentNeighborhood[0];
            
            correctNote = getNoteAt(STRINGS[stringIdx].open, fret);
            attempts++;
        } while (correctNote === lastNote && attempts < 40);

        const stringObj = STRINGS[stringIdx];
        this.currentChallenge = {
            stringIdx,
            stringName: stringObj.name,
            fret,
            correctNote,
            timestamp: performance.now(),
            neighborhood: [...this.currentNeighborhood] // Lock the window at challenge time
        };
        this.roundStartTime = this.currentChallenge.timestamp;
        this.currentRound++;
        return this.currentChallenge;
    }

    submitAnswer(answer) {
        const now = performance.now();
        const latency = now - this.roundStartTime;
        let correct = false;

        if (this.mode === 'identify') {
            correct = isCorrectNote(answer, this.currentChallenge.correctNote);
        } else {
            // Locate mode: answer is { stringIdx, fret }
            if (answer.stringIdx === this.currentChallenge.stringIdx) {
                // Must be within the neighborhood locked at challenge time
                const range = this.currentChallenge.neighborhood;
                const inRange = answer.fret >= range[0] && answer.fret <= range[1];
                if (inRange) {
                    const answerNote = getNoteAt(STRINGS[answer.stringIdx].open, answer.fret);
                    correct = isCorrectNote(answerNote, this.currentChallenge.correctNote);
                }
            }
        }

        if (correct) this.score++;
        
        this.history.push({
            challenge: { ...this.currentChallenge },
            answer,
            correct,
            latency
        });

        return { correct, latency };
    }

    getTotalTime() {
        if (this.status === 'finished') {
            return (this.endTime - this.startTime) / 1000;
        }
        return (performance.now() - this.startTime) / 1000;
    }
}
