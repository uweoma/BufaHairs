import { renderLayout, heading, paragraph, infoBox, button } from './layout';
import { sendEmail } from './mailer';
import { env } from '../../config/env';
import { formatNaira } from '../../utils/money';

export interface OrderEmailItem {
  productName: string;
  variantLabel: string | null;
  quantity: number;
  lineTotal: number;
}

export interface OrderEmailData {
  orderNumber: string;
  fullName: string;
  items: OrderEmailItem[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  shippingMethod?: string | null;
  address: {
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    country: string;
  };
}

function itemsTable(items: OrderEmailItem[]): string {
  const rows = items
    .map(
      (it) => `<tr>
        <td style="padding:8px 0;font-size:14px;color:#3F3F46;">${it.productName}${
          it.variantLabel ? `<br/><span style="color:#71717A;font-size:12px;">${it.variantLabel}</span>` : ''
        } × ${it.quantity}</td>
        <td style="padding:8px 0;font-size:14px;color:#18181B;text-align:right;white-space:nowrap;">${formatNaira(it.lineTotal)}</td>
      </tr>`,
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;">${rows}</table>`;
}

function totalsBlock(o: OrderEmailData): string {
  const line = (label: string, value: string, bold = false) =>
    `<div style="display:flex;justify-content:space-between;margin:4px 0;${
      bold ? 'font-weight:700;font-size:16px;color:#18181B;' : 'color:#3F3F46;font-size:14px;'
    }"><span>${label}</span><span>${value}</span></div>`;
  return [
    line('Subtotal', formatNaira(o.subtotal)),
    o.discountTotal > 0 ? line('Discount', `− ${formatNaira(o.discountTotal)}`) : '',
    line('Shipping', o.shippingTotal === 0 ? 'Free' : formatNaira(o.shippingTotal)),
    line('Total', formatNaira(o.total), true),
  ].join('');
}

/** Order confirmation — sent after payment is verified as successful. */
export async function sendOrderConfirmationEmail(to: string, o: OrderEmailData): Promise<boolean> {
  const orderUrl = `${env.CLIENT_URL}/account/orders/${o.orderNumber}`;
  const bodyHtml = [
    heading('Thank you for your order! 💜'),
    paragraph(`Hi ${o.fullName}, we've received your payment and your order is confirmed.`),
    infoBox(`<strong>Order ${o.orderNumber}</strong>`),
    itemsTable(o.items),
    `<hr style="border:none;border-top:1px solid #EDE9FE;margin:16px 0;" />`,
    totalsBlock(o),
    infoBox(
      `<strong>Delivery${o.shippingMethod ? ` — ${o.shippingMethod}` : ''}</strong><br/>${o.address.addressLine1}${
        o.address.addressLine2 ? `, ${o.address.addressLine2}` : ''
      }<br/>${o.address.city}, ${o.address.state}, ${o.address.country}`,
    ),
    button({ label: 'View your order', url: orderUrl }),
  ].join('');

  return sendEmail({
    to,
    subject: `Order confirmed — ${o.orderNumber}`,
    html: renderLayout({ title: 'Order confirmed', bodyHtml, preheader: `Your order ${o.orderNumber} is confirmed` }),
  });
}

/** Status update — shipped / delivered / cancelled / refunded. */
export async function sendOrderStatusEmail(
  to: string,
  o: { orderNumber: string; fullName: string; status: string; trackingNumber?: string | null },
): Promise<boolean> {
  const orderUrl = `${env.CLIENT_URL}/account/orders/${o.orderNumber}`;
  const messages: Record<string, string> = {
    PROCESSING: 'Good news — we are now preparing your order for shipment.',
    SHIPPED: 'Your order is on its way! 🚚',
    DELIVERED: 'Your order has been delivered. We hope you love it! 💜',
    CANCELLED: 'Your order has been cancelled.',
    REFUNDED: 'Your order has been refunded.',
  };
  const bodyHtml = [
    heading(`Order ${o.orderNumber} — ${o.status.toLowerCase()}`),
    paragraph(`Hi ${o.fullName}, ${messages[o.status] ?? 'your order status has been updated.'}`),
    o.trackingNumber ? infoBox(`<strong>Tracking number:</strong> ${o.trackingNumber}`) : '',
    button({ label: 'View your order', url: orderUrl }),
  ].join('');

  return sendEmail({
    to,
    subject: `Order ${o.orderNumber} — ${o.status.toLowerCase()}`,
    html: renderLayout({ title: 'Order update', bodyHtml, preheader: `Order ${o.orderNumber} update` }),
  });
}
