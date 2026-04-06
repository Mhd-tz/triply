"use server";

// Put your AviationStack API key here (get a free one at aviationstack.com)
const API_KEY =
  process.env.AVIATIONSTACK_API_KEY || "93e0351ae70a4e4062d5dd3ede1e2340";

// Expanded IATA code dictionary — covers 100+ major cities/airports
const CITY_IATA_MAP: Record<string, string> = {
  // Middle East
  Tehran: "IKA",
  Mashhad: "MHD",
  Isfahan: "IFN",
  Shiraz: "SYZ",
  Tabriz: "TBZ",
  Dubai: "DXB",
  "Abu Dhabi": "AUH",
  Sharjah: "SHJ",
  Doha: "DOH",
  "Kuwait City": "KWI",
  Muscat: "MCT",
  Riyadh: "RUH",
  Jeddah: "JED",
  Dammam: "DMM",
  Beirut: "BEY",
  Amman: "AMM",
  Baghdad: "BGW",
  Erbil: "EBL",
  "Tel Aviv": "TLV",
  Istanbul: "IST",
  Ankara: "ESB",

  // Asia
  Tokyo: "HND",
  Osaka: "KIX",
  Nagoya: "NGO",
  Sapporo: "CTS",
  Seoul: "ICN",
  Busan: "PUS",
  Beijing: "PEK",
  Shanghai: "PVG",
  Guangzhou: "CAN",
  Shenzhen: "SZX",
  Chengdu: "CTU",
  Hangzhou: "HGH",
  "Xi'an": "XIY",
  Wuhan: "WUH",
  "Hong Kong": "HKG",
  Taipei: "TPE",
  Macau: "MFM",
  Singapore: "SIN",
  "Kuala Lumpur": "KUL",
  Bangkok: "BKK",
  Phuket: "HKT",
  Jakarta: "CGK",
  Bali: "DPS",
  Surabaya: "SUB",
  Manila: "MNL",
  Cebu: "CEB",
  "Ho Chi Minh City": "SGN",
  Hanoi: "HAN",
  "Da Nang": "DAD",
  Colombo: "CMB",
  Dhaka: "DAC",
  Karachi: "KHI",
  Lahore: "LHE",
  "New Delhi": "DEL",
  Mumbai: "BOM",
  Bangalore: "BLR",
  Chennai: "MAA",
  Hyderabad: "HYD",
  Kolkata: "CCU",
  Ahmedabad: "AMD",
  Kathmandu: "KTM",
  Kabul: "KBL",

  // Europe
  London: "LHR",
  Manchester: "MAN",
  Edinburgh: "EDI",
  Birmingham: "BHX",
  Paris: "CDG",
  Lyon: "LYS",
  Nice: "NCE",
  Marseille: "MRS",
  Amsterdam: "AMS",
  Brussels: "BRU",
  Zurich: "ZRH",
  Geneva: "GVA",
  Frankfurt: "FRA",
  Munich: "MUC",
  Berlin: "BER",
  Hamburg: "HAM",
  Dusseldorf: "DUS",
  Vienna: "VIE",
  Prague: "PRG",
  Warsaw: "WAW",
  Budapest: "BUD",
  Madrid: "MAD",
  Barcelona: "BCN",
  Seville: "SVQ",
  Valencia: "VLC",
  Rome: "FCO",
  Milan: "MXP",
  Venice: "VCE",
  Naples: "NAP",
  Lisbon: "LIS",
  Porto: "OPO",
  Athens: "ATH",
  Thessaloniki: "SKG",
  Stockholm: "ARN",
  Oslo: "OSL",
  Copenhagen: "CPH",
  Helsinki: "HEL",
  Dublin: "DUB",
  Reykjavik: "KEF",
  Moscow: "SVO",
  "Saint Petersburg": "LED",
  Kiev: "KBP",
  Kyiv: "KBP",
  Bucharest: "OTP",
  Sofia: "SOF",
  Zagreb: "ZAG",
  Belgrade: "BEG",
  Minsk: "MSQ",
  Riga: "RIX",
  Tallinn: "TLL",
  Vilnius: "VNO",

  // North America
  "New York": "JFK",
  "Los Angeles": "LAX",
  Chicago: "ORD",
  Houston: "IAH",
  Dallas: "DFW",
  "San Francisco": "SFO",
  Seattle: "SEA",
  Miami: "MIA",
  Boston: "BOS",
  Washington: "IAD",
  Atlanta: "ATL",
  Denver: "DEN",
  Phoenix: "PHX",
  "Las Vegas": "LAS",
  Orlando: "MCO",
  Minneapolis: "MSP",
  Detroit: "DTW",
  Portland: "PDX",
  "San Diego": "SAN",
  Austin: "AUS",
  Nashville: "BNA",
  "New Orleans": "MSY",
  "Salt Lake City": "SLC",
  Toronto: "YYZ",
  Montreal: "YUL",
  Vancouver: "YVR",
  Calgary: "YYC",
  Ottawa: "YOW",
  Winnipeg: "YWG",
  Edmonton: "YEG",
  "Mexico City": "MEX",
  Cancun: "CUN",
  Guadalajara: "GDL",

  // Africa
  Cairo: "CAI",
  Alexandria: "HBE",
  Casablanca: "CMN",
  Marrakech: "RAK",
  Tunis: "TUN",
  Algiers: "ALG",
  Tripoli: "MJI",
  Nairobi: "NBO",
  "Addis Ababa": "ADD",
  Lagos: "LOS",
  Accra: "ACC",
  Johannesburg: "JNB",
  "Cape Town": "CPT",
  Durban: "DUR",
  "Dar es Salaam": "DAR",
  Khartoum: "KRT",

  // South America
  "São Paulo": "GRU",
  "Rio de Janeiro": "GIG",
  Brasilia: "BSB",
  "Buenos Aires": "EZE",
  Santiago: "SCL",
  Lima: "LIM",
  Bogota: "BOG",
  Caracas: "CCS",
  Quito: "UIO",

  // Oceania
  Sydney: "SYD",
  Melbourne: "MEL",
  Brisbane: "BNE",
  Perth: "PER",
  Auckland: "AKL",
  Christchurch: "CHC",

  // Central Asia
  Baku: "GYD",
  Tashkent: "TAS",
  Almaty: "ALA",
  Tbilisi: "TBS",
  Yerevan: "EVN",
};

