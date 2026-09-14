/**
 * toast.ts — Adapter de notificaciones
 *
 * Expone la misma interfaz que `sonner` (`toast.success`, `toast.error`, etc.)
 * pero usa `sileo` como implementación subyacente.
 *
 * Todos los archivos del proyecto importan desde aquí en lugar de 'sonner':
 *   import { toast } from '@/lib/toast'
 */
import { sileo } from 'sileo';
import type { SileoOptions } from 'sileo';

type ToastOptions = {
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

/** Mapas de label por tipo para el pill superior */
const TYPE_LABELS: Record<string, string> = {
  success: 'Listo',
  error: 'Error',
  warning: 'Atención',
  info: 'Info',
};

/** Color del ícono por tipo */
const TYPE_FILL: Record<string, string> = {
  success: '#10b981', // esmeralda
  error:   '#ef4444', // rojo
  warning: '#f59e0b', // ámbar
  info:    '#38bdf8', // celeste
};

function toSileoOpts(
  type: 'success' | 'error' | 'warning' | 'info',
  message: unknown,
  options?: ToastOptions
): SileoOptions {
  const messageStr =
    typeof message === 'string'
      ? message
      : message instanceof Error
        ? message.message
        : String(message ?? '');

  const base: SileoOptions = {
    title: options?.description ? messageStr : messageStr,
    description: options?.description,
    fill: TYPE_FILL[type],
  };

  if (typeof options?.duration === 'number') base.duration = options.duration;

  return base;
}


const toast = Object.assign(
  /** toast("mensaje") — info por defecto */
  (message: unknown, options?: ToastOptions) => {
    sileo.info(toSileoOpts('info', message, options));
  },
  {
    success(message: unknown, options?: ToastOptions) {
      sileo.success(toSileoOpts('success', message, options));
    },
    error(message: unknown, options?: ToastOptions) {
      sileo.error(toSileoOpts('error', message, options));
    },
    warning(message: unknown, options?: ToastOptions) {
      sileo.warning(toSileoOpts('warning', message, options));
    },
    info(message: unknown, options?: ToastOptions) {
      sileo.info(toSileoOpts('info', message, options));
    },
    /**
     * promise() — muestra estados loading/success/error para una promesa.
     * Mapea al método sileo.promise().
     */
    promise<T>(
      promise: Promise<T>,
      messages: PromiseMessages<T>,
    ) {
      const opts = {
        loading: { title: messages.loading },
        success: (data: T) => ({
          title:
            typeof messages.success === 'function'
              ? messages.success(data)
              : messages.success,
        }),
        error: (err: unknown) => ({
          title:
            typeof messages.error === 'function'
              ? messages.error(err)
              : messages.error,
        }),
      };
      return sileo.promise(promise, opts);
    },
    /** dismiss() — sileo sí tiene dismiss por ID de string */
    dismiss(id?: string | number) {
      if (id !== undefined) sileo.dismiss(String(id));
    },
    /** loading() — muestra un toast de tipo info con mensaje de carga */
    loading(message: unknown, options?: ToastOptions) {
      sileo.info(toSileoOpts('info', message, options));
    },
  }
);

export { toast };
export default toast;
