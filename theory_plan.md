# Plan: Fretboard Theory Hacks

## Vision
Move away from "academic" scale memorization. Instead, provide visual "shortcuts" and "hacks" that help users navigate the neck using landmarks and interval patterns.

## Content Roadmap: The "Aha!" Moments

### 1. The Octopus (Octave Shapes)
- **Concept:** How to find the same note anywhere using 3 simple finger shapes.
- **Hack:** The "2-over-2-down" rule for the low strings and the "3-over-2-down" for the high strings.
- **Interactive:** User clicks a note, and the app highlights all its octaves across the neck.

### 2. The Big Note Discovery (Reference Landmarks)
- **Concept:** Stop counting from the nut.
- **Hack:** Memorizing just the E and A string notes (the "Power Chord" roots) and the 12th fret "Double Dot" reset.
- **Interactive:** Highlighting the "Anchor Strings" vs the "Discovery Strings".

### 3. The Unison Jump (The Tuning Hack)
- **Concept:** The relationship between adjacent strings.
- **Hack:** Every string is a 4th apart (5 frets), except the G-B string (4 frets).
- **Interactive:** Drag a shape across strings and see how it "breaks" or "shifts" at the B string.

### 4. The Foundation (Major & Chromatic)
- **Concept:** The "Whole-Whole-Half" pattern.
- **Hack:** Visualizing the major scale as a single-string "ladder" before moving to shapes.

## Technical Implementation

### UI Structure
- **Theory View:** A vertical scrolling feed of "Hack Cards".
- **Interactive Diagram:** A dedicated mini-fretboard at the top of each card that updates based on the concept being explained.
- **Aesthetic:** Clean, Headspace-style illustrations using SVG.

### State Management
- Add a `TheoryState` to track which lesson the user is viewing.
- Reuse `FretboardUI` but with a new `highlightMode` that allows drawing shapes (triangles/squares) between notes.

## Next Steps
1. Create the `theory-view` HTML container.
2. Implement the "Octave Finder" as the first interactive hack.
3. Add navigation logic to the "Fretboard Theory" menu item.
