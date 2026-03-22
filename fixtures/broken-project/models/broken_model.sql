-- This model references a non-existent model (broken ref)
{{ config(materialized='table') }}

SELECT
  u.user_id,
  p.product_name
FROM {{ ref('users') }} u
LEFT JOIN {{ ref('nonexistent_table') }} p
  ON u.user_id = p.user_id