export async function getIataCode(query: string): Promise<string | null> {
  if (!query) return null;

  const normalized = query.trim();

  // Exact match first
  if (CITY_IATA_MAP[normalized]) return CITY_IATA_MAP[normalized];

  // Case-insensitive partial match
  for (const [city, code] of Object.entries(CITY_IATA_MAP)) {
    if (
      normalized.toLowerCase().includes(city.toLowerCase()) ||
      city.toLowerCase().includes(normalized.toLowerCase())
    ) {
      return code;
    }
  }

  // If already looks like an IATA code (3 uppercase letters), use it directly
  if (/^[A-Z]{3}$/.test(normalized.toUpperCase())) {
    return normalized.toUpperCase();
  }

  // Fallback to AviationStack cities endpoint
  try {
    const res = await fetch(
      `http://api.aviationstack.com/v1/cities?access_key=${API_KEY}&search=${encodeURIComponent(normalized)}&limit=1`,
    );
    const json = await res.json();
    if (json.data?.[0]?.iata_code) return json.data[0].iata_code;
  } catch {
    /* ignore */
  }

  return null;
}

// Known airlines per route region for realistic generation
const AIRLINES_BY_REGION: Record<string, { name: string; code: string; logo: string }[]> = {
  "ME": [
    { name: "Emirates", code: "EK", logo: "https://logo.clearbit.com/emirates.com" },
    { name: "Qatar Airways", code: "QR", logo: "https://logo.clearbit.com/qatarairways.com" },
    { name: "Turkish Airlines", code: "TK", logo: "https://logo.clearbit.com/turkishairlines.com" },
    { name: "Etihad Airways", code: "EY", logo: "https://logo.clearbit.com/etihad.com" },
    { name: "Mahan Air", code: "W5", logo: "https://logo.clearbit.com/mahan.aero" },
  ],
  "ASIA": [
    { name: "ANA", code: "NH", logo: "https://logo.clearbit.com/ana.co.jp" },
    { name: "JAL", code: "JL", logo: "https://logo.clearbit.com/jal.co.jp" },
    { name: "Singapore Airlines", code: "SQ", logo: "https://logo.clearbit.com/singaporeair.com" },
    { name: "Cathay Pacific", code: "CX", logo: "https://logo.clearbit.com/cathaypacific.com" },
    { name: "Korean Air", code: "KE", logo: "https://logo.clearbit.com/koreanair.com" },
    { name: "Thai Airways", code: "TG", logo: "https://logo.clearbit.com/thaiairways.com" },
  ],
  "EU": [
    { name: "Lufthansa", code: "LH", logo: "https://logo.clearbit.com/lufthansa.com" },
    { name: "British Airways", code: "BA", logo: "https://logo.clearbit.com/britishairways.com" },
    { name: "Air France", code: "AF", logo: "https://logo.clearbit.com/airfrance.com" },
    { name: "KLM", code: "KL", logo: "https://logo.clearbit.com/klm.com" },
    { name: "Swiss", code: "LX", logo: "https://logo.clearbit.com/swiss.com" },
  ],
  "NA": [
    { name: "United Airlines", code: "UA", logo: "https://logo.clearbit.com/united.com" },
    { name: "Delta", code: "DL", logo: "https://logo.clearbit.com/delta.com" },
    { name: "American Airlines", code: "AA", logo: "https://logo.clearbit.com/aa.com" },
    { name: "Air Canada", code: "AC", logo: "https://logo.clearbit.com/aircanada.com" },
    { name: "JetBlue", code: "B6", logo: "https://logo.clearbit.com/jetblue.com" },
  ],
  "OTHER": [
    { name: "Qantas", code: "QF", logo: "https://logo.clearbit.com/qantas.com" },
    { name: "Ethiopian Airlines", code: "ET", logo: "https://logo.clearbit.com/ethiopianairlines.com" },
    { name: "LATAM", code: "LA", logo: "https://logo.clearbit.com/latam.com" },
    { name: "South African Airways", code: "SA", logo: "https://logo.clearbit.com/flysaa.com" },
  ],
};

