import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_FEED_POSTS } from '../data/defaultFeedPosts';
import { FeedPost } from '../types/feedPost';

const CACHE_KEY = 'pb_feed_posts_cache';
const ENABLED_CACHE_KEY = 'pb_actualites_enabled';
const DELETED_DEFAULTS_CACHE_KEY = 'pb_feed_deleted_defaults';

const DEFAULT_POST_IDS = new Set(DEFAULT_FEED_POSTS.map((p) => p.id));

function sortPostsByDateDesc(items: FeedPost[]): FeedPost[] {
  return [...items].sort((a, b) => {
    const timeA = Date.parse(a.publishedAt || '') || 0;
    const timeB = Date.parse(b.publishedAt || '') || 0;
    return timeB - timeA;
  });
}

function readCachedDeletedDefaults(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_DEFAULTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    }
  } catch {}
  return [];
}

function buildMergedPosts(fsPosts: FeedPost[], deletedDefaultIds: string[]): FeedPost[] {
  const fsIds = new Set(fsPosts.map((p) => p.id));
  const deletedSet = new Set(deletedDefaultIds);
  const remainingDefaults = DEFAULT_FEED_POSTS.filter(
    (def) => !fsIds.has(def.id) && !deletedSet.has(def.id)
  );
  return sortPostsByDateDesc([...fsPosts, ...remainingDefaults]);
}

