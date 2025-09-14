export function transformFixture(fix: any) {
  // 🚫 Skip finished matches
  if (fix.state_id === 3) {
    return null;
  }

  const homePart = fix?.participants?.find((p: any) => p?.meta?.location === 'home');
  const awayPart = fix?.participants?.find((p: any) => p?.meta?.location === 'away');
  const homeId = homePart?.id;
  const awayId = awayPart?.id;
  const homeName = homePart?.name ?? 'Home';
  const awayName = awayPart?.name ?? 'Away';
  const matchName = `${homeName} vs ${awayName}`;

  // Time + Period
  let currentPeriod = (fix?.periods ?? []).find((p: any) => p.ticking === true || p.ended === null);
  if (!currentPeriod && (fix?.periods ?? []).length > 0) {
    currentPeriod = fix.periods[fix.periods.length - 1];
  }
  const latestMinute = Math.max(0, ...((fix?.trends ?? []).map((t: any) => t.minute || 0)));
  const minute: number = Number(fix?.time?.minute ?? currentPeriod?.minutes ?? latestMinute ?? 0);

  let periodLabel = '';
  if (currentPeriod?.type_id === 1) periodLabel = '1T';
  else if (currentPeriod?.type_id === 2) periodLabel = '2T';
  else if (currentPeriod?.type_id === 15) periodLabel = 'HT';
  else if (currentPeriod?.type_id === 5) periodLabel = 'PEN';
  else if (currentPeriod?.description) periodLabel = currentPeriod.description;
  else periodLabel = '—';

  // Scores
  const scoreHome = (fix?.scores ?? []).find(
    (s: any) => s.description === 'CURRENT' && s.participant_id == homeId
  )?.score?.goals ?? 0;
  const scoreAway = (fix?.scores ?? []).find(
    (s: any) => s.description === 'CURRENT' && s.participant_id == awayId
  )?.score?.goals ?? 0;

  // Utility functions
  function latestVal(id: number, pid: number) {
    const arr = (fix?.trends ?? []).filter((x: any) => x.type_id == id && x.participant_id == pid);
    if (arr.length === 0) return 0;
    return Number(arr[arr.length - 1].value ?? 0);
  }

  function latestStatVal(id: number, pid: number) {
    const arr = (fix?.statistics ?? []).filter((s: any) => s.type_id == id && s.participant_id == pid);
    if (arr.length === 0) return 0;
    return Number(arr[arr.length - 1]?.data?.value ?? 0);
  }

  function pair(id: number) {
    return { home: latestVal(id, homeId), away: latestVal(id, awayId) };
  }

  // Confirmed mappings
  const corners = pair(34);
  const totalShots = pair(42);
  const attacks = pair(43);
  const dangerous = pair(44);
  const possession = pair(45);
  const shotsOnTarget = {
    home: latestVal(86, homeId) || latestStatVal(86, homeId),
    away: latestVal(86, awayId) || latestStatVal(86, awayId),
  };
  const blockedShots = pair(58);
  const reds = pair(83);
  const crosses = pair(98);
  const crossAcc = pair(99);

  // Dangerous Attacks by half
  function maxDangerousForPeriod(periodId: number, pid: number) {
    const arr = (fix?.trends ?? []).filter(
      (x: any) => x.type_id == 44 && x.participant_id == pid && x.period_id == periodId
    );
    if (arr.length === 0) return 0;
    return Math.max(...arr.map((x: any) => Number(x.value || 0)));
  }
  const firstHalfPeriodId = (fix?.periods ?? []).find((p: any) => p.type_id === 1)?.id;
  const secondHalfPeriodId = (fix?.periods ?? []).find((p: any) => p.type_id === 2)?.id;
  const dangerous1HT = {
    home: firstHalfPeriodId ? maxDangerousForPeriod(firstHalfPeriodId, homeId) : 0,
    away: firstHalfPeriodId ? maxDangerousForPeriod(firstHalfPeriodId, awayId) : 0,
  };
  const dangerous2HT = {
    home: secondHalfPeriodId ? maxDangerousForPeriod(secondHalfPeriodId, homeId) : 0,
    away: secondHalfPeriodId ? maxDangerousForPeriod(secondHalfPeriodId, awayId) : 0,
  };

  // Adjust Dangerous Attacks according to period
  let dangerousAdjusted = { home: dangerous.home, away: dangerous.away };
  if (periodLabel === '1T') {
    dangerousAdjusted = { home: dangerous1HT.home, away: dangerous1HT.away };
  } else if (periodLabel === '2T') {
    dangerousAdjusted = {
      home: Math.max(0, dangerous2HT.home - dangerous1HT.home),
      away: Math.max(0, dangerous2HT.away - dangerous1HT.away),
    };
  }

  // Derived
  const crossBlocked = {
    home: Math.max(0, crosses.home - crossAcc.home),
    away: Math.max(0, crosses.away - crossAcc.away),
  };
  const timeInHalf = Math.max(1, minute || 1);
  const speedH = Number((dangerousAdjusted.home / timeInHalf).toFixed(2));
  const speedA = Number((dangerousAdjusted.away / timeInHalf).toFixed(2));
  const speedSum = Number((speedH + speedA).toFixed(2));
  const blockedValueHome = blockedShots.home + crossBlocked.home;
  const blockedValueAway = blockedShots.away + crossBlocked.away;
  const speedBlockedHome = Number((blockedValueHome / timeInHalf).toFixed(2));
  const speedBlockedAway = Number((blockedValueAway / timeInHalf).toFixed(2));
  const blockedAcum = Number(((blockedValueHome + blockedValueAway) / timeInHalf).toFixed(2));

  return {
    matchName,
    minute,
    periodLabel,
    scoreHome,
    scoreAway,
    corners,
    attacks,
    dangerous,
    dangerous1HT,
    dangerous2HT,
    dangerousAdjusted,
    possession,
    shotsOnTarget,
    totalShots,
    blockedShots,
    crosses,
    crossAcc,
    reds,
    crossBlocked,
    speedH,
    speedA,
    speedSum,
    blockedValueHome,
    blockedValueAway,
    speedBlockedHome,
    speedBlockedAway,
    blockedAcum,
  };
}
