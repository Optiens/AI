-- Optiens IoT 水耕栽培 Supabaseスキーマ
-- D-02: Supabaseプロジェクト作成・テーブル設計
-- 作成日: 2026-03-27

-- ========================================
-- 1. センサーデータ（リアルタイム）
-- ========================================
CREATE TABLE sensor_data (
  id BIGSERIAL PRIMARY KEY,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id TEXT NOT NULL,          -- 'pi2', 'esp32-1' etc.
  sensor_type TEXT NOT NULL,        -- 'temperature', 'humidity', 'ec', 'ph', 'water_temp', 'co2', 'lux'
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,               -- '°C', '%', 'mS/cm', '', '°C', 'ppm', 'lux'
  location TEXT DEFAULT 'rack-1'    -- ラック識別
);

-- 時系列クエリ高速化
CREATE INDEX idx_sensor_data_time ON sensor_data (recorded_at DESC);
CREATE INDEX idx_sensor_data_type ON sensor_data (sensor_type, recorded_at DESC);

-- ========================================
-- 2. 栽培サイクル
-- ========================================
CREATE TABLE cycles (
  id SERIAL PRIMARY KEY,
  crop TEXT NOT NULL,                -- 'basil', 'microgreens', 'rukkola' etc.
  rack_id TEXT NOT NULL,             -- 'rack-1', 'rack-2' etc.
  seeded_at DATE NOT NULL,
  harvested_at DATE,
  harvest_weight_g NUMERIC,          -- 収穫重量(g)
  plant_count INT,                   -- 株数
  cost_electricity NUMERIC,          -- 電気代(円)
  cost_nutrient NUMERIC,             -- 養液代(円)
  cost_seed NUMERIC,                 -- 種子代(円)
  cost_water NUMERIC,                -- 水代(円)
  cost_labor NUMERIC,                -- 人件費(円)
  cost_depreciation NUMERIC,         -- 減価償却(円)
  notes TEXT
);

-- ========================================
-- 3. ユニットエコノミクス（サイクルごとに自動計算）
-- ========================================
CREATE VIEW unit_economics AS
SELECT
  c.id AS cycle_id,
  c.crop,
  c.rack_id,
  c.seeded_at,
  c.harvested_at,
  c.harvested_at - c.seeded_at AS cycle_days,
  c.harvest_weight_g,
  c.plant_count,
  -- 1株あたりコスト
  CASE WHEN c.plant_count > 0 THEN
    (COALESCE(c.cost_electricity, 0) + COALESCE(c.cost_nutrient, 0) +
     COALESCE(c.cost_seed, 0) + COALESCE(c.cost_water, 0) +
     COALESCE(c.cost_labor, 0) + COALESCE(c.cost_depreciation, 0))
    / c.plant_count
  END AS cost_per_plant,
  -- 1株あたり収穫量(g)
  CASE WHEN c.plant_count > 0 THEN
    c.harvest_weight_g / c.plant_count
  END AS yield_per_plant_g,
  -- 総コスト
  COALESCE(c.cost_electricity, 0) + COALESCE(c.cost_nutrient, 0) +
  COALESCE(c.cost_seed, 0) + COALESCE(c.cost_water, 0) +
  COALESCE(c.cost_labor, 0) + COALESCE(c.cost_depreciation, 0) AS total_cost
FROM cycles c;

-- ========================================
-- 4. アラート履歴
-- ========================================
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sensor_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  threshold_min NUMERIC,
  threshold_max NUMERIC,
  severity TEXT NOT NULL DEFAULT 'warning',  -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE
);

-- ========================================
-- 5. デバイス管理
-- ========================================
CREATE TABLE devices (
  id TEXT PRIMARY KEY,               -- 'pi1', 'pi2', 'esp32-1'
  name TEXT NOT NULL,
  type TEXT NOT NULL,                -- 'raspberry_pi', 'esp32', 'zigbee_switch'
  location TEXT,
  last_seen TIMESTAMPTZ,
  status TEXT DEFAULT 'unknown'      -- 'online', 'offline', 'unknown'
);

-- ========================================
-- 6. リード管理（飲食店事前登録）
-- ========================================
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restaurant_name TEXT NOT NULL,
  person_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  restaurant_type TEXT NOT NULL,       -- 'italian', 'french', 'japanese', 'cafe', 'hotel', 'other'
  location TEXT,
  herbs TEXT[],                         -- '{basil,microgreens,rukkola}'
  weekly_volume TEXT,                   -- 'under500g', '500g-1kg', '1kg-2kg', 'over2kg', 'unknown'
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',   -- 'new', 'contacted', 'sample_sent', 'regular', 'declined'
  notes TEXT,                           -- 内部メモ
  followed_up_at TIMESTAMPTZ           -- 最後にフォローした日時
);

CREATE INDEX idx_leads_status ON leads (status);
CREATE INDEX idx_leads_created ON leads (created_at DESC);

-- ========================================
-- 7. 電力ログ（Zigbeeスイッチ経由）
-- ========================================
CREATE TABLE power_log (
  id BIGSERIAL PRIMARY KEY,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id TEXT NOT NULL,           -- ZigbeeスイッチのデバイスID
  power_w NUMERIC,                   -- 消費電力(W)
  energy_kwh NUMERIC,                -- 累計電力量(kWh)
  state TEXT                         -- 'on', 'off'
);

CREATE INDEX idx_power_log_time ON power_log (recorded_at DESC);

-- ========================================
-- 7. RLS（Row Level Security）
-- ========================================
-- 公開ダッシュボード用: sensor_dataとcyclesは読み取りのみ公開
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sensor_data" ON sensor_data FOR SELECT USING (true);

ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cycles" ON cycles FOR SELECT USING (true);

-- 書き込みはサービスロールキーのみ（RPiからの書き込み）
CREATE POLICY "Service write sensor_data" ON sensor_data FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Service write cycles" ON cycles FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- alertsとpower_logも同様
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read alerts" ON alerts FOR SELECT USING (true);
CREATE POLICY "Service write alerts" ON alerts FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

ALTER TABLE power_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read power_log" ON power_log FOR SELECT USING (true);
CREATE POLICY "Service write power_log" ON power_log FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- ========================================
-- 8. Data API 明示GRANT
-- ========================================
-- Supabaseの2026年Data API変更に合わせ、publicスキーマの公開範囲を明示する。
-- 公開ダッシュボード用データは読み取りのみ公開し、書き込みはservice_role経由に限定する。
GRANT SELECT ON TABLE sensor_data, cycles, alerts, power_log, unit_economics TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sensor_data, cycles, alerts, power_log TO service_role;

-- 飲食店リード・デバイス管理はサーバー側のみから扱う。
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE leads, devices FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE leads, devices TO service_role;

-- serial/bigserial IDの採番に必要。
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
