-- Seed Data for Construction Materials MarketPlace (Prices in INR ₹)

INSERT INTO categories (name, description, icon) VALUES
('Cement & Concrete', 'High-strength Portland cement, ready-mix binders, and concrete additives', 'layers'),
('Steel & Structural', 'Thermo-mechanically treated (TMT) rebars, structural I-beams, angles, and binding wire', 'shield'),
('Sand & Aggregates', 'River sand, manufactured sand (M-Sand), gravel, and coarse blue-metal aggregates', 'mountain'),
('Bricks & Blocks', 'Kiln-fired clay red bricks, AAC lightweight blocks, fly ash bricks, and solid pavers', 'box'),
('Tiles & Flooring', 'Vitrified porcelain floor tiles, glazed ceramic wall tiles, granite slabs, and paving stones', 'grid'),
('Pipes & Plumbing', 'Heavy-duty CPVC/UPVC water supply pipes, drainage fittings, and industrial conduits', 'wrench');

INSERT INTO sellers (name, business_name, email, phone, status, rating) VALUES
('Vikram Mehta', 'Prime Builders Supply', 'contact@primebuilders.com', '+91-98765-43210', 'APPROVED', 4.85),
('Sarah Jenkins', 'Apex Material Depot', 'sales@apexdepot.com', '+91-98765-43211', 'APPROVED', 4.65),
('Ramesh Patel', 'SolidGround Aggregates', 'orders@solidground.com', '+91-98765-43212', 'APPROVED', 4.90),
('Elena Rostova', 'Heritage Masonry & Tile', 'info@heritagemasonry.com', '+91-98765-43213', 'APPROVED', 4.45),
('David Chen', 'Titan Steel & Iron', 'dchen@titansteel.com', '+91-98765-43214', 'PENDING', 4.00),
('Marcus Vance', 'Blacklisted Materials Ltd', 'vance@blacklisted.com', '+91-98765-43215', 'REJECTED', 2.10);