const REGION_MAP: Record<string, string> = {
  IKA: "ME", MHD: "ME", IFN: "ME", SYZ: "ME", TBZ: "ME", DXB: "ME", AUH: "ME", SHJ: "ME",
  DOH: "ME", KWI: "ME", MCT: "ME", RUH: "ME", JED: "ME", DMM: "ME", BEY: "ME", AMM: "ME",
  BGW: "ME", EBL: "ME", TLV: "ME", IST: "ME", ESB: "ME", CAI: "ME",
  HND: "ASIA", KIX: "ASIA", NGO: "ASIA", CTS: "ASIA", ICN: "ASIA", PUS: "ASIA",
  PEK: "ASIA", PVG: "ASIA", CAN: "ASIA", SZX: "ASIA", CTU: "ASIA", HKG: "ASIA",
  TPE: "ASIA", SIN: "ASIA", KUL: "ASIA", BKK: "ASIA", HKT: "ASIA", CGK: "ASIA",
  DPS: "ASIA", MNL: "ASIA", SGN: "ASIA", HAN: "ASIA", DEL: "ASIA", BOM: "ASIA",
  BLR: "ASIA", MAA: "ASIA", HYD: "ASIA", CCU: "ASIA",
  LHR: "EU", MAN: "EU", CDG: "EU", AMS: "EU", FRA: "EU", MUC: "EU", BER: "EU",
  VIE: "EU", PRG: "EU", MAD: "EU", BCN: "EU", FCO: "EU", MXP: "EU", LIS: "EU",
  ATH: "EU", ARN: "EU", OSL: "EU", CPH: "EU", HEL: "EU", DUB: "EU", ZRH: "EU",
  JFK: "NA", LAX: "NA", ORD: "NA", IAH: "NA", DFW: "NA", SFO: "NA", SEA: "NA",
  MIA: "NA", BOS: "NA", IAD: "NA", ATL: "NA", DEN: "NA", YYZ: "NA", YUL: "NA",
  YVR: "NA", MEX: "NA", CUN: "NA",
};

