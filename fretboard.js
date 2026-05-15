export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const NOTE_VALUES = {
    "C": 0, "C#": 1, "Db": 1, "DB": 1, "D": 2, "D#": 3, "Eb": 3, "EB": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "GB": 6, "G": 7, "G#": 8, "Ab": 8, "AB": 8, "A": 9, "A#": 10, "Bb": 10, "BB": 10, "B": 11
};

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];

/**
 * Returns the correct spelling for a major scale starting on rootName.
 * Follows the rule: each letter name A-G must be used exactly once.
 */
export function getMajorScale(rootName) {
    const intervals = [0, 2, 4, 5, 7, 9, 11];
    const rootValue = NOTE_VALUES[rootName[0].toUpperCase() + rootName.slice(1).toLowerCase()] || NOTE_VALUES[rootName.toUpperCase()];
    if (rootValue === undefined) return null;

    // Find the starting letter index (0 for C, 1 for D, etc.)
    const rootLetter = rootName[0].toUpperCase();
    let letterIdx = LETTERS.indexOf(rootLetter);

    return intervals.map(interval => {
        const targetValue = (rootValue + interval) % 12;
        const targetLetter = LETTERS[letterIdx % 7];
        letterIdx++;

        // Find which accidental (if any) makes targetLetter match targetValue
        // e.g. if targetValue is 10 (Bb/A#) and targetLetter is B, we need 'b'
        const baseValue = NOTE_VALUES[targetLetter];
        let diff = targetValue - baseValue;
        
        // Handle wrap-around (e.g. B to C)
        if (diff > 6) diff -= 12;
        if (diff < -6) diff += 12;

        let accidental = "";
        if (diff === 1) accidental = "#";
        if (diff === 2) accidental = "##";
        if (diff === -1) accidental = "b";
        if (diff === -2) accidental = "bb";

        return targetLetter + accidental;
    });
}

export const STRINGS = [
    { name: "e", open: "E" },
    { name: "B", open: "B" },
    { name: "G", open: "G" },
    { name: "D", open: "D" },
    { name: "A", open: "A" },
    { name: "E", open: "E" }
];

export function getNoteAt(stringOpen, fret) {
    const openValue = NOTE_VALUES[stringOpen];
    const noteValue = (openValue + fret) % 12;
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
        this.fretRange = [0, 12];
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

        const stringIdx = Math.floor(Math.random() * (this.stringRange[1] - this.stringRange[0] + 1)) + this.stringRange[0];
        const fret = Math.floor(Math.random() * (this.fretRange[1] - this.fretRange[0] + 1)) + this.fretRange[0];
        
        const stringObj = STRINGS[stringIdx];
        const correctNote = getNoteAt(stringObj.open, fret);

        this.currentChallenge = {
            stringIdx,
            stringName: stringObj.name,
            fret,
            correctNote,
            timestamp: performance.now()
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
            const answerNote = getNoteAt(STRINGS[answer.stringIdx].open, answer.fret);
            correct = isCorrectNote(answerNote, this.currentChallenge.correctNote);
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
