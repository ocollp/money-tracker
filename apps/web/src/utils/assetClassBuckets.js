export const ASSET_CLASS_LABELS = {
  immo: 'Habitatge',
  crowdfunding: 'Crowdfunding',
  etfs: 'ETFs',
  indexed: 'Fons indexat',
  pension: 'Pla de pensions',
  equities: 'Accions',
  crypto: 'Cripto',
  cash: 'Compte remunerat',
  other: 'Estalvi líquid',
};

function addTravelToOtherBucket(point, month, travelPatrimonyShare) {
  const tf = (month.travelFund || 0) * travelPatrimonyShare;
  if (tf !== 0) {
    point[ASSET_CLASS_LABELS.other] += tf;
  }
}

function rowText(row) {
  return `${row.category || ''} ${row.entity || ''} ${row.type || ''}`.toLowerCase();
}

function isTradeRepublicBrokerEntity(row) {
  return /\btrade\s*republic\b/i.test(`${row.entity || ''}`);
}

function isRevolutBrokerEntity(row) {
  const e = `${row.entity || ''}`.trim().toLowerCase();
  if (!e) return false;
  return /^revolut\b/.test(e);
}

function isTradeRepublicCuentaFlexible(row, s) {
  if (!isTradeRepublicBrokerEntity(row)) return false;
  return /(?:cuenta|compte)\s+flexible|(?:cuenta|compte)\s+flex\b|flexkonto|flex-konto/i.test(s);
}

function isIndexedProvider(row) {
  const s = rowText(row);
  return /indexa|finizens|myinvestor|simple\s*fund|justetf/i.test(s);
}

function looksLikeEtf(row) {
  const s = rowText(row);
  return /etf\b|msci|stoxx|s\s*&\s*p|sp500|ishares|vanguard|fondo[s]?\s*index|fons\s*index|indexat|indexed|core\s*accum|all[-\s]?world|acwi|vwce|accumulat|ucits|renta\s*variable\s*index|renta\s*fixa\s*index/i.test(
    s,
  );
}

function isBrokerEquitiesRow(row) {
  if (!isTradeRepublicBrokerEntity(row) && !isRevolutBrokerEntity(row)) return false;
  const s = rowText(row);
  if (isTradeRepublicCuentaFlexible(row, s)) return false;
  if (!/invertid|invertit|accion|acció|acciones|stocks?|bolsa|valores/i.test(s)) return false;
  return true;
}

function looksLikeCrypto(row, s) {
  if (
    /bitcoin|btc\b|ethereum|\beth\b(?!\w)|stablecoin|usdt\b|usdc\b|criptomoneda|\bcripto\b|\bcrypto\b|solana|cardano|dogecoin|polkadot|xrp\b|matic\b|avalanche|monero|litecoin/i.test(
      s,
    )
  ) {
    return true;
  }
  const t = `${row.type || ''}`.toLowerCase();
  if (!/invertid|invertit/i.test(t)) return false;
  return /\b(binance|coinbase|kraken|bit2me|crypto\.com|gate\.io|mexc|kucoin|ledger\s*live)\b/i.test(s);
}

export function classifyLiquidEntry(row) {
  const s = rowText(row);
  const entity = `${row.entity || ''}`.toLowerCase();

  if (/plan\s*de\s*pensi|pensi[oó]n|jubili|plans?vap|ter\s*pensi|frei[iy]nstieg|pka\b|pere\b/i.test(s)) {
    return 'pension';
  }
  if (/\bfundeen\b|\burbanitae\b/i.test(entity)) {
    return 'crowdfunding';
  }
  if (isTradeRepublicCuentaFlexible(row, s)) {
    return 'cash';
  }
  if (isTradeRepublicBrokerEntity(row) && looksLikeEtf(row)) {
    return 'etfs';
  }
  if (looksLikeEtf(row) || isIndexedProvider(row)) {
    return 'indexed';
  }
  if (looksLikeCrypto(row, s)) {
    return 'crypto';
  }
  if (isBrokerEquitiesRow(row)) {
    return 'equities';
  }
  return 'other';
}

function zeroBucketRecord() {
  const o = {};
  for (const v of Object.values(ASSET_CLASS_LABELS)) {
    o[v] = 0;
  }
  return o;
}

export function buildAssetClassSeries(months, housingEffective, mortgageEffective, hasHousing, travelPatrimonyShare) {
  if (!months?.length) {
    return { distribution: [], evolution: [] };
  }

  const evolution = months.map((m, i) => {
    const point = { date: m.shortLabel, key: m.key, ...zeroBucketRecord() };

    if (hasHousing) {
      point[ASSET_CLASS_LABELS.immo] =
        (housingEffective[i] || 0) + (mortgageEffective[i] || 0);
    }

    for (const row of m.entries || []) {
      if (row.isTravel || row.isHousing) continue;
      const bucket = classifyLiquidEntry(row);
      point[ASSET_CLASS_LABELS[bucket]] += row.amount;
    }

    addTravelToOtherBucket(point, m, travelPatrimonyShare);

    return point;
  });

  const last = evolution[evolution.length - 1];
  const distribution = Object.values(ASSET_CLASS_LABELS)
    .map((name) => ({ name, value: last[name] || 0 }))
    .map((d) => ({
      ...d,
      ...(d.name === ASSET_CLASS_LABELS.immo ? { isHousing: true } : {}),
    }))
    .filter((d) => d.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const total = distribution.reduce((s, d) => s + d.value, 0);
  for (const d of distribution) {
    d.pct = total !== 0 ? (d.value / total) * 100 : 0;
  }

  return { distribution, evolution };
}