function getRegion(iata: string): string {
  return REGION_MAP[iata] || "OTHER";
}

function getAirlinesForRoute(depIata: string, arrIata: string) {
  const depRegion = getRegion(depIata);
  const arrRegion = getRegion(arrIata);
  const airlines = [
    ...(AIRLINES_BY_REGION[depRegion] || []),
    ...(depRegion !== arrRegion ? (AIRLINES_BY_REGION[arrRegion] || []) : []),
    ...AIRLINES_BY_REGION["OTHER"],
  ];
  // Deduplicate
  const seen = new Set<string>();
  return airlines.filter(a => { if (seen.has(a.code)) return false; seen.add(a.code); return true; });
}

// Coordinate-based distance for realistic duration/price estimation
const IATA_COORDS: Record<string, [number, number]> = {
  IKA: [35.42, 51.15], DXB: [25.25, 55.37], DOH: [25.26, 51.61], IST: [41.28, 28.75],
  HND: [35.55, 139.78], KIX: [34.43, 135.24], ICN: [37.46, 126.44], PEK: [40.08, 116.60],
  PVG: [31.14, 121.81], HKG: [22.31, 113.92], SIN: [1.36, 103.99], BKK: [13.68, 100.75],
  KUL: [2.75, 101.71], DEL: [28.56, 77.10], BOM: [19.09, 72.87],
  LHR: [51.48, -0.46], CDG: [49.01, 2.55], AMS: [52.31, 4.76], FRA: [50.04, 8.56],
  FCO: [41.80, 12.24], MAD: [40.50, -3.57], BCN: [41.30, 2.08], ZRH: [47.46, 8.55],
  JFK: [40.64, -73.78], LAX: [33.94, -118.41], ORD: [41.97, -87.91], SFO: [37.62, -122.38],
  MIA: [25.80, -80.29], ATL: [33.64, -84.43], YYZ: [43.68, -79.62], YVR: [49.20, -123.18],
  SYD: [-33.94, 151.18], MEL: [-37.67, 144.84], NBO: [-1.32, 36.93], JNB: [-26.14, 28.25],
  GRU: [-23.44, -46.47], EZE: [-34.82, -58.54], CAI: [30.12, 31.41],
  RUH: [24.96, 46.70], AUH: [24.44, 54.65], BEY: [33.82, 35.49], TLV: [32.01, 34.89],
  MUC: [48.35, 11.79], VIE: [48.11, 16.57], PRG: [50.10, 14.26],
  GYD: [40.47, 50.05], TBS: [41.67, 44.95], EVN: [40.15, 44.40],
};

