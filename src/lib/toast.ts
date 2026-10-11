/**
 * toast.ts — Adapter de notificaciones estilo Dynamic Island (Apple)
 *
 * Mantiene compatibilidad total con la API:
 *   toast.success('...')
 *   toast.error('...')
 *   toast.warning('...')
 *   toast.info('...')
 *   toast.loading('...')
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
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

const DEFAULT_DURATION = 3000; // Exactamente 3 segundos en pantalla según lo solicitado

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

export function dismissToast(id?: string | number) {
  if (toasts.length === 0) return;

  const strId = id !== undefined ? String(id) : toasts[toasts.length - 1]?.id;
  const target = toasts.find((t) => t.id === strId);
  if (!target || target.exiting) return;

  // Limpiar timer activo si existe
  const activeTimer = toastTimers.get(strId);
  if (activeTimer) {
    clearTimeout(activeTimer);
    toastTimers.delete(strId);
  }

  // Activar animación de repliegue hacia el notch (island-exit)
  target.exiting = true;
  notify();

  // Remover de pantalla una vez terminada la animación física (220ms)
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== strId);
    toastTimers.delete(strId);
    notify();
  }, 230);
}

function addToast(type: ToastType, message: unknown, options?: ToastOptions): string {
  const id = options?.id ? String(options.id) : `island-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const title =
    typeof message === 'string'
      ? message
      : message instanceof Error
        ? message.message
        : String(message ?? '');

  // Limpiar timers previos para evitar solapamientos
  for (const [prevId, timer] of toastTimers.entries()) {
    clearTimeout(timer);
    toastTimers.delete(prevId);
  }

  const duration = typeof options?.duration === 'number' ? options.duration : DEFAULT_DURATION;

  const newToast: ToastItem = {
    id,
    type,
    title,
    description: options?.description,
    duration,
    exiting: false,
  };

  // La Isla Dinámica enfoca la notificación actual (morphing continuo)
  toasts = [newToast];
  notify();

  // Programar desaparición automática a los 3 segundos (excepto si es 'loading')
  if (type !== 'loading') {
    const timer = setTimeout(() => {
      dismissToast(id);
    }, duration);
    toastTimers.set(id, timer);
  }

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
      const id = addToast('loading', messages.loading);
      const p = typeof promise === 'function' ? promise() : promise;

      return p
        .then((data) => {
          const successMsg =
            typeof messages.success === 'function' ? messages.success(data) : messages.success;
          addToast('success', successMsg, { id, duration: 3000 });
          return data;
        })
        .catch((err) => {
          const errorMsg =
            typeof messages.error === 'function' ? messages.error(err) : messages.error;
          addToast('error', errorMsg, { id, duration: 3000 });
          throw err;
        });
    },

    dismiss: (id?: string | number) => {
      dismissToast(id);
    },
  }
);

export { toast };
export default toast;
