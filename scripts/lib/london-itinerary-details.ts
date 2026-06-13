import type { Itinerary } from "../../src/lib/city-data";

type ItineraryPlanning = NonNullable<Itinerary["planning"]>;
type ItineraryDay = Itinerary["days"][number];

export type LondonItineraryDetail = {
  intro: string;
  planning: ItineraryPlanning;
  days: Array<
    Pick<
      ItineraryDay,
      | "breakfast"
      | "dayNumber"
      | "description"
      | "dinner"
      | "lunch"
      | "pacing"
      | "routeNotes"
      | "start"
      | "theme"
      | "transport"
    >
  >;
};

export const londonItineraryDetailsBySlug: Record<
  string,
  LondonItineraryDetail
> = {
  "classic-first-day": {
    intro:
      "This is the London headline day for first-time visitors: royal ceremony, Parliament, civic squares, theatreland, and a practical halal dinner zone without wasting the day on cross-city transfers. Treat Westminster and Covent Garden as one connected walking spine, with weather and crowd buffers built in.",
    planning: {
      stay:
        "Best base: Westminster, Victoria, Covent Garden, South Bank, Mayfair, or Paddington. These areas keep the morning transfer short and make the evening return simple.",
      transport:
        "Use the Tube or Elizabeth line to reach Westminster or St James's Park, then walk the central route. Save black cab, licensed private hire, or Tube hops for the final dinner return.",
      meals: {
        breakfast:
          "Eat before leaving the hotel so the morning can start at Westminster Abbey before queues and tour groups build.",
        lunch:
          "Use Covent Garden, Leicester Square, or a light cafe stop near Trafalgar Square; keep lunch flexible if Parliament Square is crowded.",
        dinner:
          "Finish with a verified halal dinner around Soho, Edgware Road, Mayfair, or Bayswater depending on where you are staying.",
      },
    },
    days: [
      {
        dayNumber: 1,
        theme: "Royal Westminster, civic London, and Covent Garden",
        description:
          "Begin with the symbolic capital around Westminster Abbey, Parliament, and St James's Park, then move toward Buckingham Palace, Trafalgar Square, and Covent Garden. The day should feel like a sequence of strong London scenes rather than a rushed checklist.",
        start:
          "Arrive around Westminster by 8:30 AM, with attraction tickets or timed-entry plans saved offline and rain layers ready.",
        transport:
          "Tube or Elizabeth line into central London, then mostly walking. Keep rides short and save them for the end of the day.",
        breakfast: "Hotel breakfast before departure.",
        lunch:
          "Covent Garden, Trafalgar Square, or a simple cafe break before the afternoon theatreland stretch.",
        dinner:
          "Verified halal dinner around Soho, Edgware Road, Mayfair, or Bayswater; book ahead on weekends.",
        pacing:
          "Full day but walkable. If crowds are heavy, keep Buckingham Palace exterior-only and protect the Covent Garden evening.",
        routeNotes:
          "Start with Westminster Abbey and Parliament exterior while the morning is calmer, cross through St James's Park to Buckingham Palace, then move by Trafalgar Square into Covent Garden. Keep the evening flexible for Soho, West End, or Edgware Road halal dining.",
      },
    ],
  },
  "muslim-heritage-day": {
    intro:
      "This route reads London through Muslim community life, migration, markets, masjids, and East End street history. Verify prayer access before entering mosques, keep meal choices current, and leave space for Whitechapel and Brick Lane to tell the story on foot.",
    planning: {
      stay:
        "Best base: City, Aldgate, Shoreditch, Stratford, Canary Wharf, or a central hotel with District, Hammersmith and City, Elizabeth line, or Overground access.",
      transport:
        "Use public transport to Whitechapel or Aldgate East, then walk short neighborhood segments. Avoid making this a car route because traffic and parking weaken the experience.",
      meals: {
        breakfast:
          "Eat before arriving, or keep breakfast simple near Whitechapel so the first mosque and market stops do not get delayed.",
        lunch:
          "Plan lunch around Whitechapel or Brick Lane, verifying halal status on the day and avoiding prayer-time pressure.",
        dinner:
          "Finish in Whitechapel, Green Street, Stratford, or Ilford Lane if you want a broader East London halal-food finish.",
      },
    },
    days: [
      {
        dayNumber: 1,
        theme: "East End Muslim life, markets, masjids, and food",
        description:
          "Use East London Mosque as the anchor, then connect Whitechapel Road, Brick Lane, Spitalfields, market streets, and halal dining clusters. The value is understanding how faith, migration, retail, food, and neighborhood identity overlap.",
        start:
          "Start mid-morning at Whitechapel or Aldgate East, checking prayer times and visitor etiquette before mosque stops.",
        transport:
          "Tube, Elizabeth line, Overground, or bus into Whitechapel, then walk. Use public transport again only if extending to Green Street, Stratford, or Ilford.",
        breakfast: "Hotel breakfast or a light Whitechapel cafe stop.",
        lunch: "Whitechapel or Brick Lane halal dining, verified before ordering.",
        dinner:
          "Stay in East London for a deeper halal-food evening, or shift to Green Street or Ilford Lane if your group wants a stronger South Asian dining cluster.",
        pacing:
          "Medium day. Keep mosque visits respectful and avoid entering during busy prayer periods unless you are praying.",
        routeNotes:
          "Begin with East London Mosque, move along Whitechapel Road, pause at Brick Lane Jamme Masjid and Old Spitalfields Market, then use Whitechapel Market and a verified halal restaurant as practical anchors. Extend east only if the group still has energy.",
      },
    ],
  },
  "family-museum-day": {
    intro:
      "This is the easiest London family day: world-class museums in South Kensington, short walking distances, indoor weather protection, and several nearby halal or family-friendly meal options. Build in stroller, toilet, snack, and prayer pauses.",
    planning: {
      stay:
        "Best base: South Kensington, Gloucester Road, Earl's Court, Kensington, Paddington, Knightsbridge, or a hotel with direct Piccadilly, District, or Circle line access.",
      transport:
        "Use the Tube to South Kensington, then walk through the museum quarter. Avoid taxis between museums unless accessibility needs require it.",
      meals: {
        breakfast:
          "Full breakfast before leaving, especially with younger children, because museum cafes can become crowded.",
        lunch:
          "Use museum cafes for speed or South Kensington and Knightsbridge halal options after confirming current status.",
        dinner:
          "Finish in South Kensington, Knightsbridge, Bayswater, or Edgware Road, choosing the shortest return route for tired children.",
      },
    },
    days: [
      {
        dayNumber: 1,
        theme: "South Kensington museums with family pacing",
        description:
          "Use the Natural History Museum as the emotional anchor, then choose the Science Museum or V&A according to your children and available energy. The route is intentionally compact, with prayer-aware pauses and dinner nearby.",
        start:
          "Arrive near opening time with timed tickets, snacks, water, and a clear agreement on the one must-see gallery.",
        transport:
          "Tube to South Kensington or Gloucester Road, then walking. Keep the evening return direct.",
        breakfast: "Hotel breakfast before departure.",
        lunch:
          "Museum cafe, South Kensington, or Knightsbridge; check halal status before relying on a restaurant.",
        dinner:
          "South Kensington, Knightsbridge, Bayswater, or Edgware Road, depending on the hotel direction.",
        pacing:
          "Family-friendly full day. Two museums are usually enough; three only works with older children and a slow lunch.",
        routeNotes:
          "Start with the Natural History Museum while attention is highest, add the Science Museum for hands-on learning, then use the V&A, a nearby halal meal, or a hotel return depending on energy. Keep prayer and stroller breaks planned, not improvised.",
      },
    ],
  },
  "royal-parks-and-mosque-day": {
    intro:
      "This day combines Regent's Park Mosque, green space, Marylebone, Oxford Street, Hyde Park, and Edgware Road dining. It is designed for Muslim travelers who want central London shopping and parks without losing prayer planning.",
    planning: {
      stay:
        "Best base: Marylebone, Paddington, Marble Arch, Mayfair, Bayswater, Regent's Park, or Baker Street.",
      transport:
        "Use the Tube to Baker Street, Regent's Park, or Great Portland Street, then walk and use short Tube hops for shopping fatigue or rain.",
      meals: {
        breakfast: "Eat before leaving or around Baker Street if starting later.",
        lunch:
          "Use Marylebone, Oxford Street department stores, or Edgware Road depending on prayer timing.",
        dinner:
          "Edgware Road or Bayswater is the natural halal dinner finish after Hyde Park or Oxford Street.",
      },
    },
    days: [
      {
        dayNumber: 1,
        theme: "Regent's Park Mosque, royal parks, shopping, and halal dining",
        description:
          "Begin with London Central Mosque and Regent's Park, then move through Marylebone toward Oxford Street and Regent Street. Finish around Hyde Park and Edgware Road so the day has a practical halal and hotel-return end point.",
        start:
          "Start around 9:30 AM at Regent's Park or London Central Mosque, checking prayer times if you intend to pray there.",
        transport:
          "Tube to Baker Street, Regent's Park, or Great Portland Street, then walking with optional short taxi or Tube hops.",
        breakfast: "Hotel breakfast or Baker Street cafe before the park and mosque stretch.",
        lunch:
          "Marylebone, Oxford Street, or Edgware Road, chosen around prayer time and shopping pace.",
        dinner: "Edgware Road or Bayswater for halal dining after Hyde Park or Marble Arch.",
        pacing:
          "Moderate day. Use park time as the reset between mosque, shopping, and dinner rather than treating it as extra walking.",
        routeNotes:
          "Begin at London Central Mosque and Regent's Park, continue through Marylebone, then use Oxford Street and Regent Street for shopping before ending near Hyde Park, Marble Arch, and Edgware Road halal restaurants.",
      },
    ],
  },
  "greenwich-day": {
    intro:
      "Greenwich works as a self-contained London day with river travel, maritime history, open parkland, market food, and big views back toward the city. It is especially good for families and repeat visitors because it feels different from Westminster and the West End.",
    planning: {
      stay:
        "Best base: South Bank, Westminster, Tower Bridge, Canary Wharf, Stratford, or any hotel with easy Jubilee line, DLR, Elizabeth line, or river pier access.",
      transport:
        "Use a Thames boat for the scenic version, or DLR and rail for the faster version. Keep return options flexible if weather changes.",
      meals: {
        breakfast:
          "Eat before boarding the boat or train so the first half of the day can focus on the river and museums.",
        lunch:
          "Use Greenwich Market or a nearby cafe, checking halal suitability rather than assuming every stall works.",
        dinner:
          "Return toward Canary Wharf, Whitechapel, Stratford, or central London for verified halal dinner choices.",
      },
    },
    days: [
      {
        dayNumber: 1,
        theme: "River arrival, maritime museums, park views, and market time",
        description:
          "Make the journey part of the day: arrive by river or DLR, then move through Cutty Sark, the National Maritime Museum, Greenwich Park, the Royal Observatory, and Greenwich Market. Keep the hill climb optional for children, elders, rain, or winter light.",
        start:
          "Start by late morning from Westminster, Tower, Canary Wharf, or Cutty Sark DLR, with return route checked before leaving.",
        transport:
          "Thames boat for atmosphere, DLR or rail for speed. Walking inside Greenwich is manageable but includes hills.",
        breakfast: "Hotel breakfast before departure.",
        lunch: "Greenwich Market or a planned nearby cafe with current halal checks.",
        dinner:
          "Greenwich if a suitable option is verified, otherwise return toward Canary Wharf, Whitechapel, Stratford, or central London.",
        pacing:
          "Comfortable full day. Skip the Observatory interior or park climb if weather or family energy dips.",
        routeNotes:
          "Arrive by Thames boat or DLR, visit Cutty Sark and the National Maritime Museum, walk into Greenwich Park for the view or Observatory, then use Greenwich Market before returning toward a verified halal dinner cluster.",
      },
    ],
  },
  "luxury-shopping-day": {
    intro:
      "This route is for visitors who want London retail at a polished pace: Knightsbridge, Sloane Street, Bond Street, Mayfair, and department-store browsing with prayer breaks, hotel drops, and dining reservations handled deliberately.",
    planning: {
      stay:
        "Best base: Knightsbridge, Mayfair, Hyde Park Corner, South Kensington, Marylebone, or a luxury hotel that can coordinate cars, reservations, and prayer-room requests.",
      transport:
        "Use short taxi, black cab, or Tube hops between Knightsbridge and Bond Street when bags, rain, or elders make walking uncomfortable.",
      meals: {
        breakfast: "Hotel breakfast before shopping appointments or department-store opening.",
        lunch:
          "Use Harrods, Knightsbridge, Mayfair, or a pre-booked halal-friendly restaurant; confirm halal or halal-by-request details before relying on it.",
        dinner:
          "Book an upscale halal or halal-by-request dinner in Mayfair, Knightsbridge, Bayswater, or South Kensington.",
      },
    },
    days: [
      {
        dayNumber: 1,
        theme: "Knightsbridge, Sloane Street, Bond Street, and Mayfair",
        description:
          "Start with Knightsbridge anchors, then move through Sloane Street or Harvey Nichols before shifting to Bond Street and Mayfair. Keep hotel drops and prayer pauses realistic so shopping does not become a tiring bag-carrying route.",
        start:
          "Start around opening time at Harrods or Harvey Nichols, with boutique appointments and dining reservations confirmed.",
        transport:
          "Short taxi or Tube hops, plus walking within each shopping cluster. Arrange hotel bag drops if purchases become heavy.",
        breakfast: "Hotel breakfast or a planned Knightsbridge cafe before stores open.",
        lunch: "Harrods, Knightsbridge, or Mayfair, with halal suitability confirmed in advance.",
        dinner:
          "Reserved halal or halal-by-request dinner in Mayfair, Knightsbridge, Bayswater, or South Kensington.",
        pacing:
          "Flexible premium day. Choose either Sloane Street or Selfridges if time is tight instead of forcing every retail zone.",
        routeNotes:
          "Begin in Knightsbridge with Harrods and Harvey Nichols, add Sloane Street if luxury boutiques matter, then move to Bond Street, Selfridges, or Mayfair. Build in prayer, hotel drop, and dinner reservation buffers.",
      },
    ],
  },
  "east-london-food-and-shopping-day": {
    intro:
      "This is London through halal food corridors and local shopping streets rather than postcard landmarks. It is most useful for Muslim travelers who want Stratford, Green Street, Whitechapel, Ilford Lane, or Walthamstow mapped as practical dining and retail clusters.",
    planning: {
      stay:
        "Best base: Stratford, Canary Wharf, City, Aldgate, Shoreditch, Whitechapel, or a central hotel with direct Elizabeth line, Central line, District line, or Overground access.",
      transport:
        "Use public transport between clusters and avoid trying to drive the full route. Pick two or three clusters, not all of East London in one day.",
      meals: {
        breakfast:
          "Eat near the hotel or keep breakfast light at Westfield Stratford before the food-heavy parts of the day.",
        lunch:
          "Use Whitechapel, Green Street, Ilford Lane, or Stratford depending on which cluster is your main anchor.",
        dinner:
          "Choose the strongest verified halal cluster for the evening rather than leaving dinner to the final stop by chance.",
      },
    },
    days: [
      {
        dayNumber: 1,
        theme: "Stratford, Green Street, Whitechapel, and halal food clusters",
        description:
          "Use Westfield Stratford for easy retail, then choose a food-led route through Green Street, Whitechapel, Ilford Lane, or Walthamstow. The best version is selective: a strong lunch cluster, one shopping stretch, one masjid or prayer-aware pause, and a dinner cluster.",
        start:
          "Start late morning at Stratford or Whitechapel, after checking the day's prayer times and deciding which two main clusters matter most.",
        transport:
          "Elizabeth line, Central line, District line, Overground, bus, or short rides. Keep route changes simple because cluster-hopping can eat time.",
        breakfast: "Hotel breakfast or a light Stratford or Whitechapel stop.",
        lunch: "Green Street, Whitechapel, Ilford Lane, or Stratford, verified on the day.",
        dinner:
          "Whitechapel, Ilford Lane, Walthamstow, or Green Street depending on final location and return route.",
        pacing:
          "Food and shopping day. Limit the route to two or three clusters so the day feels abundant rather than scattered.",
        routeNotes:
          "Use Stratford for shopping ease, Green Street or Whitechapel for South Asian retail and halal food, and Ilford Lane or Walthamstow only if you are intentionally extending the day. Verify halal status and opening hours before committing.",
      },
    ],
  },
  "sports-day": {
    intro:
      "London sports days work best when you choose one main venue, then build the rest of the day around transport, tour times, match security, and nearby halal food. Wembley, Wimbledon, Lord's, Tottenham, and the O2 are too spread out to treat as a single checklist.",
    planning: {
      stay:
        "Best base depends on the venue: Wembley or Marylebone for Wembley, Southfields or Earl's Court for Wimbledon, St John's Wood or Marylebone for Lord's, Stratford for Tottenham or the O2/Greenwich.",
      transport:
        "Use Tube, rail, DLR, or event-day public transport guidance. Avoid driving to major venues unless you have confirmed parking and event restrictions.",
      meals: {
        breakfast:
          "Eat before leaving for the venue, especially on match days when queues and security checks add time.",
        lunch:
          "Plan lunch near the venue or before arrival; stadium food may not meet halal needs unless verified.",
        dinner:
          "Use Wembley/Harrow, Tooting/Southfields options, Stratford, Whitechapel, or central London depending on the chosen venue.",
      },
    },
    days: [
      {
        dayNumber: 1,
        theme: "One major sports venue with halal dining nearby",
        description:
          "Pick the sports anchor first: Wembley for football and stadium tours, Wimbledon for tennis heritage, Lord's for cricket, Tottenham for football, or the O2/Greenwich for arena events. Then keep the rest of the day local enough that transport and security do not swallow the experience.",
        start:
          "Start around the confirmed tour, match, or event time, arriving early for security, bag rules, and station crowding.",
        transport:
          "Public transport first. Check event-day station guidance and allow a slower exit after matches or concerts.",
        breakfast: "Hotel breakfast before departure.",
        lunch:
          "Venue-area meal only if halal status is verified; otherwise eat before the event.",
        dinner:
          "Wembley/Harrow, Stratford, Whitechapel, Greenwich, or central London, matched to the chosen venue.",
        pacing:
          "One-anchor day. Do not combine Wembley and Wimbledon unless the goal is transit fatigue rather than sport.",
        routeNotes:
          "Choose one main venue, confirm tour or match timing, arrive early for security and station crowds, then pair the venue with a realistic halal-food cluster and mosque directory checks nearby.",
      },
    ],
  },
};
