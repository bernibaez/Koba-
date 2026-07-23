export type CashRegisterId = '1' | '2' | '3';

export type CashRegisterSession = {
  id: CashRegisterId;
  label: string;
  cashier: string;
  open: boolean;
  openedAt: string;
  salesToday: number;
  tickets: number;
  cartItems: number;
  currentTotal: number;
  movements: { time: string; type: string; detail: string; amount: number }[];
};

export const CASH_REGISTERS: CashRegisterSession[] = [
  {
    id: '1',
    label: 'Caja #1',
    cashier: 'Roberto Díaz',
    open: true,
    openedAt: '08:02',
    salesToday: 48250.5,
    tickets: 64,
    cartItems: 3,
    currentTotal: 765,
    movements: [
      { time: '08:02', type: 'Apertura', detail: 'Fondo inicial', amount: 5000 },
      { time: '09:15', type: 'Venta', detail: 'FAC-1201 · Efectivo', amount: 1850 },
      { time: '10:40', type: 'Venta', detail: 'FAC-1208 · Tarjeta', amount: 4320 },
      { time: '11:05', type: 'Gasto', detail: 'Mensajería', amount: -200 },
      { time: '12:30', type: 'Venta', detail: 'FAC-1220 · Transferencia', amount: 9800 },
      { time: 'Ahora', type: 'En curso', detail: 'Carrito activo · 3 ítems', amount: 765 },
    ],
  },
  {
    id: '2',
    label: 'Caja #2',
    cashier: 'Luisa Fernández',
    open: true,
    openedAt: '08:10',
    salesToday: 35600,
    tickets: 48,
    cartItems: 5,
    currentTotal: 2140,
    movements: [
      { time: '08:10', type: 'Apertura', detail: 'Fondo inicial', amount: 4000 },
      { time: '09:50', type: 'Venta', detail: 'FAC-2103 · Efectivo', amount: 920 },
      { time: '11:20', type: 'Devolución', detail: 'DEV-014', amount: -450 },
      { time: '13:00', type: 'Venta', detail: 'FAC-2115 · Crédito', amount: 12500 },
      { time: 'Ahora', type: 'En curso', detail: 'Carrito activo · 5 ítems', amount: 2140 },
    ],
  },
  {
    id: '3',
    label: 'Caja #3',
    cashier: 'Miguel Torres',
    open: false,
    openedAt: '—',
    salesToday: 0,
    tickets: 0,
    cartItems: 0,
    currentTotal: 0,
    movements: [
      { time: '22:05', type: 'Cierre', detail: 'Sesión anterior cerrada', amount: 0 },
    ],
  },
];

export function getCashRegister(id: CashRegisterId) {
  return CASH_REGISTERS.find((c) => c.id === id)!;
}
