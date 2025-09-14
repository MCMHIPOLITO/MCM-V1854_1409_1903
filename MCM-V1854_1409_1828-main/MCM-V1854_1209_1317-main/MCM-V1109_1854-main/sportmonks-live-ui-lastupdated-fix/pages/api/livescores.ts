export default async function handler(req, res) {
  try {
    const upstream = await fetch(
      'https://api.sportmonks.com/v3/football/livescores/inplay?api_token=0m3wQMYU2HJdR6FmEFIkeCPtQhCS42wogMnxfcTeFc9iktmiSiFlDj2gavhm&include=periods;scores;trends;participants;statistics&filters=fixtureStatisticTypes:34,42,43,44,45,52,58,81,83,86,98,99;trendTypes:34,42,43,44,45,52,58,81,83,86,98,99&timezone=Europe/London&populate=400',
      { cache: 'no-store' }
    );
    const data = await upstream.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: 'Failed to fetch Sportmonks API' });
  }
}