INSERT INTO products (name, brand, description, unit, category_id, image_url) VALUES
('Portland Pozzolana Cement (PPC)', 'UltraTech', 'High-durability fly-ash based cement ideal for residential and commercial masonry and plastering.', '50kg Bag', 1, 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80'),
('Ordinary Portland Cement (OPC 53 Grade)', 'Ambuja', 'Fast-setting high compressive strength cement engineered for multi-story load-bearing RCC structures.', '50kg Bag', 1, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80'),
('TMT Rebar Fe-550D 12mm', 'Tata Tiscon', 'High ductility corrosion-resistant thermo-mechanically treated steel rebar for seismic safety.', 'Metric Ton', 2, 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=600&q=80'),
('Structural Steel I-Beam 200mm', 'Jindal Steel', 'Hot-rolled carbon structural steel beam providing superior vertical load resistance for industrial framing.', 'Piece', 2, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'),
('Coarse River Sand (M-Sand Grade)', 'RiverStone', 'Triple-washed and silt-free coarse construction sand optimized for slab concrete casting.', 'Metric Ton', 3, 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80'),
('Blue Metal Granite Aggregates 20mm', 'QuarryPro', 'Crushed angular hard granite stone aggregate conforming to ASTM concrete grading standards.', 'Metric Ton', 3, 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80'),
('Red Clay Kiln Burnt Bricks', 'Bharat Bricks', 'Hand-molded and kiln-fired natural clay building bricks offering 10.5 N/mm2 compressive strength.', '1000 Pieces', 4, 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80'),
('Autoclaved Aerated Concrete (AAC) Blocks', 'Magicrete', 'Ultra-lightweight thermal-insulating building blocks delivering 3x faster wall masonry construction.', 'Cubic Meter', 4, 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80'),
('Glazed Vitrified Floor Tiles 600x600mm', 'Kajaria', 'Mirror-finish stain-resistant double-charge porcelain vitrified tiles for heavy foot traffic.', 'Box (4 pcs)', 5, 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab00f?auto=format&fit=crop&w=600&q=80'),
('Anti-Skid Matte Ceramic Bathroom Tiles', 'Somany', 'Textured water-repellent ceramic tiles designed for wet zones, balconies, and utility washrooms.', 'Box (6 pcs)', 5, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'),
('CPVC High Pressure Water Pipe 1 inch', 'Astral', 'Lead-free hot and cold potable water plumbing pipe rated for 28 kg/cm2 working pressure.', '10ft Length', 6, 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=600&q=80'),
('Specialized Fire-Resistant Refractory Bricks', 'ThermalShield', 'Alumina refractory bricks rated for kilns and high-temperature furnace lining up to 1400°C.', '100 Pieces', 4, 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80');

-- Seller Listings (Prices in INR ₹)
-- Product 1: UltraTech PPC (Sellers 1, 2 approved active; Seller 3 inactive)
INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity, min_order_quantity, is_active, version) VALUES
(1, 1, 380.00, 850, 50, true, 0),
(2, 1, 365.00, 450, 25, true, 0), -- Lowest price in INR!
(3, 1, 395.00, 200, 20, false, 0); -- Inactive, must not be lowest or discovered

-- Product 2: Ambuja OPC 53 (Sellers 1, 2)
INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity, min_order_quantity, is_active, version) VALUES
(1, 2, 410.00, 600, 40, true, 0),
(2, 2, 430.00, 320, 20, true, 0);

-- Product 3: Tata Tiscon TMT (Sellers 1, 2 approved; Seller 5 PENDING)
INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity, min_order_quantity, is_active, version) VALUES
(1, 3, 58000.00, 45, 2, true, 0),
(2, 3, 59500.00, 60, 1, true, 0),
(5, 3, 55000.00, 120, 5, true, 0); -- Pending seller, must be EXCLUDED from discovery

-- Product 4: Jindal I-Beam (Seller 2)
INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity, min_order_quantity, is_active, version) VALUES
(2, 4, 8500.00, 80, 4, true, 0);

-- Product 5: River Sand (Sellers 1, 3)
INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity, min_order_quantity, is_active, version) VALUES
(1, 5, 1800.00, 250, 10, true, 0),
(3, 5, 1650.00, 600, 20, true, 0);

-- Product 6: Aggregates 20mm (Seller 1, 3 active; Seller 4 has insufficient stock)
INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity, min_order_quantity, is_active, version) VALUES
(1, 6, 1350.00, 180, 10, true, 0),
(3, 6, 1200.00, 500, 15, true, 0),
(4, 6, 1280.00, 8, 20, true, 0); -- stock (8) < min_order_quantity (20): INSUFFICIENT STOCK! Excluded from discovery!

-- Product 7: Red Clay Bricks (Sellers 4, 2)
INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity, min_order_quantity, is_active, version) VALUES
(4, 7, 7500.00, 40, 5, true, 0),
(2, 7, 7800.00, 25, 2, true, 0);

-- Product 8: AAC Blocks (Seller 4)
INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity, min_order_quantity, is_active, version) VALUES
(4, 8, 3200.00, 120, 10, true, 0);

-- Product 9: Kajaria Floor Tiles (Sellers 4, 2)
INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity, min_order_quantity, is_active, version) VALUES
(4, 9, 850.00, 350, 15, true, 0),
(2, 9, 890.00, 150, 10, true, 0);

-- Product 10: Somany Ceramic Tiles (Seller 4)
INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity, min_order_quantity, is_active, version) VALUES
(4, 10, 620.00, 220, 10, true, 0);

-- Product 11: Astral CPVC Pipe (Sellers 1, 2)
INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity, min_order_quantity, is_active, version) VALUES
(1, 11, 480.00, 400, 10, true, 0),
(2, 11, 455.00, 300, 20, true, 0);

-- Product 12: Specialized Refractory Bricks (Only Seller 5 PENDING and Seller 6 REJECTED have listings)
INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity, min_order_quantity, is_active, version) VALUES
(5, 12, 6500.00, 50, 1, true, 0), -- PENDING
(6, 12, 6200.00, 50, 1, true, 0); -- REJECTED
-- Therefore, Product 12 has NO eligible sellers in buyer discovery!
