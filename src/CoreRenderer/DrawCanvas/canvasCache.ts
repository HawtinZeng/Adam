import { LRUCache } from "lru-cache";
import { DrawingElement } from "src/CoreRenderer/basicTypes";

const options = {
  max: 500,

  // for use with tracking overall storage size
  maxSize: 50000,
  sizeCalculation: (value, key) => {
    return 1;
  },

  // for use when you need to clean up something when objects
  // are evicted from the cache
  dispose: (value, key) => {
    value = null;
  },

  // how long to live in ms
  ttl: 1000 * 60 * 10,

  // return stale items before removing from cache?
  allowStale: false,

  updateAgeOnGet: false,
  updateAgeOnHas: false,
};
class DrawingCanvasCache {
  ele2DrawingCanvas = new LRUCache<DrawingElement, HTMLCanvasElement>(options);
}

export const drawingCanvasCache = new DrawingCanvasCache();
