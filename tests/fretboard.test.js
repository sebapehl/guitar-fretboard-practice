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

    describe('Positional Neighborhoods', () => {
        it('should always pick a neighborhood within the practice range', () => {
            game.fretRange = [0, 12];
            for (let i = 0; i < 50; i++) {
                game.nextChallenge();
                const [min, max] = game.currentNeighborhood;
                expect(max - min).toBeLessThanOrEqual(5);
                expect(min).toBeGreaterThanOrEqual(0);
                expect(max).toBeLessThanOrEqual(12);
                expect(game.currentChallenge.fret).toBeGreaterThanOrEqual(min);
                expect(game.currentChallenge.fret).toBeLessThanOrEqual(max);
            }
        });

        it('should shrink the neighborhood if the total range is small', () => {
            game.fretRange = [0, 3];
            for (let i = 0; i < 10; i++) {
                game.nextChallenge();
                expect(game.currentNeighborhood).toEqual([0, 3]);
            }
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
