-- Create quotes table for pricing-calculator-2.0
-- Run with: npm run create-quotes-table

CREATE TABLE IF NOT EXISTS main.default.quotes (
  id STRING NOT NULL,
  account_name STRING NOT NULL,
  deal_name STRING NOT NULL,
  opportunity_id STRING,
  pricing_options STRING COMMENT 'JSON array of selected options: Upfront, Annual, etc.',
  pricebook STRING NOT NULL,
  currency STRING NOT NULL,
  term_length INT NOT NULL,
  product_line_items STRING NOT NULL COMMENT 'JSON array of ProductLineItem',
  payment_option_pricing STRING NOT NULL COMMENT 'JSON array of PaymentOptionPricing',
  discounts STRING COMMENT 'JSON object of discount % by payment option',
  rebates_and_subsidies STRING COMMENT 'JSON object of RebatesAndSubsidies',
  notes STRING,
  pricing_expires_on STRING,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  created_by STRING NOT NULL
)
USING DELTA
TBLPROPERTIES (
  'delta.autoOptimize.optimizeWrite' = 'true',
  'delta.autoOptimize.autoCompact' = 'true'
)
COMMENT 'Pricing calculator quotes - synced from pricing-calculator-2.0 app';
