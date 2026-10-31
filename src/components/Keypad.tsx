'use client';

import { useState } from 'react';

const calc = (a: number, b: number, op: '+' | '-') => (op === '+' ? a + b : a - b);

export default function Keypad({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const [acc, setAcc] = useState<{ left: number; op: '+' | '-' } | null>(null);

  const push = (d: string) => onChange(value === '' ? d : value + d);
  const back = () => onChange(value.slice(0, -1));

  // ponytail: kalkulator satu tingkat (a op b), bukan parser ekspresi — cukup untuk "35rb + 12rb"
  const operator = (op: '+' | '-') => {
    if (value === '') return;
    const left = acc ? calc(acc.left, Number(value), acc.op) : Number(value);
    setAcc({ left, op });
    onChange('');
  };

  const equals = () => {
    if (!acc || value === '') return;
    onChange(String(calc(acc.left, Number(value), acc.op)));
    setAcc(null);
  };

  const k =
    'num rounded-xl bg-chip py-4 text-2xl font-semibold text-ink active:bg-line';

  return (
    <div>
      {acc && (
        <div className="num mb-1 text-right text-xs text-dim">
          {acc.left.toLocaleString('id-ID')} {acc.op}
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {['7', '8', '9'].map((d) => (
          <button key={d} type="button" className={k} onClick={() => push(d)}>
            {d}
          </button>
        ))}
        <button type="button" className={k} onClick={back} aria-label="hapus angka">
          ⌫
        </button>

        {['4', '5', '6'].map((d) => (
          <button key={d} type="button" className={k} onClick={() => push(d)}>
            {d}
          </button>
        ))}
        <button type="button" className={`${k} text-gold`} onClick={() => operator('+')}>
          +
        </button>

        {['1', '2', '3'].map((d) => (
          <button key={d} type="button" className={k} onClick={() => push(d)}>
            {d}
          </button>
        ))}
        <button type="button" className={`${k} text-gold`} onClick={() => operator('-')}>
          −
        </button>

        <button type="button" className={k} onClick={() => push('000')}>
          000
        </button>
        <button type="button" className={k} onClick={() => push('0')}>
          0
        </button>
        <button type="button" className={`${k} text-gold`} onClick={equals}>
          =
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="rounded-xl bg-gold py-4 text-base font-bold text-onaccent disabled:opacity-50"
        >
          Simpan
        </button>
      </div>
    </div>
  );
}
