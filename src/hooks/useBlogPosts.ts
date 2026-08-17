import { useState, useEffect } from 'react';
import { DEFAULT_BLOG_POSTS, BlogPost } from '../data/blogData';

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    try {
      const cached = localStorage.getItem('pb_blog_cache');
      return cached ? JSON.parse(cached) : DEFAULT_BLOG_POSTS;
    } catch { return DEFAULT_BLOG_POSTS; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { collection, query, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const qArticles = query(collection(db, 'articles'));
        const snapshot = await getDocs(qArticles);
        
        if (!isCancelled) {
          let updatedPosts = DEFAULT_BLOG_POSTS;
          if (!snapshot.empty) {
            const fetchedPosts: BlogPost[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                slug: data.slug || docSnap.id,
                title: data.title || '',
                category: data.category || 'Conseils',
                excerpt: data.excerpt || '',
                readingTime: data.readingTime || '5 min de lecture',
                date: data.date || 'Août 2026',
                imageUrl: data.imageUrl || '',
                author: data.author || 'Conseils Plâtrerie',
                content: Array.isArray(data.content) ? data.content : [data.content || '']
              };
            });

            const firestoreIds = new Set(fetchedPosts.map(p => p.id));
            const firestoreSlugs = new Set(fetchedPosts.map(p => p.slug));
            
            const mergedDefaults = DEFAULT_BLOG_POSTS.filter(
              def => !firestoreIds.has(def.id) && !firestoreSlugs.has(def.slug)
            );

            updatedPosts = [...fetchedPosts, ...mergedDefaults];
          }
          setPosts(updatedPosts);
          try { localStorage.setItem('pb_blog_cache', JSON.stringify(updatedPosts)); } catch {}
          setLoading(false);
        }
      } catch (error) {
        console.warn("Blog posts load notice:", error);
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }, 2000);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const savePost = async (post: BlogPost) => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const docRef = doc(db, 'articles', post.id);
      await setDoc(docRef, {
        slug: post.slug,
        title: post.title,
        category: post.category,
        excerpt: post.excerpt,
        readingTime: post.readingTime,
        date: post.date,
        imageUrl: post.imageUrl,
        author: post.author,
        content: post.content,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error("Failed to save article:", err);
      return false;
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await deleteDoc(doc(db, 'articles', postId));
      setPosts(prev => prev.filter(p => p.id !== postId));
      return true;
    } catch (err) {
      console.error("Failed to delete article:", err);
      return false;
    }
  };

  return { posts, loading, savePost, deletePost };
}

