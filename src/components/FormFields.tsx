import type { DisbursementForm, LineItem } from '../types';
import { calcTotal, formatCurrency } from '../lib/workflow';

interface Props {
  form: DisbursementForm;
  readOnly?: boolean;
  onChange?: (form: DisbursementForm) => void;
}

export function FormFields({ form, readOnly = false, onChange }: Props) {
  const update = (patch: Partial<DisbursementForm>) => {
    onChange?.({ ...form, ...patch });
  };

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    const lineItems = form.lineItems.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    update({ lineItems });
  };

  const addLine = () => {
    update({
      lineItems: [...form.lineItems, { item: '', amount: 0, note: '' }],
    });
  };

  const removeLine = (index: number) => {
    if (form.lineItems.length <= 1) return;
    update({ lineItems: form.lineItems.filter((_, i) => i !== index) });
  };

  if (readOnly) {
    return (
      <dl className="form-readonly">
        <dt>申請日期</dt>
        <dd>{form.applyDate}</dd>
        <dt>申請人</dt>
        <dd>{form.applicantName}</dd>
        <dt>用途說明</dt>
        <dd>{form.purpose}</dd>
        <dt>費用明細</dt>
        <dd>
          <ul className="line-list">
            {form.lineItems.map((row, i) => (
              <li key={i}>
                {row.item} — {formatCurrency(row.amount)}
                {row.note ? `（${row.note}）` : ''}
              </li>
            ))}
          </ul>
        </dd>
        <dt>合計金額</dt>
        <dd className="total">{formatCurrency(calcTotal(form.lineItems))}</dd>
        <dt>受款人／帳號資訊</dt>
        <dd className="prewrap">{form.payeeInfo}</dd>
      </dl>
    );
  }

  return (
    <div className="form-fields">
      <div className="field-row">
        <label>
          申請日期
          <input
            type="date"
            value={form.applyDate}
            onChange={(e) => update({ applyDate: e.target.value })}
          />
        </label>
        <label>
          申請人姓名
          <input
            type="text"
            value={form.applicantName}
            onChange={(e) => update({ applicantName: e.target.value })}
          />
        </label>
      </div>
      <label>
        用途說明
        <textarea
          rows={3}
          value={form.purpose}
          onChange={(e) => update({ purpose: e.target.value })}
        />
      </label>
      <fieldset className="line-items">
        <legend>費用明細</legend>
        {form.lineItems.map((row, index) => (
          <div key={index} className="line-item-row">
            <input
              type="text"
              placeholder="項目"
              value={row.item}
              onChange={(e) => updateLine(index, { item: e.target.value })}
            />
            <input
              type="number"
              min={0}
              placeholder="金額"
              value={row.amount || ''}
              onChange={(e) =>
                updateLine(index, { amount: Number(e.target.value) || 0 })
              }
            />
            <input
              type="text"
              placeholder="備註（選填）"
              value={row.note}
              onChange={(e) => updateLine(index, { note: e.target.value })}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => removeLine(index)}
              disabled={form.lineItems.length <= 1}
            >
              刪除
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={addLine}>
          新增明細列
        </button>
        <p className="total-line">
          合計：<strong>{formatCurrency(calcTotal(form.lineItems))}</strong>
        </p>
      </fieldset>
      <label>
        受款人／帳號資訊
        <textarea
          rows={3}
          value={form.payeeInfo}
          onChange={(e) => update({ payeeInfo: e.target.value })}
        />
      </label>
    </div>
  );
}
