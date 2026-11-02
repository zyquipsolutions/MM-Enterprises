// Line icons (24×24, stroke = currentColor, 1.6 stroke).
const P = {
  chimney: '<path d="M10 3h4v6h-4z"/><path d="M4 15l4.5-6h7L20 15z"/><path d="M4 15h16v1.5H4z"/><path d="M9 19.5c.6-.8.6-1.4 0-2M12 20.5c.6-.8.6-1.4 0-2M15 19.5c.6-.8.6-1.4 0-2"/>',
  hob: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="7.5" cy="12" r="2.5"/><circle cx="16.5" cy="12" r="2.5"/><circle cx="7.5" cy="12" r=".6"/><circle cx="16.5" cy="12" r=".6"/>',
  cooktop: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="2.5"/><circle cx="15.5" cy="9.5" r="2"/><circle cx="8.5" cy="15.5" r="1.8"/><circle cx="15.5" cy="15.5" r="2.3"/>',
  oven: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18"/><rect x="6.5" y="11" width="11" height="7" rx="1"/><path d="M6.5 5.5h.01M9.5 5.5h.01M15 5.5h3"/>',
  microwave: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><rect x="5" y="8" width="11" height="8" rx="1"/><path d="M18.5 8.5v.01M18.5 11v.01M18.5 13.5v2"/>',
  dishwasher: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><path d="M4 7h16"/><path d="M7 4.8h.01M10 4.8h.01M14 4.8h3"/><circle cx="12" cy="14" r="4"/><path d="M10.4 13.2c.9-.9 2.3-.9 3.2 0"/>',
  install: '<path d="M4 20h16"/><path d="M6 20V9l6-5 6 5v11"/><path d="M10 20v-5h4v5"/><path d="M12 4V2"/>',
  tools: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  care: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M8.5 12l2.4 2.4 4.6-4.8"/>',
  expert: '<circle cx="12" cy="8" r="4"/><path d="M8.5 11.5L7 21l5-2.5 5 2.5-1.5-9.5"/>',
  quality: '<path d="M12 2.8l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.2l-5.2 2.7 1-5.8L3.5 9l5.9-.9z"/>',
  response: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/><path d="M12 7v5l3 2"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUpRight: '<path d="M7 17L17 7M8 7h9v9"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
};

export const WHATSAPP_PATH =
  'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2-.2-.2-.5-.3z';

export function icon(name, cls = 'ic', size = 24) {
  if (name === 'whatsapp')
    return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="${WHATSAPP_PATH}"/></svg>`;
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] || ''}</svg>`;
}
