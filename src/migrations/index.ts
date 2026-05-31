import * as migration_20260528_074946_r2_media_fields from './20260528_074946_r2_media_fields';
import * as migration_20260529_041500_arabic_translation_fields from './20260529_041500_arabic_translation_fields';
import * as migration_20260530_043000_city_hero_gallery from './20260530_043000_city_hero_gallery';
import * as migration_20260530_163000_guide_item_neighborhood_relationship from './20260530_163000_guide_item_neighborhood_relationship';

export const migrations = [
  {
    up: migration_20260528_074946_r2_media_fields.up,
    down: migration_20260528_074946_r2_media_fields.down,
    name: '20260528_074946_r2_media_fields'
  },
  {
    up: migration_20260529_041500_arabic_translation_fields.up,
    down: migration_20260529_041500_arabic_translation_fields.down,
    name: '20260529_041500_arabic_translation_fields'
  },
  {
    up: migration_20260530_043000_city_hero_gallery.up,
    down: migration_20260530_043000_city_hero_gallery.down,
    name: '20260530_043000_city_hero_gallery'
  },
  {
    up: migration_20260530_163000_guide_item_neighborhood_relationship.up,
    down: migration_20260530_163000_guide_item_neighborhood_relationship.down,
    name: '20260530_163000_guide_item_neighborhood_relationship'
  },
];
