import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getNoteAt, isCorrectNote, GameState, NOTES } from '../fretboard.js';

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

    it('should respect fret range scaffolding', () => {
        game.fretRange = [0, 3];
        for (let i = 0; i < 50; i++) {
            game.nextChallenge();
            expect(game.currentChallenge.fret).toBeGreaterThanOrEqual(0);
            expect(game.currentChallenge.fret).toBeLessThanOrEqual(3);
        }
    });
});
