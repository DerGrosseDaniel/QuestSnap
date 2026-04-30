1. Tech Stack & Setup

    Framework: Next.js (React) for a modern, fast web application.
    Styling: Tailwind CSS for a minimalist, dark-themed UI.
    Icons: Lucide-React for simple, clean iconography.
    Randomization: seedrandom library to ensure that entering the same seed word results in the exact same sequence of prompts for different users.

2. The Prompt Engine

    Creative Prompts: I will curate a large collection of prompts that can be attempted anywhere (e.g., "Something that casts a long shadow," "A texture that looks like a map," "Something older than you").
    Modes:
        Random: Purely random selection.
        Seeded: Users enter a "Seed Word". The prompt sequence is determined by this word.
    Timer: A 5-minute countdown will be visible. When it hits zero, the app automatically cycles to the next prompt in the sequence.

3. Custom Camera Interface

    Viewfinder: A clean, full-screen camera feed.
    Overlays: The current prompt and the countdown timer will be clearly visible but non-intrusive.
    Trigger: A single, simple shutter button. No extra settings or clutter.

4. Image "Burning" & Auto-Save

    Processing: When a photo is taken, the app will use a hidden canvas to combine the image with a stylized bottom banner.
    Aesthetic: The banner will have a nostalgic, "analogue camera" look—specifically using an orange, neon seven-segment display style for the prompt text, similar to old film date stamps.
    Auto-Save: The final image (with the banner) will automatically trigger a download to your device's camera roll/downloads folder.
    Local Gallery: The image and prompt will also be saved to the browser's local storage (IndexedDB) so they can be accessed later within the app.

5. Gallery & Prompt Management

    Gallery: A dedicated space to scroll through all the photos you've taken, showing the prompt associated with each.
    Prompt Editor: A settings page with a large text area where you can see all current prompts, edit them, or paste in a new set (one per line) to fully customize the game.
    Seed Management: A simple input field to set or change the active seed word.

6. Minimalist Design

    Dark Mode: Deep blacks and dark greys to make the photos pop.
    Space Efficient: No bulky headers or footers; the image and the prompt are the stars of the show.