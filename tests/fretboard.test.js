import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getNoteAt, isCorrectNote, GameState, NOTES, getNoteInfo } from '../fretboard.js';

describe('Fretboard Logic', () => {
    it('should correctly identify notes at frets', () => {
        expect(getNoteAt('E', 0)).toBe('E');
        expect(getNoteAt('E', 5)).toBe('A');
        expect(getNoteAt('A', 0)).toBe('A');
        expect(getNoteAt('A', 3)).toBe('C');
    });

    it('should handle enharmonics in isCorrectNote', () => {
        expect(isCorrectNote('C#', 'C#')).toBe(true);
        expect(isCorrectNote('Db', 'C#')).toBe(true);
        expect(isCorrectNote('Ab', 'G#')).toBe(true);
        expect(isCorrectNote('G', 'G#')).toBe(false);
    });
});

describe('GameState', () => {
    let game;

    beforeEach(() => {
        game = new GameState();
        // Mock performance.now
        global.performance = { now: vi.fn(() => Date.now()) };
    });

    it('should initialize with default values', () => {
        expect(game.status).toBe('idle');
        expect(game.rounds).toBe(10);
    });

    it('should start a game and generate a challenge', () => {
        game.startRound();
        expect(game.status).toBe('playing');
        expect(game.currentRound).toBe(1);
        expect(game.currentChallenge).not.toBeNull();
    });

    it('should correctly record a correct answer in identify mode', () => {
        game.startRound();
        const correctNote = game.currentChallenge.correctNote;
        const result = game.submitAnswer(correctNote);
        
        expect(result.correct).toBe(true);
        expect(game.score).toBe(1);
        expect(game.history.length).toBe(1);
    });

    it('should require the correct string in locate mode', () => {
        game.mode = 'locate';
        game.startRound();
        const target = game.currentChallenge; // { stringIdx, fret, correctNote }
        
        // Find the same note on a DIFFERENT string
        let wrongStringIdx = (target.stringIdx + 1) % 6;
        
        // Submit correct note name but WRONG string
        const result = game.submitAnswer({ stringIdx: wrongStringIdx, fret: target.fret });
        
        expect(result.correct).toBe(false);
        expect(game.score).toBe(0);
    });

    it('should respect fret range scaffolding', () => {
        game.fretRange = [0, 3];
        for (let i = 0; i < 50; i++) {
            game.nextChallenge();
            expect(game.currentChallenge.fret).toBeGreaterThanOrEqual(0);
            expect(game.currentChallenge.fret).toBeLessThanOrEqual(3);
        }
    });

    it('should not ask the same note twice in a row', () => {
        game.rounds = 100; // Large sample
        game.startRound();
        let lastNote = game.currentChallenge.correctNote;
        
        for (let i = 1; i < 100; i++) {
            const challenge = game.nextChallenge();
            if (!challenge) break;
            expect(challenge.correctNote).not.toBe(lastNote);
            lastNote = challenge.correctNote;
        }
    });

    describe('Positional Practice', () => {
        it('should toggle positional mode and preserve/restore manual range', () => {
            game.fretRange = [0, 5];
            game.togglePositional();
            expect(game.isPositional).toBe(true);
            expect(game.manualFretRange).toEqual([0, 5]);

            // Simulation: game sets a neighborhood
            // We'll loop a few times to ensure we don't just coincidentally hit [0,5]
            let changed = false;
            for (let i = 0; i < 20; i++) {
                game.nextChallenge();
                if (game.fretRange[0] !== 0) {
                    changed = true;
                    break;
                }
            }
            expect(changed).toBe(true);

            game.togglePositional();
            expect(game.isPositional).toBe(false);
            expect(game.fretRange).toEqual([0, 5]);
        });

        it('should pick a neighborhood within valid guitar range (0-22)', () => {
            game.isPositional = true;
            for (let i = 0; i < 100; i++) {
                game.nextChallenge();
                expect(game.anchorFret).toBeGreaterThanOrEqual(0);
                expect(game.anchorFret).toBeLessThanOrEqual(22 - 5);
                expect(game.fretRange[0]).toBe(game.anchorFret);
                expect(game.fretRange[1]).toBe(game.anchorFret + 5);
                expect(game.currentChallenge.fret).toBeGreaterThanOrEqual(game.fretRange[0]);
                expect(game.currentChallenge.fret).toBeLessThanOrEqual(game.fretRange[1]);
            }
        });

        it('should record positional metadata in history', () => {
            game.isPositional = true;
            game.startRound();
            const anchor = game.anchorFret;
            game.submitAnswer(game.currentChallenge.correctNote);

            const record = game.history[0];
            expect(record.challenge.is_positional).toBe(true);
            expect(record.challenge.anchor_fret).toBe(anchor);
        });
    });

    describe('getNoteInfo', () => {
        it('should return correct note info using the NOTES array', () => {
            const info = getNoteInfo(5, 0); // Low E, fret 0
            expect(info.name).toBe('E');
            expect(info.octave).toBe(2);
            expect(info.full).toBe('E2');

            const info2 = getNoteInfo(0, 8); // High e, fret 8 (C5)
            expect(info2.name).toBe('C');
            expect(info2.octave).toBe(5);
        });
    });
});