function estimateFlightDuration(depIata: string, arrIata: string): number {
  const from = IATA_COORDS[depIata];
  const to = IATA_COORDS[arrIata];
  if (!from || !to) return 180 + Math.floor(Math.random() * 300);
  const R = 6371;
  const dLat = (to[0] - from[0]) * Math.PI / 180;
  const dLon = (to[1] - from[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from[0] * Math.PI / 180) * Math.cos(to[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // ~850 km/h average, plus 30 min overhead
  return Math.round((km / 850) * 60) + 30;
}

function estimatePrice(durationMins: number, cabin: string): number {
  const basePerMin = 1.2 + Math.random() * 0.6;
  const base = Math.round(durationMins * basePerMin);
  const cabinMultiplier = cabin === "first" ? 4.5 : cabin === "business" ? 2.8 : cabin === "premium_economy" ? 1.6 : 1;
  return Math.round(base * cabinMultiplier);
}

function formatMinsToDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function generateFlightTime(baseHour: number): string {
  const h = (baseHour + Math.floor(Math.random() * 3)) % 24;
  const m = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][Math.floor(Math.random() * 12)];
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const STOP_CITIES: Record<string, string[]> = {
  ME: ["Dubai", "Doha", "Istanbul", "Abu Dhabi"],
  ASIA: ["Singapore", "Hong Kong", "Bangkok", "Seoul"],
  EU: ["Frankfurt", "Amsterdam", "London", "Paris"],
  NA: ["New York", "Chicago", "Los Angeles", "Toronto"],
  OTHER: ["Dubai", "Singapore", "London"],
};

export async function searchAviationstackFlights(
  originQuery: string,
  destQuery: string,
) {
  const dep_iata = await getIataCode(originQuery);
  const arr_iata = await getIataCode(destQuery);

  if (!dep_iata)
    return { error: `Could not find airport for "${originQuery}"` };
  if (!arr_iata) return { error: `Could not find airport for "${destQuery}"` };

  // First try the live API
  try {
    const res = await fetch(
      `http://api.aviationstack.com/v1/flights?access_key=${API_KEY}&dep_iata=${dep_iata}&arr_iata=${arr_iata}&limit=15`,
    );
    const json = await res.json();

    if (!json.error && json.data && json.data.length > 0) {
      const flightsData: Record<string, unknown>[] = json.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flights = flightsData.map((f: any, i: number) => {
        const airlineName: string = f.airline?.name || "Unknown Airline";
        const slug = airlineName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const dur = estimateFlightDuration(dep_iata, arr_iata);

        return {
          id: `av-${i}-${f.flight?.iata || "unknown"}`,
          airline: airlineName,
          logo: `https://logo.clearbit.com/${slug}.com`,
          flightNo: f.flight?.iata || f.flight?.number || "N/A",
          departTime: f.departure?.scheduled
            ? new Date(f.departure.scheduled).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "TBD",
          arriveTime: f.arrival?.scheduled
            ? new Date(f.arrival.scheduled).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "TBD",
          price: String(estimatePrice(dur, "economy")),
          duration: formatMinsToDuration(dur),
          durationMin: dur,
          stops: 0,
          stopCities: [],
          cabinClass: "economy",
          dep_iata,
          arr_iata,
        };
      });

      return { originIata: dep_iata, destIata: arr_iata, flights };
    }
  } catch {
    /* fall through to generated flights */
  }

  // Generate realistic flights based on route
  const airlines = getAirlinesForRoute(dep_iata, arr_iata);
  const baseDuration = estimateFlightDuration(dep_iata, arr_iata);
  const depRegion = getRegion(dep_iata);
  const arrRegion = getRegion(arr_iata);
  const cabins = ["economy", "premium_economy", "business", "first"];

  const flights = [];
  const departHours = [6, 7, 8, 9, 10, 11, 13, 14, 15, 17, 19, 21, 23];

  for (let i = 0; i < Math.min(airlines.length * 2, 12); i++) {
    const airline = airlines[i % airlines.length];
    const cabin = cabins[Math.floor(i / 3) % cabins.length];
    const stops = baseDuration > 600 ? (Math.random() > 0.5 ? 1 : 0) : (Math.random() > 0.8 ? 1 : 0);
    const totalDuration = baseDuration + (stops > 0 ? 90 + Math.floor(Math.random() * 120) : Math.floor(Math.random() * 30) - 15);
    const departHour = departHours[i % departHours.length];
    const departTime = generateFlightTime(departHour);
    const arriveMinutes = (departHour * 60) + totalDuration;
    const arriveHour = Math.floor(arriveMinutes / 60) % 24;
    const arriveTime = generateFlightTime(arriveHour);

    const stopCityPool = STOP_CITIES[depRegion !== arrRegion ? (Math.random() > 0.5 ? depRegion : arrRegion) : depRegion] || STOP_CITIES["OTHER"];
    const stopCities = stops > 0 ? [stopCityPool[Math.floor(Math.random() * stopCityPool.length)]] : [];

    flights.push({
      id: `gen-${i}-${airline.code}${100 + Math.floor(Math.random() * 900)}`,
      airline: airline.name,
      logo: airline.logo,
      flightNo: `${airline.code}${100 + Math.floor(Math.random() * 900)}`,
      departTime,
      arriveTime,
      price: String(estimatePrice(totalDuration, cabin)),
      duration: formatMinsToDuration(totalDuration),
      durationMin: totalDuration,
      stops,
      stopCities,
      cabinClass: cabin,
      dep_iata,
      arr_iata,
    });
  }

  return { originIata: dep_iata, destIata: arr_iata, flights };
}