export function useFeedPosts() {
  const [sectionEnabled, setSectionEnabled] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem(ENABLED_CACHE_KEY);
      if (cached === 'false') return false;
      if (cached === 'true') return true;
    } catch {}
    return true;
  });

  const deletedDefaultsRef = useRef<string[]>(readCachedDeletedDefaults());
  const firestorePostsRef = useRef<FeedPost[] | null>(null);

  const [posts, setPosts] = useState<FeedPost[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as FeedPost[];
        if (Array.isArray(parsed)) {
          const deletedSet = new Set(readCachedDeletedDefaults());
          return sortPostsByDateDesc(parsed.filter((p) => !deletedSet.has(p.id)));
        }
      }
    } catch {}
    return buildMergedPosts([], readCachedDeletedDefaults());
  });

  const [loading, setLoading] = useState(true);

  const syncMergedState = useCallback((fsPosts: FeedPost[] | null, deletedIds: string[]) => {
    const merged = buildMergedPosts(fsPosts || [], deletedIds);
    setPosts(merged);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
    } catch {}
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubPosts: (() => void) | undefined;
    let unsubSetting: (() => void) | undefined;

    const initListeners = async () => {
      try {
        const { collection, doc, query, orderBy, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('../firebase');

        // 1. Real-time listener for section visibility & deleted default IDs
        unsubSetting = onSnapshot(
          doc(db, 'settings', 'actualites'),
          (snap) => {
            if (!isMounted) return;
            if (snap.exists()) {
              const data = snap.data();
              const enabled = data.enabled !== false;
              setSectionEnabled(enabled);
              try {
                localStorage.setItem(ENABLED_CACHE_KEY, String(enabled));
              } catch {}

              if (Array.isArray(data.deletedDefaultIds)) {
                const remoteDeleted = data.deletedDefaultIds.map(String);
                deletedDefaultsRef.current = remoteDeleted;
                try {
                  localStorage.setItem(DELETED_DEFAULTS_CACHE_KEY, JSON.stringify(remoteDeleted));
                } catch {}
                if (firestorePostsRef.current !== null) {
                  syncMergedState(firestorePostsRef.current, remoteDeleted);
                } else {
                  syncMergedState([], remoteDeleted);
                }
              }
            }
          },
          (err) => {
            console.warn('Actualites setting sync notice:', err);
          }
        );

        // 2. Real-time listener for feed posts
        const q = query(collection(db, 'feed_posts'), orderBy('publishedAt', 'desc'));

        unsubPosts = onSnapshot(
          q,
          (snapshot) => {
            if (!isMounted) return;

            const fetched: FeedPost[] = snapshot.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                content: String(d.content || ''),
                category: String(d.category || 'Actualité Chantier'),
                location: d.location ? String(d.location) : undefined,
                mediaType: (d.mediaType as FeedPost['mediaType']) || 'none',
                mediaUrl: d.mediaUrl ? String(d.mediaUrl) : undefined,
                videoPosterUrl: d.videoPosterUrl ? String(d.videoPosterUrl) : undefined,
                dateLabel: String(d.dateLabel || ''),
                publishedAt: String(d.publishedAt || new Date().toISOString()),
                ctaType: (d.ctaType as FeedPost['ctaType']) || 'none',
                ctaUrl: d.ctaUrl ? String(d.ctaUrl) : undefined,
                sourceTag: d.sourceTag ? String(d.sourceTag) : undefined
              };
            });

            firestorePostsRef.current = fetched;
            syncMergedState(fetched, deletedDefaultsRef.current);
            setLoading(false);
          },
          (error) => {
            console.warn('Feed posts sync notice:', error);
            if (isMounted) setLoading(false);
          }
        );
      } catch (err) {
        console.warn('Feed posts init notice:', err);
        if (isMounted) setLoading(false);
      }
    };

    initListeners();

    return () => {
      isMounted = false;
      if (unsubPosts) unsubPosts();
      if (unsubSetting) unsubSetting();
    };
  }, [syncMergedState]);

  const toggleSectionEnabled = async (enabled: boolean, adminCode: string | null) => {
    setSectionEnabled(enabled);
    try {
      localStorage.setItem(ENABLED_CACHE_KEY, String(enabled));
    } catch {}

    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await setDoc(
        doc(db, 'settings', 'actualites'),
        {
          enabled,
          updatedAt: new Date().toISOString(),
          adminCode: adminCode || ''
        },
        { merge: true }
      );
      fetch('/api/seo/refresh-feed-cache', { method: 'POST' }).catch(() => {});
      return true;
    } catch (error) {
      console.error('Failed to update actualites section visibility:', error);
      return false;
    }
  };

  const saveFeedPost = async (post: FeedPost, adminCode: string | null) => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      const sanitizedPayload = {
        content: post.content.slice(0, 2000),
        category: (post.category || 'Actualité Chantier').slice(0, 80),
        location: (post.location || '').slice(0, 100),
        mediaType: post.mediaType || 'none',
        mediaUrl: post.mediaUrl || '',
        videoPosterUrl: post.videoPosterUrl || '',
        dateLabel: (post.dateLabel || '').slice(0, 40),
        publishedAt: (post.publishedAt || new Date().toISOString()).slice(0, 40),
        ctaType: post.ctaType || 'none',
        ctaUrl: (post.ctaUrl || '').slice(0, 300),
        sourceTag: (post.sourceTag || '').slice(0, 60),
        adminCode: adminCode || ''
      };

      await setDoc(doc(db, 'feed_posts', post.id), sanitizedPayload, { merge: true });

      // If this was a previously deleted default post being restored/edited, remove from deletedDefaultIds
      if (deletedDefaultsRef.current.includes(post.id)) {
        const nextDeleted = deletedDefaultsRef.current.filter((id) => id !== post.id);
        deletedDefaultsRef.current = nextDeleted;
        try {
          localStorage.setItem(DELETED_DEFAULTS_CACHE_KEY, JSON.stringify(nextDeleted));
        } catch {}
        await setDoc(
          doc(db, 'settings', 'actualites'),
          { deletedDefaultIds: nextDeleted, adminCode: adminCode || '' },
          { merge: true }
        );
      }

      const currentFs = firestorePostsRef.current || [];
      const exists = currentFs.some((p) => p.id === post.id);
      const nextFs = exists ? currentFs.map((p) => (p.id === post.id ? post : p)) : [post, ...currentFs];
      firestorePostsRef.current = nextFs;
      syncMergedState(nextFs, deletedDefaultsRef.current);
      fetch('/api/seo/refresh-feed-cache', { method: 'POST' }).catch(() => {});

      return true;
    } catch (error) {
      console.error('Failed to save feed post:', error);
      return false;
    }
  };

  const deleteFeedPost = async (postId: string, adminCode: string | null) => {
    try {
      const { doc, deleteDoc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      // Always attempt deleting from feed_posts (in case it was edited/saved in Firestore)
      await deleteDoc(doc(db, 'feed_posts', postId));

      // If it is one of the pre-seeded default posts, persist its deletion in settings/actualites
      if (DEFAULT_POST_IDS.has(postId)) {
        const nextDeleted = Array.from(new Set([...deletedDefaultsRef.current, postId]));
        deletedDefaultsRef.current = nextDeleted;
        try {
          localStorage.setItem(DELETED_DEFAULTS_CACHE_KEY, JSON.stringify(nextDeleted));
        } catch {}
        await setDoc(
          doc(db, 'settings', 'actualites'),
          {
            deletedDefaultIds: nextDeleted,
            updatedAt: new Date().toISOString(),
            adminCode: adminCode || ''
          },
          { merge: true }
        );
      }

      const currentFs = firestorePostsRef.current || [];
      const nextFs = currentFs.filter((p) => p.id !== postId);
      firestorePostsRef.current = nextFs;
      syncMergedState(nextFs, deletedDefaultsRef.current);
      fetch('/api/seo/refresh-feed-cache', { method: 'POST' }).catch(() => {});

      return true;
    } catch (error) {
      console.error('Failed to delete feed post:', error);
      return false;
    }
  };

  return { posts, loading, sectionEnabled, toggleSectionEnabled, saveFeedPost, deleteFeedPost };
}
