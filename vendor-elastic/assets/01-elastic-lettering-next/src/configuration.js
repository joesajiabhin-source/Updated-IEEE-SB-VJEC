const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
export const defaults = freeze({ text: 'tweak it', width: 1440, height: 720, ink: '#ffffff', stretch: 1, bounce: 0.65, stagger: 100 });
export const ranges = freeze([
  ['width', 'Width', 240, 1800, 10, 'px'],
  ['height', 'Height', 160, 1000, 10, 'px'],
  ['stretch', 'Stretch', 0, 1, 0.05, ''],
  ['bounce', 'Bounce', 0, 1, 0.05, ''],
  ['stagger', 'Letter delay', 40, 240, 10, 'ms'],
]);
export function normalize(input = {}) {
  input = input && typeof input === 'object' ? input : {};
  const result = { ...defaults };
  result.text = typeof input.text === 'string' && input.text.trim()
    ? Array.from(input.text.replace(/\s+/g, ' ').trim()).slice(0, 40).join('') : defaults.text;
  result.ink = /^#[0-9a-f]{6}$/i.test(input.ink) ? input.ink.toLowerCase() : defaults.ink;
  for (const [key, , min, max, step] of ranges) {
    const value = input[key] == null || input[key] === '' ? NaN : Number(input[key]);
    result[key] = Number((Math.round(Math.max(min, Math.min(max, Number.isFinite(value) ? value : defaults[key])) / step) * step).toFixed(3));
  }
  return result;
}
const fields = Object.fromEntries(ranges.map(([key, label, min, max, step, unit]) => [key, { key, label, type: 'range', min, max, step, unit }]));
const groups = [
  { id: 'text', title: 'Text', level: 'simple', fields: [
    { key: 'text', label: 'Text', type: 'text', maxLength: 40, hint: 'Tall uppercase display lettering. Up to 40 characters.', keepOnLookReset: true },
    { key: 'ink', label: 'Text colour', type: 'color' },
  ] },
  { id: 'size', title: 'Size', level: 'simple', fields: [fields.width, fields.height] },
  { id: 'motion', title: 'Motion', level: 'simple', fields: [fields.stretch, fields.bounce, fields.stagger] },
];
export const configurationContract = freeze({ schemaVersion: 1, templateId: 'elastic-lettering', title: 'Elastic Lettering', defaults, normalize, toRuntimeOptions: normalize, groups, editorGroups: (groups).map(group => ({ ...group, fields: group.fields.map(field =>
    ["width","height"].includes(field.key) ? { ...field, editorCategory: 'layout' } : field) })), presetPreservedFields: ['text'], presets: [], actions: [{ id: 'replay', label: 'Replay entrance' }] });
