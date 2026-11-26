# Context

"Context" is information that many screens need, kept in one place instead of being passed around by hand.

- `AuthContext.tsx`: who is signed in, whether they are allowed, and whether they are an admin. Screens before the app opens use `useAuth()`; everything inside the app uses `useSignedIn()`, which guarantees there is a user and profile. It also provides `signIn` and `signOut`.
- `StudyContext.tsx`: the current client (taken from the person's profile), the shared library, the client's profile, the person's progress
  and settings, and the actions that change them. Screens read it with `useStudy()`.
- `ToastContext.tsx`: the little black notification at the bottom right. Show one with
  `const { showToast } = useToast(); showToast("Saved!")`.

The story being written lives next to the Storycraft screen (`features/storycraft/StoryDraftContext.tsx`),
because Beachcombing also needs to hand a memory over to it.
