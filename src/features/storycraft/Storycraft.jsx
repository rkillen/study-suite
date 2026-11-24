import { useState } from "react";
import { BookmarkCheck, Download, FileText, Mic, Shuffle } from "lucide-react";
import MicControl from "../../components/MicControl.jsx";
import { useStudy } from "../../context/StudyContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { triggerDownload } from "../../lib/download.js";
import { pickAnotherIndex } from "../../lib/random.js";
import { stopCapture } from "../../lib/speech.js";
import { countWords } from "../../lib/text.js";
import { useStoryDraft } from "./StoryDraftContext.jsx";

const today = () => new Date().toISOString().slice(0, 10);

export default function Storycraft() {
  const { clientId, library, prefs, updatePrefs, progress, addStory, updateStory, removeStory } = useStudy();
  const { showToast } = useToast();
  const { draft, patchDraft, clearDraft } = useStoryDraft();

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [transcript, setTranscript] = useState("");

  const prompts = library.storyPrompts;
  const libraryPrompt = prompts.length ? prompts[prefs.storyPromptIndex % prompts.length] : "";
  const activePrompt = draft.promptOverride ?? libraryPrompt;
  const isEditing = Boolean(draft.editingId);

  const stories = progress.stories;
  const query = search.toLowerCase().trim();
  const filtered = stories.filter(
    (s) =>
      !query ||
      s.title.toLowerCase().includes(query) ||
      s.prompt.toLowerCase().includes(query) ||
      s.body.toLowerCase().includes(query)
  );

  const drawRandomPrompt = () => {
    updatePrefs({ storyPromptIndex: pickAnotherIndex(prompts.length, prefs.storyPromptIndex) });
    patchDraft({ promptOverride: null });
  };

  const saveStory = () => {
    const title = draft.title.trim() || "Untitled Story";
    const body = draft.body.trim();
    if (!body) {
      showToast("Write or dictate a narrative draft before saving.");
      return;
    }
    if (isEditing) {
      updateStory(draft.editingId, { title, prompt: activePrompt, body });
      showToast("Updated story in your Personal Story Log.");
    } else {
      addStory({ title, prompt: activePrompt, body });
      showToast("Saved story to your Personal Story Log.");
    }
    clearDraft();
  };

  const editStory = (story) => {
    patchDraft({ editingId: story.id, title: story.title, body: story.body, promptOverride: story.prompt });
  };

  const deleteStory = (id) => {
    removeStory(id);
    if (draft.editingId === id) clearDraft();
    showToast("Removed story entry.");
  };

  const insertSpokenIntoDraft = () => {
    const spoken = transcript.trim();
    if (!spoken) {
      showToast("Capture a spoken story draft first.");
      return;
    }
    const existing = draft.body.trim();
    patchDraft({ body: existing ? `${existing}\n\n${spoken}` : spoken });
    setTranscript("");
    showToast("Inserted spoken transcript into Narrative Draft.");
  };

  const toggleDrawer = () => {
    if (drawerOpen) stopCapture();
    setDrawerOpen(!drawerOpen);
  };

  const exportMarkdown = () => {
    if (!stories.length) {
      showToast("Your Story Log is currently empty.");
      return;
    }
    const lines = ["# Personal Storycraft Journal", `Client: ${clientId}`, `Exported: ${new Date().toLocaleDateString()}`, ""];
    stories.forEach((s, i) => {
      lines.push(`## ${i + 1}. ${s.title}`);
      lines.push(`*Prompt:* ${s.prompt}`);
      lines.push(`*Date:* ${new Date(s.createdAt).toLocaleDateString()}`);
      lines.push("");
      lines.push(s.body);
      lines.push("\n---\n");
    });
    triggerDownload(lines.join("\n"), `storycraft-journal-${clientId}-${today()}.md`, "text/markdown");
    showToast("Exported Story Journal (.md)");
  };

  const exportJson = () => {
    const payload = { clientId, exportedAt: new Date().toISOString(), stories };
    triggerDownload(JSON.stringify(payload, null, 2), `storycraft-log-${clientId}-${today()}.json`, "application/json");
    showToast("Exported Story Log (.json)");
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal-900">Storycraft &amp; Personal Story Log</h1>
          <p className="text-xs sm:text-sm text-charcoal-600">Draw a random prompt or refine a memory from Beachcombing into your personal story archive.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportMarkdown}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800 flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-crimson-700" /> Export Journal (.md)
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gold-600" /> Export (.json)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 studio-card rounded-2xl p-6 space-y-5">
          <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase text-gold-600">Active Story Prompt</div>
              <p className="font-serif text-base sm:text-lg font-medium text-charcoal-900">{activePrompt}</p>
            </div>
            <button
              type="button"
              onClick={drawRandomPrompt}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-alabaster-100 border border-alabaster-200 text-xs font-medium text-charcoal-800 flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5 text-crimson-700" /> Random Story Prompt
            </button>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sc-title-input" className="text-xs font-medium text-charcoal-800">Story Title</label>
            <input
              type="text"
              id="sc-title-input"
              value={draft.title}
              onChange={(e) => patchDraft({ title: e.target.value })}
              placeholder="Give this story a memorable working title..."
              className="w-full rounded-xl bg-alabaster-50 border border-alabaster-200 px-3.5 py-2.5 text-sm text-charcoal-900 focus:outline-none focus:border-crimson-700"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="sc-body-input" className="text-xs font-medium text-charcoal-800">Narrative Draft</label>
              <span className="text-[11px] font-mono text-charcoal-400">{countWords(draft.body)} words</span>
            </div>
            <textarea
              id="sc-body-input"
              rows={8}
              value={draft.body}
              onChange={(e) => patchDraft({ body: e.target.value })}
              placeholder="Write or dictate your story here..."
              className="w-full rounded-xl bg-alabaster-50 border border-alabaster-200 p-4 text-sm text-charcoal-900 leading-relaxed focus:outline-none focus:border-crimson-700"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button type="button" onClick={clearDraft} className="text-xs text-charcoal-400 hover:text-charcoal-900">
              Clear Editor
            </button>
            <button
              type="button"
              onClick={saveStory}
              className="px-5 py-2.5 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <BookmarkCheck className="w-4 h-4" /> <span>{isEditing ? "Update Story" : "Save to Story Log"}</span>
            </button>
          </div>

          <div className="pt-4 border-t border-alabaster-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={toggleDrawer} className="text-xs font-medium text-crimson-700 hover:text-crimson-800 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                <span>{drawerOpen ? "Hide Speak & Capture Aloud" : "Open Speak & Capture Aloud"}</span>
              </button>
              <span className="text-[11px] font-mono text-charcoal-400">Tell the story aloud to transcribe</span>
            </div>

            {drawerOpen && (
              <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <MicControl id="sc" idleLabel="Tell Story Aloud" text={transcript} onText={setTranscript} />
                  <button
                    type="button"
                    onClick={insertSpokenIntoDraft}
                    className="px-3.5 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-white text-xs font-medium"
                  >
                    Insert into Narrative Draft
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Speak your story naturally—your live transcript will appear here..."
                  className="w-full rounded-xl bg-white border border-alabaster-200 p-3 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-crimson-700"
                />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 studio-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-charcoal-900">Personal Story Log</h2>
              <span className="text-xs font-mono text-charcoal-400">
                {stories.length} {stories.length === 1 ? "entry" : "entries"}
              </span>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved stories..."
              className="w-full rounded-xl bg-alabaster-50 border border-alabaster-200 px-3.5 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-crimson-700"
            />

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="p-6 rounded-xl bg-alabaster-50 border border-alabaster-200 text-center text-xs text-charcoal-400">
                  No stories logged yet. Draft a story on the left or send a memory from Beachcombing.
                </div>
              ) : (
                filtered.map((story) => (
                  <div key={story.id} className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-serif text-base font-semibold text-charcoal-900 leading-snug">{story.title}</div>
                        <div className="text-[11px] font-mono text-charcoal-400">
                          {new Date(story.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => editStory(story)} className="text-xs text-crimson-700 hover:underline">Edit</button>
                        <button type="button" onClick={() => deleteStory(story.id)} className="text-xs text-charcoal-400 hover:text-charcoal-900">Delete</button>
                      </div>
                    </div>
                    <div className="text-[11px] text-charcoal-600 italic line-clamp-1">{story.prompt}</div>
                    <p className="text-xs text-charcoal-800 leading-relaxed line-clamp-3">{story.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
