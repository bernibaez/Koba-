/**
 * toast.ts — Adapter de notificaciones estilo Dynamic Island (Apple)
 *
 * Mantiene compatibilidad total con la API tradicional:
 *   toast.success('...')
 *   toast.error('...')
 *   toast.warning('...')
 *   toast.info('...')
 *   toast.promise(...)
 *   toast.dismiss(...)
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  exiting?: boolean;
}

export type ToastOptions = {
  description?: string;
  duration?: number;
  id?: string | number;
  [key: string]: unknown;
};

type PromiseMessages<T> = {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((err: unknown) => string);
};

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener([...toasts]);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: string | number) {
  const strId = String(id);
  const target = toasts.find((t) => t.id === strId);
  if (!target) return;

  // Iniciar animación de salida
  target.exiting = true;
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== strId);
    notify();
  }, 220);
}

function addToast(type: ToastType, message: unknown, options?: ToastOptions): string {
  const id = options?.id ? String(options.id) : `island-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const title =
    typeof message === 'string'
      ? message
      : message instanceof Error
        ? message.message
        : String(message ?? '');

  const newToast: ToastItem = {
    id,
    type,
    title,
    description: options?.description,
    duration: typeof options?.duration === 'number' ? options.duration : 2200, // 2.2s snappy duration
    exiting: false,
  };

  // Reemplazar o agregar
  const existingIdx = toasts.findIndex((t) => t.id === id);
  if (existingIdx >= 0) {
    toasts[existingIdx] = newToast;
  } else {
    toasts.push(newToast);
  }

  notify();
  return id;
}

const toast = Object.assign(
  (message: unknown, options?: ToastOptions) => addToast('info', message, options),
  {
    success: (message: unknown, options?: ToastOptions) => addToast('success', message, options),
    error: (message: unknown, options?: ToastOptions) => addToast('error', message, options),
    warning: (message: unknown, options?: ToastOptions) => addToast('warning', message, options),
    info: (message: unknown, options?: ToastOptions) => addToast('info', message, options),
    loading: (message: unknown, options?: ToastOptions) => addToast('loading', message, options),

    promise<T>(
      promise: Promise<T> | (() => Promise<T>),
      messages: PromiseMessages<T>
    ) {
      const id = addToast('loading', messages.loading, { duration: 60000 });
      const p = typeof promise === 'function' ? promise() : promise;

      return p
        .then((data) => {
          const successMsg =
            typeof messages.success === 'function' ? messages.success(data) : messages.success;
          addToast('success', successMsg, { id, duration: 2200 });
          return data;
        })
        .catch((err) => {
          const errorMsg =
            typeof messages.error === 'function' ? messages.error(err) : messages.error;
          addToast('error', errorMsg, { id, duration: 2600 });
          throw err;
        });
    },

    dismiss: (id?: string | number) => {
      if (id !== undefined) {
        dismissToast(id);
      } else if (toasts.length > 0) {
        dismissToast(toasts[toasts.length - 1].id);
      }
    },
  }
);

export { toast };
export default toast;
