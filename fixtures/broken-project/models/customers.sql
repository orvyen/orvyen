-- This model has no tests
{{ config(materialized='table') }}

SELECT
  customer_id,
  ltrim(first_name) as first_name,
  ltrim(last_name) as last_name,
  CASE
    WHEN country = 'US' THEN 'United States'
    WHEN country = 'CA' THEN 'Canada'
    WHEN country = 'MX' THEN 'Mexico'
    WHEN country = 'UK' THEN 'United Kingdom'
    ELSE 'Other'
  END as region
FROM {{ source('raw', 'customers') }}
