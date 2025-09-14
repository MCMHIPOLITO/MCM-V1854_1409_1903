export function transformFixture(fix: any) {
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

  // Utility to get latest val for trend type and participant
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

export function flattenRow(tf: any) {
  const row: any = {
    "Match": tf.matchName,
    "Time": `${tf.minute}'`,
    "Period": tf.periodLabel,
    "Score\nHome": tf.scoreHome,   
    "Score\nAway": tf.scoreAway,
    "Corners\nHome": tf.corners.home,
    "Corners\nAway": tf.corners.away,
    "Attacks\nHome": tf.attacks.home,
    "Attacks\nAway": tf.attacks.away,
    "Dangerous Attacks\nHome": tf.dangerousAdjusted.home,
    "Dangerous Attacks\nAway": tf.dangerousAdjusted.away,
    "Dangerous Attacks 1HT\nHome": tf.dangerous1HT.home,
    "Dangerous Attacks 1HT\nAway": tf.dangerous1HT.away,
    "Dangerous Attacks 2HT\nHome": tf.dangerous2HT.home,
    "Dangerous Attacks 2HT\nAway": tf.dangerous2HT.away,
    "Ball Possession\nHome %": tf.possession.home,
    "Ball Possession\nAway %": tf.possession.away,
    "Shots On Target\nHome": tf.shotsOnTarget.home,
    "Shots On Target\nAway": tf.shotsOnTarget.away,
    "Total Shots\nHome": tf.totalShots.home,
    "Total Shots\nAway": tf.totalShots.away,
    "Blocked Shots\nHome": tf.blockedShots.home,
    "Blocked Shots\nAway": tf.blockedShots.away,
    "Crosses\nHome": tf.crosses.home,
    "Crosses\nAway": tf.crosses.away,
    "Cross Accuracy\nHome": tf.crossAcc.home,
    "Cross Accuracy\nAway": tf.crossAcc.away,
    "Crosses blocked\nHome": tf.crossBlocked.home,
    "Crosses blocked\nAway": tf.crossBlocked.away,
    "Red Card\nHome": tf.reds.home,
    "Red Card\nAway": tf.reds.away,
    "Speed APPM\nH": tf.speedH,
    "Speed APPM\nA": tf.speedA,
    "Speed\nAcum": tf.speedSum,
    "Blocked Value\nHome": tf.blockedValueHome,
    "Blocked Value\nAway": tf.blockedValueAway,
    "Speed Blocked\nHome": tf.speedBlockedHome,
    "Speed Blocked\nAway": tf.speedBlockedAway,
    "Blocked\nAcum": tf.blockedAcum,
  };

  // WPI calculation
  const { WPI_HOME, WPI_AWAY } = calculateWPI(
    tf.crosses.home,
    tf.crosses.away,
    tf.totalShots.home,
    tf.totalShots.away
  );
  row["WPI\nHome"] = WPI_HOME;
  row["WPI\nAway"] = WPI_AWAY;

  return row;
}

export function calculateWPI(
  crossesHome: number,
  crossesAway: number,
  totalShotsHome: number,
  totalShotsAway: number
) {
  const wpiHome = totalShotsHome > 0 ? crossesHome / totalShotsHome : 0;
  const wpiAway = totalShotsAway > 0 ? crossesAway / totalShotsAway : 0;
  return {
    WPI_HOME: Number(wpiHome.toFixed(1)),
    WPI_AWAY: Number(wpiAway.toFixed(1)),
  };
}
