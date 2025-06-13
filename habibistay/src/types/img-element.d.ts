import 'react';

declare module 'react' {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    /**
     * Specifies a hint of the relative priority to use when fetching the image.
     * @see https://web.dev/priority-hints/
     */
    fetchPriority?: 'high' | 'low' | 'auto';
  }
}
