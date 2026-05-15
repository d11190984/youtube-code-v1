export interface DownloadedVideo {
  id: string; // assetId or playbackId
  title: string;
  thumbnailUrl: string | null;
  duration: number;
  authorName: string;
  authorImageUrl: string;
  downloadedAt: number;
  size: number;
  playbackId: string;
}

const DB_NAME = "NewTubeDownloads";
const STORE_NAME = "videos";
const CACHE_NAME = "video-downloads-cache";

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const downloadManager = {
  async saveVideo(video: DownloadedVideo, blob: Blob) {
    const db = await initDB();
    const cache = await caches.open(CACHE_NAME);

    // 1. Save video file to Cache API
    const videoUrl = `/offline-video/${video.playbackId}.mp4`;
    await cache.put(videoUrl, new Response(blob));

    // 2. Cache Thumbnail and Author Image if available
    if (video.thumbnailUrl) {
      try {
        const thumbRes = await fetch(video.thumbnailUrl);
        if (thumbRes.ok) {
          await cache.put(`/offline-image/thumb-${video.id}`, thumbRes);
        }
      } catch (e) {
        // Cache failed silently
      }
    }

    if (video.authorImageUrl) {
      try {
        const authorRes = await fetch(video.authorImageUrl);
        if (authorRes.ok) {
          await cache.put(`/offline-image/author-${video.id}`, authorRes);
        }
      } catch (e) {
        // Cache failed silently
      }
    }

    // 3. Save metadata to IndexedDB
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(video);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getVideos(): Promise<DownloadedVideo[]> {
    const db = await initDB();
    const cache = await caches.open(CACHE_NAME);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = async () => {
        const videos: DownloadedVideo[] = request.result;

        // Map to local URLs if offline
        const mappedVideos = await Promise.all(videos.map(async (v) => {
          const thumbMatch = await cache.match(`/offline-image/thumb-${v.id}`);
          const authorMatch = await cache.match(`/offline-image/author-${v.id}`);

          return {
            ...v,
            thumbnailUrl: thumbMatch ? URL.createObjectURL(await thumbMatch.blob()) : v.thumbnailUrl,
            authorImageUrl: authorMatch ? URL.createObjectURL(await authorMatch.blob()) : v.authorImageUrl,
          };
        }));

        resolve(mappedVideos);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async removeVideo(id: string, playbackId: string) {
    const db = await initDB();
    const cache = await caches.open(CACHE_NAME);

    await cache.delete(`/offline-video/${playbackId}.mp4`);
    await cache.delete(`/offline-image/thumb-${id}`);
    await cache.delete(`/offline-image/author-${id}`);

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getVideoUrl(playbackId: string): Promise<string | null> {
    const cache = await caches.open(CACHE_NAME);
    const videoUrl = `/offline-video/${playbackId}.mp4`;
    const response = await cache.match(videoUrl);
    if (!response) return null;

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
};
