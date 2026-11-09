# Evidence-led principles for Fork's cookbook and editor

Research date: 8 November 2026. Scope: visual and interaction direction for a beautifully edited cookbook with the precision of a great productivity app. No application code or live UI was audited for this note.

Evidence labels: **Empirical** means a reported study, with its context and limitations; **normative** means a WCAG success criterion; **guidance** means an originating researcher, platform owner, or design-system team's recommendation; **judgment** means a proposed Fork decision to test. These categories are not interchangeable. The palette supplied in the assignment is project context, not externally verified evidence.

## 1. What supports a restrained, photographic cookbook aesthetic?

### Takeaway

Keep the warm neutral direction and use strong color purposefully, provisionally. Evidence supports consistent signaling, readable hierarchy, and reducing visual competition; it does not establish beige, serif typography, or a particular accent ratio as universally optimal. Aesthetic quality and successful task performance need separate evaluation.

### Cited Findings

- **Empirical, perceived usability:** Tractinsky, Katz, and Ikar's 2000 experiment used a simulated ATM. Perceived aesthetics and perceived usability correlated before and after use; aesthetic manipulation influenced post-use perceptions. This concerns judgments of usability, not proof that attractive interfaces eliminate errors or make every task faster. [Original article abstract, Ben-Gurion University](https://cris.bgu.ac.il/en/publications/what-is-beautiful-is-usable-2/)
- **Empirical, important counterevidence:** Tuch and colleagues' 2012 online-shop experiment found no effect of aesthetics on perceived usability; actual usability influenced some post-use aesthetic judgments. Its limits include one product, goal-directed shopping tasks, and deliberately constrained aesthetic manipulation. The authors explicitly describe the wider causal evidence as mixed. [Original paper, university-hosted PDF, pp. 1596–1607](https://bpb-us-e1.wpmucdn.com/wp.wwu.edu/dist/8/2868/files/2018/04/Tuch-et-al-2012-Is-Beautiful-Usable-2don1em.pdf)
- **Empirical, visual search:** Rosenholtz, Li, and Nakano developed and tested visual-clutter measures. Their work concerns how feature congestion and scene organization relate to search difficulty; it does not provide a universal maximum number of cards, colors, or controls. [Original research abstract, Measuring visual clutter, 2007](https://pubmed.ncbi.nlm.nih.gov/18217832/)
- **Platform guidance:** Apple recommends consistent meanings for color, warns that styling noninteractive text like an interactive accent can confuse users, and advises considering the effect of nearby artwork. Color should have redundant labels or shapes when it carries information. [Apple HIG: Color](https://developer.apple.com/design/human-interface-guidelines/color)
- **Platform guidance:** Apple's design principles distinguish simplicity from minimalism: keep important functions available, use recognizable controls, and establish clear hierarchy. This is useful direction, not experimental proof of an aesthetic style. [Apple HIG: Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles/)
- **Empirical, typography:** Wallace and colleagues compared normalized fonts in remote reading studies. Different fonts worked best for different individuals, and preference did not predict reading speed. Their short-passage reading setting is relevant but not equivalent to glancing at quantities while cooking. It cannot select Fork's typeface or establish a universal serif-versus-sans winner. [Original accepted paper, Towards Individuated Reading Experiences](https://shaunwallace.org/files/Readability__TOCHI.pdf)
- **Design-system guidance:** GOV.UK recommends sentence-case button labels describing the action, and limiting competing primary buttons. Its public-service context differs from a cookbook, but the principle transfers to editor actions. [GOV.UK Design System: Button](https://design-system.service.gov.uk/components/button/)

### Inferences

The following are **design judgments and proposed acceptance rules**, not study findings:

1. **Retain the palette as a hypothesis.** Paper `#f7f3ec`, espresso `#1a1408`, ink `#1a1714`, clay `#b23c00`, and marigold `#eca620` form a plausible warm editorial vocabulary. The useful question is whether each color has a clear role on actual screens. Do not turn the observation into “science proves warm palettes feel trustworthy.”
2. **Give photography the expressive range.** Let recipe images supply most large-area color; keep surrounding navigation and reading surfaces quiet. Avoid decorative competing color blocks unless they communicate something. Test both a richly colored dish and a pale dish, missing images, and imperfect user photos. The page must remain coherent without a professional photograph.
3. **Reserve clay for purposeful interaction emphasis.** Use the strongest filled treatment for the principal action in the current task context; subordinate routine alternatives by weight or outline. A page may have more than one actionable region, so “one primary action” is a hierarchy heuristic, not a literal global quota. Never make every tag, icon, heading, and status badge equally prominent.
4. **Give marigold a distinct, limited role.** A small editorial highlight or selected-state accent is plausible. Do not make it simultaneously mean selection, warning, and successful saving. Use text/icon cues for statuses; measure each foreground/background pair before approving it.
5. **Express cookbook character in titles and editorial passages; keep task text direct.** A restrained display serif is a taste decision worth exploring. Quantities, units, ingredient names, controls, validation, and save status must remain quickly readable at their actual rendered size. Test `1`, `l`, fractions, ranges, degree signs, long ingredient names, and wrapped instructions. Do not impose a new typeface solely because a study found it fast in another context.
6. **Build hierarchy from grouping and type before adding boxes.** Related ingredient fields should read as one row; section headings should distinguish ingredients from method; secondary metadata should recede through placement and weight without becoming faint. Common actions need visible labels unless an icon's meaning is demonstrated in testing. “Save recipe” or a more accurate action name is preferable to ambiguous “Done.”
7. **Review paired screens, not isolated components.** Browse, recipe reading, editing, error, and narrow-screen states should share typographic roles and action semantics. The success criterion is a recognizable family with clear task priority, not matching another app's visual signature.

### Gaps

- No reviewed study validates this exact palette, an ideal number of accents, a perfect line length, or a single best type scale for Fork. No evidence here establishes that photographic dominance improves cooking outcomes.
- The supplied earlier measurement of ink3 `#6f6960` against a deeper hero surface was approximately **4.46:1**. The hero background value and rendered context were not independently checked here. Treat it as a flagged pair to verify, not a full accessibility audit or a reason to replace the entire palette.
- Apple typography and motion pages returned JavaScript shells; their Markdown links could not be fetched through the web tool. Typography recommendations above rely on the accessible original research, not unread Apple text. The MIT lab's clutter page failed on full-page fetch; the claim uses the original article's accessible abstract, not an invented full-text interpretation.

## 2. How should the editor and cooking experience preserve clarity, control, and access?

### Takeaway

Precision comes from predictable operations, visible save state, and recovery, as much as from clean alignment. Make essential controls easy to find; disclose less frequent operations without hiding the user's work or its persistence state. Use accessibility standards as a floor and real device use to evaluate comfort.

### Cited Findings

- **Originating researcher guidance:** Nielsen's heuristics recommend visible system status, user language, recognition rather than recall, error prevention, clear exits, and recovery. They are broad rules of thumb, not independent experimental effect estimates for every implementation. [Nielsen: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- **Originating researcher guidance:** Progressive disclosure depends on putting frequent needs in the initial view and making the route to secondary features obvious and accurately labeled. Nielsen distinguishes it from a wizard; staged flows are problematic when users need to alternate between interdependent steps. [Nielsen: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- **Platform guidance:** Apple recommends making undo outcomes predictable, naming the operation where helpful, and preserving standard undo/redo conventions. Native gestures and menu placements do not transfer literally to every web app. [Apple HIG: Undo and redo](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo?changes=__4_3)
- **Normative baseline, selected criteria only:** WCAG 2.2 requires keyboard operation (2.1.1, A), visible focus (2.4.7, AA), focus not entirely hidden by author content (2.4.11, AA), non-drag alternatives where dragging is nonessential (2.5.7, AA), and appropriate accessible names/roles/values (4.1.2, A). Reflow at a 320 CSS-pixel equivalent width is AA, with exceptions for necessary two-dimensional content; 200% text resizing is AA. Relevant non-text component/state information generally needs 3:1 contrast under 1.4.11. The more specific focus-area/contrast rule in 2.4.13 is **AAA**, not AA. Status messages have programmatic requirements under 4.1.3, AA. This is a selected checklist, not complete conformance. [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)
- **Normative criterion with informative explanation:** Normal text generally needs 4.5:1 contrast; qualifying large text needs 3:1. Thresholds cannot be rounded upward. W3C also cautions that thin rendered fonts may be less legible than their nominal contrast suggests and recommends exceeding minimums in such cases. Thus a verified 4.46:1 pair would fail the normal-text threshold. [W3C: Understanding Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- **Normative criterion with informative explanation:** WCAG 2.5.8's AA target minimum is 24×24 CSS pixels, subject to enumerated spacing and other exceptions. That number is not a touch-comfort optimum. W3C explains why target size and spacing help people with reduced precision. [W3C: Understanding Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- **Browser-vendor guidance:** WebKit describes problematic motion patterns, including scaling, parallax, and continuous peripheral motion, and demonstrates adapting them with `prefers-reduced-motion`. It explicitly preserves useful direct manipulation rather than requiring all visual feedback to disappear. [WebKit: Responsive Design for Motion](https://webkit.org/blog/7551/responsive-design-for-motion/)

### Inferences

**Proposed product rules; validate against existing behavior before implementation:**

| Area | Acceptance criterion for Fork |
| --- | --- |
| Common editing | A new user can identify title, ingredients, instructions, and the operation that finishes the current edit without opening a hidden toolbar. Related fields stay near one another; routine ingredient/method editing does not require repeated wizard navigation. |
| Advanced operations | History, comparison, and less common metadata can occupy secondary areas, with recognizable labels. Do not classify a feature as “advanced” merely because its UI is difficult; task evidence should determine frequency and importance. |
| Save semantics | The screen accurately distinguishes unsaved, saving, saved, and failed states where applicable. “Saved” appears only when the corresponding persistence succeeded. If drafts and published versions differ, the interface names that distinction in ordinary language. |
| Failure and recovery | Simulated save failure preserves entered content and offers a comprehensible retry path. Retry does not duplicate an operation. Navigation away with unsaved work follows an explicit, tested preservation or warning policy. Do not imply offline or cross-device protection without implementing it. |
| Reversal | Users can recover from an accidental row removal or reorder through the supported mechanism. A recovery message names what happened. Version-history restoration and field-level undo should not be presented as identical operations. |
| Focus and input | Finish add/edit/reorder/remove/save flows using only a keyboard, with sensible focus after each structural change. A drag handle has a non-drag path. Sticky controls do not hide the focused item; dialogs return focus appropriately. |
| Touch comfort | Frequently used cooking and editing targets should deliberately exceed the minimum when space permits. A roughly 44 CSS-pixel hit-area prototype is a reasonable initial design choice to test, **not** a proven optimum or a claim that Apple points equal CSS pixels. Keep neighboring destructive targets well separated. |
| Cooking layout | At narrow widths and enlarged text, quantity stays associated with its ingredient and step order remains clear. Avoid horizontal scanning between distant columns. Keep a stable place in long instructions after ordinary interaction. Test at counter distance, one-handed, in varied light; these contexts are hypotheses to investigate, not observations already made. |
| Motion | Use motion only when it clarifies an action or location change. No decorative continuous motion beside instructions. Reduced-motion mode retains immediate state feedback without spatial travel or scaling effects. Do not delay repeated input for decorative animation. |

### Gaps

- This note does not verify which save, undo, draft, reorder, or version-restoration behaviors Fork currently supports. The rules are requirements to assess, not allegations that those features are broken or requests to build every mechanism.
- Contrast must be checked for actual pairings and states: text, links, placeholders, errors, focus, selected controls, images, and overlays. Token values alone cannot establish conformance.
- No source reviewed establishes kitchen-specific ideal type size, target size, or motion duration. Responsive and cooking recommendations need device observation, including users with accessibility needs.

## 3. How can a small study test the direction without pretending to prove it?

### Takeaway

Use small formative sessions to discover concrete failures and revise the design. Record aesthetic reaction separately from task success and recovery. Include people outside the founder's friends so the study does not only reflect familiarity with the product or reluctance to criticize it.

### Cited Findings

- Nielsen recommends combining feature-use data with observation because visits can reflect mistakes as well as intentional use. This supports watching what participants do, rather than treating clicks or preference votes as sufficient. [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- The differing results of the simulated-ATM and online-shop experiments justify separating impressions from observed usability and reporting context. Neither experiment predicts which Fork design wins. [Tractinsky et al.](https://cris.bgu.ac.il/en/publications/what-is-beautiful-is-usable-2/); [Tuch et al.](https://bpb-us-e1.wpmucdn.com/wp.wwu.edu/dist/8/2868/files/2018/04/Tuch-et-al-2012-Is-Beautiful-Usable-2don1em.pdf)

### Inferences

**Practical formative research plan, proposed rather than evidence of an optimal sample:**

1. Pilot the wording and prototype with two friends who cook. Then run four to six separately recruited nonfriends with relevant recipe habits, varied devices, and differing confidence with digital tools. Include keyboard or assistive-technology users where feasible; do not treat simulated impairment as a substitute. Adjust recruitment to the people Fork actually intends to serve.
2. Test realistic tasks: find a recipe for dinner; locate a quantity and the next step; change servings if supported; edit ingredients and a method step; recognize what is saved; recover from an accidental removal; recover from an injected save failure. Include one brief interruption during recipe reading, then observe whether the participant resumes correctly.
3. Have participants act before asking whether they like the screen. Use neutral prompts and avoid explaining controls. Record completion without help, incorrect actions, assistance, abandonment, recovery success, and participants' explanation of persistence state. Time can help diagnose friction, but small-sample timings are not population performance estimates.
4. Compare the current direction with one restrained alternative using identical content and task capability. Counterbalance order where practical. Ask separate questions about visual appeal, readability, what attracts attention, and confidence that changes are safe. Preference and success may disagree; keep both observations.
5. Prioritize a failure that loses work or makes users believe unsaved work is safe above ornamental preference. Fix blocked common tasks and recovery failures before polishing secondary decoration. Re-test the changed flows with new participants where possible.
6. Deliver a compact record: task, observed behavior, consequence, evidence quote or clip, proposed change, and what to re-test. Report “3 of these 6 participants missed Save,” not “50% of users cannot save.” No statistical significance or generalized conversion claims from this study.

### Gaps

- The proposed sample is a budget-sized discovery round, not a representative survey, accessibility certification, or saturation guarantee. Friends and recruited nonfriends both have selection biases.
- No sessions were conducted for this note. There is no basis yet to claim increased speed, retention, confidence, or cooking success from the proposed visual direction.
- Research does not decide the final aesthetic. The defensible choice is a taste direction constrained by legibility and observed behavior, with unresolved assumptions kept visible.
