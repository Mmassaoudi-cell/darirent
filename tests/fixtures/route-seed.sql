DELETE FROM users WHERE id IN ('route-owner', 'route-no-phone-owner', 'route-admin', 'route-renter');

INSERT INTO users (id, role, name, phone, email) VALUES
  ('route-owner', 'owner', 'Route Test Owner', '+21622000000', 'route-owner@example.test'),
  ('route-no-phone-owner', 'owner', 'No Phone Owner', NULL, 'route-no-phone@example.test'),
  ('route-admin', 'admin', 'Route Test Admin', NULL, 'route-admin@example.test');

INSERT INTO properties (
  id, owner_id, title, neighborhood, city, lat, lng, price_dt,
  deposit_dt, agency_fee_dt, size_m2, rooms, furnished, parking,
  elevator, description, status, is_preview
) VALUES
  ('route-no-phone', 'route-no-phone-owner', 'No Phone Listing', 'Test Quarter', 'Tunis', 36.86, 10.27, 900, 900, 0, 70, 'S+1', 0, 0, 0, '', 'published', 0),
  ('route-owned', 'route-owner', 'Owner Protected Listing', 'Test Quarter', 'Tunis', 36.86, 10.27, 1100, 1100, 0, 80, 'S+2', 0, 0, 0, '', 'published', 0),
  ('route-comp-1', 'route-owner', 'Comparable 1', 'Route Comps', 'Tunis', 36.86, 10.27, 1300, 0, 0, 100, 'S+2', 0, 0, 0, '', 'published', 0),
  ('route-comp-2', 'route-owner', 'Comparable 2', 'Route Comps', 'Tunis', 36.86, 10.27, 1320, 0, 0, 100, 'S+2', 0, 0, 0, '', 'published', 0),
  ('route-comp-3', 'route-owner', 'Comparable 3', 'Route Comps', 'Tunis', 36.86, 10.27, 1340, 0, 0, 100, 'S+2', 0, 0, 0, '', 'published', 0),
  ('route-comp-4', 'route-owner', 'Comparable 4', 'Route Comps', 'Tunis', 36.86, 10.27, 1360, 0, 0, 100, 'S+2', 0, 0, 0, '', 'published', 0),
  ('route-comp-5', 'route-owner', 'Comparable 5', 'Route Comps', 'Tunis', 36.86, 10.27, 1380, 0, 0, 100, 'S+2', 0, 0, 0, '', 'published', 0),
  ('route-comp-6', 'route-owner', 'Comparable 6', 'Route Comps', 'Tunis', 36.86, 10.27, 1400, 0, 0, 100, 'S+2', 0, 0, 0, '', 'published', 0),
  ('route-comp-7', 'route-owner', 'Comparable 7', 'Route Comps', 'Tunis', 36.86, 10.27, 1420, 0, 0, 100, 'S+2', 0, 0, 0, '', 'published', 0);
