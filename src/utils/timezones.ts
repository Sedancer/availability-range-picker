export interface TimezoneOption {
  label: string;
  offset: number;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { label: 'UTC-12:00 (Baker Island)', offset: -12 },
  { label: 'UTC-11:00 (Pago Pago, Niue)', offset: -11 },
  { label: 'UTC-10:00 (Honolulu, Hawaii)', offset: -10 },
  { label: 'UTC-09:00 (Anchorage, Alaska)', offset: -9 },
  { label: 'UTC-08:00 (Los Angeles, PST)', offset: -8 },
  { label: 'UTC-07:00 (Denver, MST)', offset: -7 },
  { label: 'UTC-06:00 (Chicago, CST / Mexico)', offset: -6 },
  { label: 'UTC-05:00 (New York, EST / Toronto)', offset: -5 },
  { label: 'UTC-04:00 (Santiago, Halifax)', offset: -4 },
  { label: 'UTC-03:00 (Sao Paulo, Buenos Aires)', offset: -3 },
  { label: 'UTC-02:00 (South Georgia)', offset: -2 },
  { label: 'UTC-01:00 (Azores, Cape Verde)', offset: -1 },
  { label: 'UTC+00:00 (London, Dublin, Lisbon, UTC)', offset: 0 },
  { label: 'UTC+01:00 (Berlin, Paris, Rome, Warsaw, CET)', offset: 1 },
  { label: 'UTC+02:00 (Kyiv, Helsinki, Athens, EET)', offset: 2 },
  { label: 'UTC+03:00 (Istanbul, Riyadh, Nairobi)', offset: 3 },
  { label: 'UTC+03:30 (Tehran)', offset: 3.5 },
  { label: 'UTC+04:00 (Dubai, Baku, Tbilisi)', offset: 4 },
  { label: 'UTC+04:30 (Kabul)', offset: 4.5 },
  { label: 'UTC+05:00 (Tashkent, Karachi)', offset: 5 },
  { label: 'UTC+05:30 (New Delhi, Mumbai, IST)', offset: 5.5 },
  { label: 'UTC+05:45 (Kathmandu)', offset: 5.75 },
  { label: 'UTC+06:00 (Almaty, Dhaka)', offset: 6 },
  { label: 'UTC+07:00 (Bangkok, Hanoi, Jakarta)', offset: 7 },
  { label: 'UTC+08:00 (Singapore, Beijing, Hong Kong)', offset: 8 },
  { label: 'UTC+09:00 (Tokyo, Seoul)', offset: 9 },
  { label: 'UTC+09:30 (Adelaide, Darwin)', offset: 9.5 },
  { label: 'UTC+10:00 (Sydney, Melbourne, Brisbane)', offset: 10 },
  { label: 'UTC+11:00 (Solomon Islands, Noumea)', offset: 11 },
  { label: 'UTC+12:00 (Auckland, Fiji)', offset: 12 },
  { label: 'UTC+13:00 (Nuku\'alofa, Samoa)', offset: 13 },
];

export function formatOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const hours = Math.floor(abs);
  const minutes = Math.round((abs - hours) * 60);
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
