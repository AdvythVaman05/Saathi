# User Experience (UX) Specification - Saathi

This specification documents interaction guidelines, localized voice commands, sonic feedback parameters, and screen reader announcements.

---

## 1. Visual & Layout Constraints

### 1.1 Touch & Click Targets
- **Minimum Target Size:** All buttons, toggles, and inputs must have a minimum interactive dimension of **48px x 48px**.
- **Target Spacing:** Minimum gap of **12px** between interactive targets.

### 1.2 Contrast & Typography
- **Atkinson Hyperlegible:** Used for all text to maximize character distinction.
- **WCAG compliance:** Standard contrast ratio target is **7:1** (WCAG AAA) for body text and **4.5:1** for large text.

### 1.3 Focus Indicators
- Never use `outline: none`.
- Custom high-visibility focus ring: `outline: 4px solid var(--focus-ring-color)`, with `outline-offset: 4px`. Focus contrast minimum is **4.5:1**.

---

## 2. Centralized Voice Command Registry

We prohibit inline command matching inside React components. All matching rules must flow through the central command registry located in:
`frontend/src/features/voice-engine/commands/`

This registry maps raw transcripts into normalized command tokens.

### 2.1 Multilingual Command Mappings

Below is the linguistic command registry dictionary:

| Command Token | English Phrases | Hindi Phrases (Devanagari & Latin) | Telugu Phrases (Telugu Script & Latin) |
|---|---|---|---|
| **`repeat`** | `"repeat"`, `"say again"` | `"दोहराओ"`, `"dohrao"`, `"fir se bolo"` | `"మళ్ళీ చెప్పు"`, `"malli cheppu"` |
| **`back`** | `"back"`, `"go back"` | `"पीछे जाओ"`, `"piche jao"`, `"wapas"` | `"వెనక్కి వెళ్ళు"`, `"venakki vellu"` |
| **`skip`** | `"skip"`, `"pass"` | `"छोड़ो"`, `"chodo"`, `"skip karo"` | `"దాటవేయి"`, `"daataveyi"`, `"skip chey"` |
| **`help`** | `"help"`, `"instructions"`| `"मदद"`, `"madad"`, `"sahaayata"` | `"సహాయం"`, `"sahaayam"` |
| **`pause`** | `"pause"`, `"stop"` | `"रोको"`, `"roko"`, `"ruko"` | `"ఆపు"`, `"aapu"` |
| **`resume`**| `"resume"`, `"continue"`| `"शुरू करो"`, `"shuru karo"`, `"chalu karo"` | `"మళ్ళీ ప్రారంభించు"`, `"malli prarambhinchu"` |
| **`exit`** | `"exit"`, `"close"`, `"quit"`| `"बाहर निकलो"`, `"bahar jao"`, `"band karo"`| `"బయటికి వెళ్ళు"`, `"bayatiki vellu"` |

---

## 3. Auditory Feedback Cues (Sound Design)

1. **Wake/Listening Start Cue**
   - **Sound:** Short double chime, middle C (261.63Hz) followed by E (329.63Hz), duration 150ms.
   - **Trigger:** Played exactly when the microphone starts listening for user input.
2. **Processing/Recognizing Cue**
   - **Sound:** Low periodic ticking, G (196.00Hz), pulsed every 500ms.
   - **Trigger:** Played while the speech recognition engine processes the transcription.
3. **Success/Confirmation Cue**
   - **Sound:** Bright, ascending triad chord, C-E-G (261.63Hz - 329.63Hz - 392.00Hz), duration 300ms.
   - **Trigger:** Played when an answer is successfully confirmed and saved.
4. **Error/Retry Cue**
   - **Sound:** Short descending dual tone, F (174.61Hz) to D (146.83Hz), duration 250ms.
   - **Trigger:** Played when confidence is low or speech input is invalid.
5. **Session Complete Cue**
   - **Sound:** Warm ascending arpeggio, C-E-G-C (Octave up), duration 600ms.
   - **Trigger:** Played on completing the entire survey.

---

## 4. Screen Reader Strategy (Aria Announcements)

- **Aria-Live Regions:**
  - A persistent, hidden element with `role="status"` and `aria-live="polite"` handles standard layout and step updates.
  - An element with `role="alert"` and `aria-live="assertive"` handles critical notifications.
- **Focus Relocation:**
  - When moving to a new question, focus must be programmatically shifted to the wrapper element of the new question container (which has `tabindex="-1"` and a descriptive `aria-labelledby`).
- **Form Controls:**
  - All radio buttons and checkbox choices must be wrapped inside a `<fieldset>` with a `<legend>` containing the question text. This ensures screen readers read the question context when navigating between options.
